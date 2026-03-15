const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePrefecture(value) {
  if (!value) return null;
  const compact = value.trim();
  const map = new Map([
    ['東京', '東京都'],
    ['東京都', '東京都'],
    ['神奈川', '神奈川県'],
    ['神奈川県', '神奈川県'],
    ['千葉', '千葉県'],
    ['千葉県', '千葉県'],
    ['埼玉', '埼玉県'],
    ['埼玉県', '埼玉県'],
    ['長野', '長野県'],
    ['長野県', '長野県']
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

function normalizeProperty(property) {
  const normalizedNotes = normalizeAkiyaText(property.notes || '');
  const normalizedTitle = normalizeAkiyaText(property.title || '');
  const prefecture = normalizePrefecture(property.prefecture || property.address_raw || '');
  const priceYen = normalizePriceYen(property.price_yen, property.price_raw);
  const isAkiya = Boolean(property.is_akiya) || /空き家/.test(`${normalizedTitle} ${normalizedNotes} ${property.status_text || ''}`);
  const hasBuilding = Boolean(property.has_building) || Boolean(property.building_area_sqm) || /戸建|家屋|住宅|古民家|建物/.test(`${normalizedTitle} ${normalizedNotes}`);

  const normalized = {
    canonical_id: null,
    url: property.url || null,
    source: property.source || null,
    title: property.title || null,
    prefecture,
    city: property.city || null,
    address_raw: property.address_raw || null,
    price_yen: priceYen,
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
  decideExcludeReason
};
