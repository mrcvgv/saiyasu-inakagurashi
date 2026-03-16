/**
 * 既存データをSupabaseにインポートするスクリプト
 *
 * Usage: node scripts/import-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://syxrzgmbzczuaapvxmrx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 都道府県名 → コードのマッピング
const PREF_MAP = {
  '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
  '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
  '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
  '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
  '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
  '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
  '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
  '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
  '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
  '鹿児島県': '46', '沖縄県': '47',
};

function inferListingType(item) {
  if (item.price === 0 || item.isFree) return 'free';
  if (item.monthlyRent) return 'rent';
  return 'sale';
}

function inferCategory(item) {
  if (item.isFree || item.price === 0) return 'free_property';
  if (item.sourceName && item.sourceName.includes('akiya')) return 'akiya_bank';
  if (item.isOldHouse && item.builtYear && (new Date().getFullYear() - item.builtYear >= 50)) return 'kominka';
  return 'general';
}

async function supabaseRequest(endpoint, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return res;
}

async function main() {
  // 物件データ
  const listingsPath = path.resolve(__dirname, '..', 'src', 'data', 'listings-live.json');
  if (!fs.existsSync(listingsPath)) {
    console.error('listings-live.json が見つかりません');
    process.exit(1);
  }
  const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));

  console.log(`${listings.length} 件の物件をインポートします...`);

  for (const item of listings) {
    const prefCode = PREF_MAP[item.prefecture];
    if (!prefCode) {
      console.log(`  SKIP: ${item.title} — 都道府県不明: ${item.prefecture}`);
      continue;
    }

    const row = {
      title: item.title || '物件情報',
      listing_type: inferListingType(item),
      category: inferCategory(item),
      status: 'active',
      price: item.price || 0,
      price_label: item.priceLabel || null,
      monthly_rent: item.monthlyRent || null,
      prefecture_code: prefCode,
      prefecture_name: item.prefecture,
      city: item.city || null,
      address: item.address || null,
      land_area_sqm: item.landArea || null,
      building_area_sqm: item.buildingArea || null,
      built_year: item.builtYear || null,
      description: item.description || null,
      image_url: item.imageUrl || null,
      tags: item.tags || [],
      is_cheap: item.price <= 1000000,
      is_free: item.price === 0,
      is_old_house: item.isOldHouse || false,
      is_diy_friendly: item.isDIYFriendly || false,
      source_name: item.sourceName || '',
      source_url: item.sourceUrl,
      source_type: 'akiya_portal',
      first_seen_at: item.createdAt || new Date().toISOString(),
      last_crawled_at: item.updatedAt || new Date().toISOString(),
    };

    try {
      await supabaseRequest('listings', row);
      console.log(`  OK: ${item.title}`);
    } catch (e) {
      console.log(`  ERR: ${item.title} — ${e.message}`);
    }
  }

  // 補助金データ
  const subsidies = [
    { prefecture: '長野県', city: '飯山市', title: '飯山市移住支援金', category: 'migration_support', amount_text: '最大100万円', max_amount: 1000000, conditions: '東京23区在住または通勤者、5年以上居住の意思があること', source_url: 'https://www.city.iiyama.nagano.jp/' },
    { prefecture: '高知県', city: '四万十市', title: '四万十市移住奨励金', category: 'migration_support', amount_text: '最大150万円（改修費補助含む）', max_amount: 1500000, conditions: '空き家バンク登録物件の購入、5年以上の定住意思', source_url: 'https://www.city.shimanto.lg.jp/' },
    { prefecture: '北海道', city: '深川市', title: '深川市定住促進助成金', category: 'housing_acquisition', amount_text: '最大50万円', max_amount: 500000, conditions: '市内に住宅を取得し、10年以上定住する意思があること', source_url: 'https://www.city.fukagawa.lg.jp/' },
    { prefecture: '千葉県', city: '南房総市', title: '南房総市空き家活用補助金', category: 'akiya_utilization', amount_text: '最大200万円（改修費の1/2）', max_amount: 2000000, conditions: '空き家バンク物件の購入者、改修後5年以上居住', source_url: 'https://www.city.minamiboso.chiba.jp/' },
    { prefecture: '秋田県', city: '横手市', title: '横手市移住・定住促進事業', category: 'migration_support', amount_text: '最大120万円（子育て加算含む）', max_amount: 1200000, conditions: '市外からの転入者、3年以上定住の意思', source_url: 'https://www.city.yokote.lg.jp/' },
    { prefecture: '大分県', city: '竹田市', title: '竹田市移住者住宅改修支援', category: 'renovation', amount_text: '最大100万円', max_amount: 1000000, conditions: '空き家バンク物件の活用、移住後3年以上の定住', source_url: 'https://www.city.taketa.oita.jp/' },
  ];

  console.log(`\n${subsidies.length} 件の補助金をインポートします...`);

  for (const s of subsidies) {
    const prefCode = PREF_MAP[s.prefecture];
    const row = {
      prefecture_code: prefCode,
      city: s.city,
      title: s.title,
      summary: s.conditions,
      category: s.category,
      amount_text: s.amount_text,
      max_amount: s.max_amount,
      conditions: s.conditions,
      source_url: s.source_url,
      is_active: true,
      fiscal_year: '2026',
    };
    try {
      await supabaseRequest('subsidies', row);
      console.log(`  OK: ${s.title}`);
    } catch (e) {
      console.log(`  ERR: ${s.title} — ${e.message}`);
    }
  }

  console.log('\nインポート完了');
}

main().catch(console.error);
