const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePrefecture(value) {
  if (!value) return null;
  const compact = value.trim();

  // All 47 prefectures: short form → canonical form
  const map = new Map([
    ['北海道', '北海道'],
    ['青森', '青森県'], ['青森県', '青森県'],
    ['岩手', '岩手県'], ['岩手県', '岩手県'],
    ['宮城', '宮城県'], ['宮城県', '宮城県'],
    ['秋田', '秋田県'], ['秋田県', '秋田県'],
    ['山形', '山形県'], ['山形県', '山形県'],
    ['福島', '福島県'], ['福島県', '福島県'],
    ['茨城', '茨城県'], ['茨城県', '茨城県'],
    ['栃木', '栃木県'], ['栃木県', '栃木県'],
    ['群馬', '群馬県'], ['群馬県', '群馬県'],
    ['埼玉', '埼玉県'], ['埼玉県', '埼玉県'],
    ['千葉', '千葉県'], ['千葉県', '千葉県'],
    ['東京', '東京都'], ['東京都', '東京都'],
    ['神奈川', '神奈川県'], ['神奈川県', '神奈川県'],
    ['新潟', '新潟県'], ['新潟県', '新潟県'],
    ['富山', '富山県'], ['富山県', '富山県'],
    ['石川', '石川県'], ['石川県', '石川県'],
    ['福井', '福井県'], ['福井県', '福井県'],
    ['山梨', '山梨県'], ['山梨県', '山梨県'],
    ['長野', '長野県'], ['長野県', '長野県'],
    ['岐阜', '岐阜県'], ['岐阜県', '岐阜県'],
    ['静岡', '静岡県'], ['静岡県', '静岡県'],
    ['愛知', '愛知県'], ['愛知県', '愛知県'],
    ['三重', '三重県'], ['三重県', '三重県'],
    ['滋賀', '滋賀県'], ['滋賀県', '滋賀県'],
    ['京都', '京都府'], ['京都府', '京都府'],
    ['大阪', '大阪府'], ['大阪府', '大阪府'],
    ['兵庫', '兵庫県'], ['兵庫県', '兵庫県'],
    ['奈良', '奈良県'], ['奈良県', '奈良県'],
    ['和歌山', '和歌山県'], ['和歌山県', '和歌山県'],
    ['鳥取', '鳥取県'], ['鳥取県', '鳥取県'],
    ['島根', '島根県'], ['島根県', '島根県'],
    ['岡山', '岡山県'], ['岡山県', '岡山県'],
    ['広島', '広島県'], ['広島県', '広島県'],
    ['山口', '山口県'], ['山口県', '山口県'],
    ['徳島', '徳島県'], ['徳島県', '徳島県'],
    ['香川', '香川県'], ['香川県', '香川県'],
    ['愛媛', '愛媛県'], ['愛媛県', '愛媛県'],
    ['高知', '高知県'], ['高知県', '高知県'],
    ['福岡', '福岡県'], ['福岡県', '福岡県'],
    ['佐賀', '佐賀県'], ['佐賀県', '佐賀県'],
    ['長崎', '長崎県'], ['長崎県', '長崎県'],
    ['熊本', '熊本県'], ['熊本県', '熊本県'],
    ['大分', '大分県'], ['大分県', '大分県'],
    ['宮崎', '宮崎県'], ['宮崎県', '宮崎県'],
    ['鹿児島', '鹿児島県'], ['鹿児島県', '鹿児島県'],
    ['沖縄', '沖縄県'], ['沖縄県', '沖縄県']
  ]);

  if (map.has(compact)) return map.get(compact);

  for (const [key, normalized] of map.entries()) {
    if (compact.includes(key)) return normalized;
  }

  return compact;
}

function normalizeAkiyaText(value) {
  if (!value) return '';
  return value.replace(/空家/g, '空き家').replace(/空き家バンク/g, '空き家');
}

function normalizePriceYen(priceYen, priceRaw) {
  if (typeof priceYen === 'number' && Number.isFinite(priceYen)) {
    return priceYen;
  }

  if (!priceRaw) return null;
  const normalized = String(priceRaw).replace(/,/g, '').trim();
  if (/^\d+円$/.test(normalized)) return Number(normalized.replace('円', ''));
  if (/^\d+(\.\d+)?万円$/.test(normalized)) return Math.round(Number(normalized.replace('万円', '')) * 10000);
  if (/^\d+(\.\d+)?万$/.test(normalized)) return Math.round(Number(normalized.replace('万', '')) * 10000);
  return null;
}

function buildHashSignature(property) {
  const payload = {
    url: property.url || null,
    title: property.title || null,
    prefecture: property.prefecture || null,
    city: property.city || null,
    address_raw: property.address_raw || null,
    price_yen: property.price_yen || null,
    is_akiya: Boolean(property.is_akiya),
    has_building: Boolean(property.has_building),
    layout: property.layout || null,
    building_area_sqm: property.building_area_sqm || null,
    land_area_sqm: property.land_area_sqm || null,
    building_age: property.building_age || null,
    notes: property.notes || null,
    contact: property.contact || null,
    status_text: property.status_text || null
  };

  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function inferListingType(property, priceYen) {
  if (property.listing_type) return property.listing_type;
  if (priceYen === 0) return 'free';
  if (property.monthly_rent || /月額|賃料|家賃/.test(property.price_raw || '')) return 'rent';
  return 'sale';
}

function inferCategory(property, listingType, isAkiya) {
  if (property.category) return property.category;
  if (listingType === 'free') return 'free_property';
  if (isAkiya) return 'akiya_bank';
  if (listingType === 'rent') return 'cheap_rent';
  if (property.building_age && property.building_age >= 50) return 'kominka';
  return 'general';
}

function normalizeProperty(property) {
  const normalizedNotes = normalizeAkiyaText(property.notes || '');
  const normalizedTitle = normalizeAkiyaText(property.title || '');
  const prefecture = normalizePrefecture(property.prefecture || property.address_raw || '');
  const priceYen = normalizePriceYen(property.price_yen, property.price_raw);
  const isAkiya = Boolean(property.is_akiya) || /空き家/.test(`${normalizedTitle} ${normalizedNotes} ${property.status_text || ''}`);
  const hasBuilding = Boolean(property.has_building) || Boolean(property.building_area_sqm) || /戸建|家屋|住宅|古民家|建物/.test(`${normalizedTitle} ${normalizedNotes}`);
  const listingType = inferListingType(property, priceYen);
  const category = inferCategory(property, listingType, isAkiya);

  const normalized = {
    canonical_id: null,
    url: property.url || null,
    source: property.source || null,
    title: property.title || null,
    prefecture,
    city: property.city || null,
    address_raw: property.address_raw || null,
    price_yen: priceYen,
    listing_type: listingType,
    category,
    is_akiya: isAkiya,
    has_building: hasBuilding,
    layout: property.layout || null,
    building_area_sqm: property.building_area_sqm ?? null,
    land_area_sqm: property.land_area_sqm ?? null,
    building_age: property.building_age ?? null,
    notes: property.notes || null,
    contact: property.contact || null,
    image_urls: property.image_urls || [],
    inquiry_code: property.inquiry_code || null,
    status_text: property.status_text || null,
    sources: property.sources || [{ portalName: property.source || null, portalUrl: property.url || null }],
    exclude_reason: null,
    hash_signature: null,
    scraped_at: property.scraped_at || new Date().toISOString()
  };

  normalized.hash_signature = buildHashSignature(normalized);
  return normalized;
}

function decideExcludeReason(property, options) {
  const allowedPrefectures = new Set((options.prefectures || []).map(normalizePrefecture));
  const statusText = String(property.status_text || '');
  const combinedText = `${property.title || ''} ${property.address_raw || ''} ${property.notes || ''} ${property.status_text || ''}`;
  const excludeKeywords = options.exclude_keywords || [];

  if (!property.url || !property.source) return 'missing_required_fields';
  if (!property.prefecture || !allowedPrefectures.has(property.prefecture)) return 'out_of_area';
  if (property.price_yen == null) return 'price_unknown';
  if (property.price_yen > options.max_price) return 'price_over_limit';
  if (typeof options.min_land_area_sqm === 'number' && Number.isFinite(options.min_land_area_sqm)) {
    if (property.land_area_sqm == null) return 'land_area_unknown';
    if (property.land_area_sqm < options.min_land_area_sqm) return 'land_area_too_small';
  }
  if (excludeKeywords.some((keyword) => keyword && combinedText.includes(keyword))) return 'excluded_by_keyword';
  if (!property.is_akiya && options.require_akiya) return 'not_akiya';
  if (!property.has_building && options.require_building) return 'land_only';
  if (/成約済|受付終了|sold/i.test(statusText)) return 'contracted';
  return null;
}

function normalizeAndFilter(properties, options) {
  const accepted_properties = [];
  const rejected_properties = [];

  for (const property of properties) {
    const normalized = normalizeProperty(property);
    normalized.exclude_reason = decideExcludeReason(normalized, options);

    if (normalized.exclude_reason) {
      rejected_properties.push(normalized);
    } else {
      accepted_properties.push(normalized);
    }
  }

  return { accepted_properties, rejected_properties };
}

function loadInputProperties(fileArg) {
  const raw = fileArg
    ? fs.readFileSync(path.resolve(fileArg), 'utf8')
    : fs.readFileSync(0, 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.properties)) return parsed.properties;
  throw new Error('Input JSON must be an array or an object with a properties array');
}

function loadOptions() {
  const rootDir = path.resolve(__dirname, '..');
  const appConfigPath = fs.existsSync(path.join(rootDir, 'config', 'app.json'))
    ? path.join(rootDir, 'config', 'app.json')
    : path.join(rootDir, 'config', 'app.example.json');
  const appConfig = readJson(appConfigPath);
  return {
    prefectures: appConfig.targets.prefectures,
    max_price: appConfig.targets.max_price_yen,
    require_akiya: appConfig.targets.require_akiya,
    require_building: appConfig.targets.require_building
  };
}

function main() {
  const fileArg = process.argv[2];
  const properties = loadInputProperties(fileArg);
  const result = normalizeAndFilter(properties, loadOptions());
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

module.exports = {
  normalizeAndFilter,
  normalizeProperty,
  normalizePrefecture,
  normalizePriceYen,
  normalizeAkiyaText,
  buildHashSignature,
  decideExcludeReason,
  inferListingType,
  inferCategory
};
