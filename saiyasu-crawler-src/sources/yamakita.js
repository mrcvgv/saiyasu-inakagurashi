/**
 * yamakita_akiya source — listing + detail strategies for Yamakita town
 * (山北町, Kanagawa prefecture) municipal akiya bank.
 *
 * Listing page: https://www.town.yamakita.kanagawa.jp/category/13-1-2-0-0.html
 *   - Properties listed as <ul><li><a> links
 *   - Link text format: "空き家バンク情報【昭和48年9月築：敷地320㎡：2DK：450万円】三保地区"
 *
 * Detail pages: https://www.town.yamakita.kanagawa.jp/0000006964.html
 *   - Bullet-point format: ・住所：, ・構造：, ・間取り：, ・価格：, etc.
 */

const {
  registerListingStrategy,
  registerDetailStrategy
} = require('../source_registry');

const {
  extractAnchors,
  stripTags,
  decodeHtml,
  matchOne,
  parsePriceYen,
  parseAreaValue,
  parseAddressParts,
  parseConstructionYear,
  extractMetaContent
} = require('../parse_helpers');

// ---------------------------------------------------------------------------
// Listing strategy
// ---------------------------------------------------------------------------

/**
 * Parse the listing page text to extract price from formats like:
 *   "580万円⇒450万円" (price drop) or "450万円"
 * Returns the final (current) price string.
 */
function extractListingPrice(text) {
  // Price-drop format: old⇒new
  const dropMatch = text.match(/⇒\s*([0-9,]+万円)/);
  if (dropMatch) return dropMatch[1];

  // Single price
  const singleMatch = text.match(/([0-9,]+万円)/);
  return singleMatch ? singleMatch[1] : null;
}

function extractYamakitaListings(html, baseUrl, sourceName) {
  const anchors = extractAnchors(html, baseUrl);
  const now = new Date().toISOString();
  const seen = new Set();
  const candidates = [];

  for (const anchor of anchors) {
    // Only match akiya bank property links (numeric ID pages with 空き家バンク in text)
    if (!/\/\d{10}\.html/.test(anchor.url)) continue;
    if (!/空き家バンク情報/.test(anchor.text)) continue;
    if (seen.has(anchor.url)) continue;
    seen.add(anchor.url);

    candidates.push({
      source_name: sourceName,
      listing_url: anchor.url,
      title: anchor.text || sourceName,
      price_raw: extractListingPrice(anchor.text),
      location_raw: '神奈川県',
      discovered_at: now
    });
  }

  return candidates;
}

registerListingStrategy('yamakita_listing', extractYamakitaListings);

// ---------------------------------------------------------------------------
// Detail strategy
// ---------------------------------------------------------------------------

/**
 * Extract a bullet-point value from municipal detail page.
 * Matches patterns like "・住所：山北町中川649-8" or "・価格：450万円"
 */
function extractBulletValue(text, label) {
  const regex = new RegExp(`・?${label}[：:]\\s*([^\n・]+)`);
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractYamakitaProperty(html, url) {
  const decoded = decodeHtml(html);
  const bodyText = stripTags(decoded);
  const pageTitle = decodeHtml(
    extractMetaContent(html, 'og:title') ||
    matchOne(html, /<title>([^<]+)<\/title>/) ||
    ''
  );

  const addressRaw = extractBulletValue(bodyText, '住所') || extractBulletValue(bodyText, '所在地');
  const priceRaw = extractBulletValue(bodyText, '価格') || extractBulletValue(bodyText, '売買価格');
  const layoutRaw = extractBulletValue(bodyText, '間取り');
  const landRaw = extractBulletValue(bodyText, '敷地面積') || extractBulletValue(bodyText, '土地面積');
  const buildingRaw = extractBulletValue(bodyText, '建物面積') || extractBulletValue(bodyText, '延床面積');
  const structureRaw = extractBulletValue(bodyText, '構造');
  const constructionRaw = extractBulletValue(bodyText, '建築時期') || extractBulletValue(bodyText, '築年月');

  // Yamakita addresses often omit 神奈川県 prefix, just say "山北町..."
  let fullAddress = addressRaw;
  if (addressRaw && !addressRaw.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)) {
    fullAddress = `神奈川県${addressRaw}`;
  }

  const { prefecture, city } = parseAddressParts(fullAddress);
  const layout = layoutRaw || matchOne(pageTitle, /(\d+[SLDKK]+|\d+LDK|\d+DK|\d+K|\d+R)/i);

  const constructionYear = parseConstructionYear(constructionRaw || pageTitle);
  const buildingAge = constructionYear ? (new Date().getFullYear() - constructionYear) : null;

  const isAkiya = /空き家/.test(pageTitle) || /空き家/.test(bodyText);
  const hasBuilding = Boolean(buildingRaw || layout || /家屋|戸建|古民家|住宅|建物/.test(`${pageTitle} ${bodyText}`));

  // Extract images — look for <img> tags within the body
  const imageUrls = [];
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1];
    if (/\.(jpg|jpeg|png|gif)/i.test(src) && !/logo|icon|banner|header|nav/i.test(src)) {
      try {
        imageUrls.push(new URL(src, url).toString());
      } catch { /* skip invalid */ }
    }
  }

  return {
    url,
    source: 'yamakita_akiya',
    title: pageTitle || null,
    price_yen: parsePriceYen(priceRaw),
    price_raw: priceRaw || null,
    prefecture: prefecture || '神奈川県',
    city: city || '山北町',
    address_raw: addressRaw || null,
    is_akiya: isAkiya,
    has_building: hasBuilding,
    layout: layout || null,
    building_area_sqm: parseAreaValue(buildingRaw),
    land_area_sqm: parseAreaValue(landRaw),
    building_age: buildingAge,
    notes: structureRaw ? `構造: ${structureRaw}` : null,
    contact: null,
    image_urls: imageUrls,
    inquiry_code: matchOne(url, /\/(\d{10})\.html/),
    status_text: null,
    scraped_at: new Date().toISOString()
  };
}

registerDetailStrategy('yamakita_detail', extractYamakitaProperty);

module.exports = {
  extractYamakitaListings,
  extractYamakitaProperty,
  extractBulletValue,
  extractListingPrice
};
