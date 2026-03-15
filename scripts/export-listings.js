/**
 * export-listings.js
 *
 * 空き家ハンターの SQLite DB から物件データを読み取り、
 * 最安田舎暮らしの Listing 型 JSON として出力する。
 *
 * 使い方:
 *   node scripts/export-listings.js
 *
 * 出力先:
 *   src/data/listings-live.json
 *
 * OpenClaw側のcronや手動実行後にこのスクリプトを走らせると、
 * Next.js側のデータが最新に更新される。
 */

const fs = require('fs');
const path = require('path');

// SQLite DB のパス（OpenClaw workspace内）
const DB_PATH = process.env.AKIYA_DB_PATH
  || path.resolve(process.env.HOME || '/home/koheisato', '.openclaw/workspace/data/akiya_hunter_v1.sqlite');

const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'listings-live.json');

function formatPriceLabel(priceYen) {
  if (priceYen === 0) return '0円';
  if (priceYen === null || priceYen === undefined) return '価格未定';
  const man = priceYen / 10000;
  return `${man}万円`;
}

function inferTags(row) {
  const tags = [];
  if (row.price_yen === 0) tags.push('0円');
  if (row.price_yen !== null && row.price_yen <= 500000) tags.push('激安');
  if (row.is_akiya) tags.push('空き家');
  if (row.building_age && row.building_age >= 50) tags.push('古民家');

  const notes = (row.notes || '').toLowerCase();
  const title = (row.title || '').toLowerCase();
  const text = notes + ' ' + title;

  if (text.includes('diy')) tags.push('DIY可');
  if (text.includes('海') || text.includes('ビーチ')) tags.push('海近');
  if (text.includes('山') || text.includes('高原')) tags.push('山あい');
  if (text.includes('温泉')) tags.push('温泉');
  if (text.includes('畑') || text.includes('農')) tags.push('畑付き');
  if (text.includes('平屋')) tags.push('平屋');
  if (text.includes('倉庫') || text.includes('車庫')) tags.push('倉庫付き');

  return [...new Set(tags)];
}

function convertRow(row) {
  const tags = inferTags(row);
  const priceYen = row.price_yen !== null ? row.price_yen : 0;

  return {
    id: String(row.id),
    title: row.title || '物件情報',
    price: priceYen,
    priceLabel: formatPriceLabel(row.price_yen),
    prefecture: row.prefecture || '',
    city: row.city || '',
    address: row.address_raw || undefined,
    landArea: row.land_area_sqm || undefined,
    buildingArea: row.building_area_sqm || undefined,
    builtYear: row.building_age
      ? new Date().getFullYear() - row.building_age
      : undefined,
    description: row.notes || undefined,
    imageUrl: parseImageUrls(row.image_urls_json)[0] || undefined,
    sourceName: row.source || '',
    sourceUrl: row.url || '',
    tags,
    isCheap: priceYen <= 1000000,
    isFree: priceYen === 0,
    isOldHouse: (row.building_age || 0) >= 40,
    isDIYFriendly: tags.includes('DIY可'),
    createdAt: row.first_seen_at || row.created_at || new Date().toISOString(),
    updatedAt: row.last_seen_at || row.updated_at || new Date().toISOString(),
  };
}

function parseImageUrls(json) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function main() {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch {
    // better-sqlite3 がなければ OpenClaw workspace の persistence を使う
    // フォールバック: history JSON から読む
    const historyPath = path.resolve(
      process.env.HOME || '/home/koheisato',
      '.openclaw/workspace/data/history/properties.latest.json'
    );

    if (!fs.existsSync(historyPath)) {
      console.error(`DB も history JSON も見つかりません: ${historyPath}`);
      process.exit(1);
    }

    console.log(`SQLite 不可。history JSON からエクスポート: ${historyPath}`);
    const properties = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const listings = properties.map((p, i) => {
      const priceYen = p.price_yen !== null ? p.price_yen : 0;
      const tags = [];
      if (priceYen === 0) tags.push('0円');
      if (priceYen <= 500000) tags.push('激安');
      if (p.is_akiya) tags.push('空き家');

      return {
        id: String(p.canonical_id || i + 1),
        title: p.title || '物件情報',
        price: priceYen,
        priceLabel: formatPriceLabel(p.price_yen),
        prefecture: p.prefecture || '',
        city: p.city || '',
        address: p.address_raw || undefined,
        landArea: p.land_area_sqm || undefined,
        buildingArea: p.building_area_sqm || undefined,
        builtYear: p.building_age
          ? new Date().getFullYear() - p.building_age
          : undefined,
        description: p.notes || undefined,
        imageUrl: (p.image_urls || [])[0] || undefined,
        sourceName: p.source || '',
        sourceUrl: p.url || '',
        tags,
        isCheap: priceYen <= 1000000,
        isFree: priceYen === 0,
        isOldHouse: (p.building_age || 0) >= 40,
        isDIYFriendly: tags.includes('DIY可'),
        createdAt: p.scraped_at || new Date().toISOString(),
        updatedAt: p.scraped_at || new Date().toISOString(),
      };
    });

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(listings, null, 2) + '\n', 'utf8');
    console.log(`${listings.length} 件の物件を出力しました → ${OUTPUT_PATH}`);
    return;
  }

  // better-sqlite3 が使える場合
  if (!fs.existsSync(DB_PATH)) {
    console.error(`DB が見つかりません: ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const rows = db.prepare(`
    SELECT * FROM properties
    WHERE price_yen <= 10000000
    ORDER BY last_seen_at DESC
  `).all();
  db.close();

  const listings = rows.map(convertRow);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(listings, null, 2) + '\n', 'utf8');
  console.log(`${listings.length} 件の物件を出力しました → ${OUTPUT_PATH}`);
}

main();
