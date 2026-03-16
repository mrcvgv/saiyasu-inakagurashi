#!/usr/bin/env node
/*
 * 今日これだけやれ — 汎用の意味抽出スクレイパー
 *
 * 個別サイト専用パーサーは作らず、以下の汎用手順で処理する:
 * - 入口URLを取得
 * - 一覧/カテゴリ/詳細っぽいリンクを一般ルールで発見
 * - 詳細ページ本文からラベル・文脈ベースで意味抽出
 * - listings-live.json に追記
 * - Supabase に upsert
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LISTINGS_PATH = path.join(ROOT, 'src', 'data', 'listings-live.json');
const REGISTRY_PATH = path.join(ROOT, 'saiyasu-crawler-config', 'akiya-bank-registry.json');
const REPORT_PATH = path.join(ROOT, 'src', 'data', 'scrape-report-today.json');

const SUPABASE_URL = 'https://syxrzgmbzczuaapvxmrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YcllDJu24XSTAej_EzMNKQ_BlynEIpR';

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県'
];

const PREF_CODE = Object.fromEntries(PREFECTURES.map((name, idx) => [name, String(idx + 1).padStart(2, '0')]));

const SOURCES = [
  { name: 'ieichiba', seeds: ['https://www.ieichiba.com/'], detailAllow: /\/project\//, detailDeny: /\/reviews\/|\/blog\/|\/case\/|\/towns\/|\/thanks-letter\/|\/tags\/|\/open-messages\/|\/akiyabank$/ },
  { name: 'zero_estate', seeds: ['https://zero.estate/'], detailAllow: /https:\/\/zero\.estate\/zero\//, detailDeny: /\/category\// },
  { name: 'inakagurashi', seeds: ['https://www.inakagurashi.jp/'], detailAllow: /\/estate\// },
  { name: 'inakanet', seeds: ['https://www.inakanet.jp/'], detailAllow: /DataNum=\d+/ },
  { name: 'jmty_realestate', seeds: ['https://jmty.jp/all/est'], detailAllow: /\/article-|alliance-h_/, detailDeny: /\/all\/|\/est-kw-|\/g-\d+|\/s-\d+/ },
  { name: 'athome_akiya', seeds: ['https://www.akiya-athome.jp/', 'https://www.akiya-athome.jp/bukken/search/list/?br_kbn=buy&sbt_kbn=buy&search_type=freeword&freeword=100%E4%B8%87%E5%86%86%E4%BB%A5%E4%B8%8B'], detailAllow: /\/bukken\/detail\// },
  { name: 'bit_courts', seeds: ['https://www.bit.courts.go.jp/'], detailAllow: /\/app\// }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; HorigidashiSemanticCrawler/0.1; +https://openclaw.ai)'
    },
    redirect: 'follow'
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, url: res.url, text, headers: res.headers };
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function normalizeText(text) {
  return stripTags(text).replace(/\s+/g, ' ').trim();
}

function uniq(arr) {
  return [...new Set(arr)];
}

function extractAnchors(html, baseUrl) {
  const out = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl).toString();
      out.push({ url, text: normalizeText(match[2]) });
    } catch {
      // ignore
    }
  }
  return out;
}

function titleFromHtml(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    || '';
  return normalizeText(title);
}

function metaDescription(html) {
  return normalizeText(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
}

function extractImages(html, pageUrl) {
  const images = [];
  const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const src = new URL(match[1], pageUrl).toString();
      if (/logo|icon|banner|sprite|button|print|header|footer|loading|blank|clearspacer/i.test(src)) continue;
      if (!images.includes(src)) images.push(src);
    } catch {
      // ignore
    }
  }
  return images;
}

function extractFirst(regexes, text) {
  for (const regex of regexes) {
    const m = text.match(regex);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function parsePrice(text) {
  const normalized = String(text || '').replace(/,/g, '');
  const rent = normalized.match(/(?:賃料|家賃)[:：\s]*([0-9]+(?:\.[0-9]+)?)\s*万円/);
  if (rent) return { price: Math.round(Number(rent[1]) * 10000), label: `${rent[1]}万円`, listingType: 'rent' };
  const rentYen = normalized.match(/(?:賃料|家賃)[:：\s]*([0-9]{4,})\s*円/);
  if (rentYen) return { price: Number(rentYen[1]), label: `${rentYen[1]}円`, listingType: 'rent' };
  if (/0円|無償|無料/.test(normalized)) return { price: 0, label: '0円', listingType: 'sale' };
  const man = normalized.match(/(?:価格|売買価格|売却価格)?[:：\s]*([0-9]+(?:\.[0-9]+)?)\s*万円/);
  if (man) return { price: Math.round(Number(man[1]) * 10000), label: `${man[1]}万円`, listingType: 'sale' };
  const yen = normalized.match(/(?:価格|売買価格|売却価格)?[:：\s]*([0-9]{4,})\s*円/);
  if (yen) return { price: Number(yen[1]), label: `${yen[1]}円`, listingType: 'sale' };
  return { price: null, label: null, listingType: 'sale' };
}

function parseArea(label, text) {
  const patterns = [
    new RegExp(`${label}[^\d]{0,20}(\d+(?:\.\d+)?)\s*㎡`),
    new RegExp(`${label}[^\d]{0,20}(\d+(?:\.\d+)?)\s*m2`, 'i')
  ];
  const raw = extractFirst(patterns, text);
  return raw ? Number(raw) : null;
}

function parseBuiltYear(text) {
  const year = extractFirst([/((?:19|20)\d{2})年/], text);
  if (year) return Number(year);
  const wareki = text.match(/昭和\s*(\d+)年/);
  if (wareki) return 1925 + Number(wareki[1]);
  const heisei = text.match(/平成\s*(\d+)年/);
  if (heisei) return 1988 + Number(heisei[1]);
  const reiwa = text.match(/令和\s*(\d+)年/);
  if (reiwa) return 2018 + Number(reiwa[1]);
  return null;
}

function parseLayout(text) {
  return extractFirst([/(\d+[SLDKR]+(?:\+S)?)/i], text);
}

function extractLabeledValue(text, labels) {
  for (const label of labels) {
    const m = text.match(new RegExp(`(?:${label})[:：\s]*([^\n]{2,80})`));
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function parseAddress(text) {
  const labeled = extractLabeledValue(text, ['所在地', '住所', '物件所在地']);
  const target = labeled || text;
  const pref = PREFECTURES.find((p) => target.includes(p)) || null;
  if (!pref) return { prefecture: null, city: null, address: labeled || null };
  const after = target.slice(target.indexOf(pref) + pref.length);
  const city = after.match(/^([^\s、,。]{1,20}(?:市|区|町|村|郡[^\s、,。]{1,20}(?:町|村)))/)?.[1] || null;
  const addressRegex = new RegExp(`${pref}[^\n]{0,80}`);
  const address = target.match(addressRegex)?.[0]?.trim() || labeled || null;
  return { prefecture: pref, city, address };
}

function looksLikeDetail(url, text, source) {
  if (source?.detailAllow && !source.detailAllow.test(url)) return false;
  if (source?.detailDeny && source.detailDeny.test(url)) return false;
  return /\/project\/|\/property\/|\/article-|\/bukken\/detail\/|DataNum=|\/zero\//.test(url)
    || /(万円|円|物件|賃貸|売買|戸建|土地|古民家|空き家)/.test(text || '');
}

function looksLikePagination(url, text) {
  return /page=\d+|\/page\/\d+/.test(url) || /(次へ|次のページ|もっと見る|一覧|検索結果)/.test(text || '');
}

function shouldKeepListing(candidate) {
  if (!candidate.sourceUrl) return false;
  if (!candidate.title && candidate.price == null) return false;
  if (!candidate.prefecture && !candidate.address) return false;
  if (/体験談|ブログ|お知らせ|田舎図鑑|買います|幸福論/.test(candidate.title || '')) return false;
  if (candidate.sourceName === 'jmty_realestate' && !/\/article-|alliance-h_/.test(candidate.sourceUrl)) return false;
  if (candidate.sourceName === 'ieichiba' && !/\/project\//.test(candidate.sourceUrl)) return false;
  if (candidate.sourceName === 'zero_estate' && !/https:\/\/zero\.estate\/zero\//.test(candidate.sourceUrl)) return false;
  if (candidate.sourceName === 'inakanet' && !/DataNum=\d+/.test(candidate.sourceUrl)) return false;
  return true;
}

function semanticExtractListing(html, pageUrl, sourceName) {
  const text = normalizeText(html);
  const title = titleFromHtml(html);
  const desc = metaDescription(html) || text.slice(0, 280);
  const { price, label, listingType } = parsePrice(`${title} ${text}`);
  const { prefecture, city, address } = parseAddress(text);
  const landArea = parseArea('土地面積|敷地面積', text);
  const buildingArea = parseArea('建物面積|延床面積|専有面積|使用部分面積', text);
  const builtYear = parseBuiltYear(text);
  const layout = parseLayout(`${title} ${text}`);
  const images = extractImages(html, pageUrl);
  const lower = `${title} ${text}`;

  const listing = {
    id: '',
    title: title || '物件情報',
    price,
    priceLabel: label || (price === 0 ? '0円' : ''),
    prefecture,
    city: city || '',
    address: address || undefined,
    landArea: landArea ?? undefined,
    buildingArea: buildingArea ?? undefined,
    builtYear: builtYear ?? undefined,
    description: desc || undefined,
    imageUrl: images[0] || undefined,
    sourceName,
    sourceUrl: pageUrl,
    tags: uniq([
      /空き家/.test(lower) ? '空き家' : null,
      price === 0 ? '0円物件' : null,
      price != null && price <= 1000000 ? '激安' : null,
      /DIY/.test(lower) ? 'DIY可' : null,
      listingType === 'rent' ? '賃貸' : '売買'
    ].filter(Boolean)),
    isCheap: price != null && price <= 1000000,
    isFree: price === 0,
    isOldHouse: builtYear != null && (new Date().getFullYear() - builtYear >= 40),
    isDIYFriendly: /DIY|セルフリノベ|改修|リフォーム素材/.test(lower),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _listingType: listingType,
    _status: /成約済|受付終了|終了/.test(lower) ? 'closed' : 'active'
  };

  return listing;
}

async function discoverSourceListings(source) {
  const failures = [];
  const visited = new Set();
  const queue = [...source.seeds];
  const detailUrls = new Set();
  let listPages = 0;

  while (queue.length > 0 && visited.size < 20 && detailUrls.size < 120) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await fetchText(url);
      if (!res.ok) {
        failures.push({ url, reason: `HTTP ${res.status}` });
        continue;
      }
      const finalUrl = res.url;
      const html = res.text;
      const anchors = extractAnchors(html, finalUrl);
      listPages += 1;

      for (const anchor of anchors) {
        try {
          const sameHost = new URL(anchor.url).host === new URL(finalUrl).host || source.name === 'zero_estate' || source.name === 'athome_akiya';
          if (!sameHost && !/akiya-athome\.jp$|ieichiba\.com$|zero\.estate$|jmty\.jp$|inakanet\.jp$|bit\.courts\.go\.jp$/.test(new URL(anchor.url).host)) continue;
        } catch {
          continue;
        }

        if (looksLikeDetail(anchor.url, anchor.text, source)) detailUrls.add(anchor.url);
        if (looksLikePagination(anchor.url, anchor.text) && !visited.has(anchor.url) && queue.length < 30) queue.push(anchor.url);
        if (/\/category\/zero\//.test(anchor.url) && !visited.has(anchor.url) && queue.length < 30) queue.push(anchor.url);
        if (/\/all\/est|\/est-|\/keyword_rank\/est/.test(anchor.url) && !visited.has(anchor.url) && queue.length < 30) queue.push(anchor.url);
      }
    } catch (error) {
      failures.push({ url, reason: error.message });
    }
  }

  const listings = [];
  const detailFailures = [];

  for (const detailUrl of [...detailUrls].slice(0, 80)) {
    try {
      const res = await fetchText(detailUrl);
      if (!res.ok) {
        detailFailures.push({ url: detailUrl, reason: `HTTP ${res.status}` });
        continue;
      }
      const listing = semanticExtractListing(res.text, res.url, source.name);
      if (listing._status !== 'active') continue;
      if (shouldKeepListing(listing)) listings.push(listing);
    } catch (error) {
      detailFailures.push({ url: detailUrl, reason: error.message });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const item of listings) {
    if (seen.has(item.sourceUrl)) continue;
    seen.add(item.sourceUrl);
    unique.push(item);
  }

  return {
    source: source.name,
    seedCount: source.seeds.length,
    visitedPages: visited.size,
    listPages,
    detailCandidates: detailUrls.size,
    listingCount: unique.length,
    listings: unique,
    failures: [...failures, ...detailFailures]
  };
}

function mergeListings(existing, fresh) {
  const map = new Map(existing.map((item) => [item.sourceUrl, item]));
  let newCount = 0;
  for (const item of fresh) {
    const clean = { ...item };
    delete clean._listingType;
    delete clean._status;
    if (!map.has(clean.sourceUrl)) {
      clean.id = String(map.size + 1);
      newCount += 1;
    } else {
      clean.id = map.get(clean.sourceUrl).id;
      clean.createdAt = map.get(clean.sourceUrl).createdAt;
    }
    map.set(clean.sourceUrl, clean);
  }
  return { merged: [...map.values()], newCount };
}

function ensureFile(filePath, fallback) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
}

function loadJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function buildSupabaseRow(item) {
  const prefCode = item.prefecture ? PREF_CODE[item.prefecture] : null;
  return {
    title: item.title || '物件情報',
    listing_type: item.tags.includes('賃貸') ? 'rent' : item.isFree ? 'free' : 'sale',
    category: item.isFree ? 'free_property' : item.sourceName.includes('akiya') ? 'akiya_bank' : 'general',
    status: 'active',
    price: item.price || 0,
    price_label: item.priceLabel || null,
    monthly_rent: item.tags.includes('賃貸') ? item.price || null : null,
    prefecture_code: prefCode,
    prefecture_name: item.prefecture || null,
    city: item.city || null,
    address: item.address || null,
    land_area_sqm: item.landArea || null,
    building_area_sqm: item.buildingArea || null,
    built_year: item.builtYear || null,
    description: item.description || null,
    image_url: item.imageUrl || null,
    tags: item.tags || [],
    is_cheap: Boolean(item.isCheap),
    is_free: Boolean(item.isFree),
    is_old_house: Boolean(item.isOldHouse),
    is_diy_friendly: Boolean(item.isDIYFriendly),
    source_name: item.sourceName,
    source_url: item.sourceUrl,
    source_type: 'semantic_scrape',
    first_seen_at: item.createdAt,
    last_crawled_at: item.updatedAt
  };
}

async function pushSupabase(listings) {
  const rows = listings.filter((item) => item.prefecture && PREF_CODE[item.prefecture]).map(buildSupabaseRow);
  if (rows.length === 0) return { attempted: 0, ok: true, error: null };

  let attempted = 0;
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20).map((row) => JSON.parse(JSON.stringify(row)));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/listings?on_conflict=source_url`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      return { attempted, ok: false, error: `${res.status} ${await res.text()}` };
    }
    attempted += batch.length;
  }

  return { attempted, ok: true, error: null };
}

function updateRegistry(report) {
  const registry = loadJson(REGISTRY_PATH, { _meta: {}, prefecture_aggregators: [], banks: [] });
  registry._meta.updated_at = new Date().toISOString().slice(0, 10);
  registry._meta.today_semantic_scrape = report;
  registry.banks = registry.banks || [];

  for (const site of report.sites) {
    const idx = registry.banks.findIndex((item) => item.source_name === site.source);
    const entry = {
      prefecture: '全国',
      city: null,
      akiya_bank_url: SOURCES.find((s) => s.name === site.source)?.seeds?.[0] || null,
      domain_type: 'external_portal',
      source_name: site.source,
      status: site.listingCount > 0 ? 'live' : 'blocked',
      parser_type: 'semantic',
      discovered_at: new Date().toISOString().slice(0, 10),
      notes: site.listingCount > 0
        ? `semantic scrape: ${site.listingCount} listings, failures=${site.failures.length}`
        : `semantic scrape failed: ${site.failures.map((f) => f.reason).slice(0, 3).join('; ')}`
    };
    if (idx >= 0) registry.banks[idx] = { ...registry.banks[idx], ...entry };
    else registry.banks.push(entry);
  }

  saveJson(REGISTRY_PATH, registry);
}

async function main() {
  const existing = loadJson(LISTINGS_PATH, []);
  const siteReports = [];
  const freshListings = [];

  for (let i = 0; i < SOURCES.length; i += 1) {
    const source = SOURCES[i];
    const report = await discoverSourceListings(source);
    siteReports.push(report);
    freshListings.push(...report.listings);
    if (i < SOURCES.length - 1) await sleep(11000);
  }

  const { merged, newCount } = mergeListings(existing, freshListings);
  saveJson(LISTINGS_PATH, merged);

  const supabase = await pushSupabase(freshListings);

  const report = {
    executedAt: new Date().toISOString(),
    processedSites: SOURCES.length,
    scrapedListings: freshListings.length,
    newListings: newCount,
    supabase,
    failedSites: siteReports.filter((s) => s.listingCount === 0).map((s) => ({ source: s.source, failures: s.failures })),
    sites: siteReports
  };

  saveJson(REPORT_PATH, report);
  updateRegistry(report);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
