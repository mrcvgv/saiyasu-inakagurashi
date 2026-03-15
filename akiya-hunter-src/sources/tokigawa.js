/**
 * tokigawa_akiya source — Tokigawa town (ときがわ町, Saitama) municipal akiya bank.
 *
 * Real site: https://www.town.tokigawa.lg.jp/info/1012
 * Detail pages: /Info/<id> — uses table format with <td> label/value pairs
 * where label cells have background-color:#ccffff.
 *
 * Labels: 物件所在地, 売却希望価格, 土地面積, 建物面積, 間取り, 築年月
 * 32+ properties verified 2026-03.
 */

const {
  registerListingStrategy,
  registerDetailStrategy
} = require('../source_registry');

const {
  extractAnchors,
  stripTags,
  decodeHtml,
  normalizeText,
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

function extractTokigawaListings(html, baseUrl, sourceName) {
  const anchors = extractAnchors(html, baseUrl);
  const now = new Date().toISOString();
  const seen = new Set();
  const candidates = [];

  for (const anchor of anchors) {
    // Match /Info/<id> links (case-insensitive since URL may be /info/ or /Info/)
    if (!/\/Info\/\d+$/i.test(anchor.url)) continue;
    // Exclude non-property info pages (flow, registration, forms, etc.)
    if (/\/forms\//.test(anchor.url)) continue;
    if (/\/Info\/(101[2-9]|102[0-5]|1036|1063)$/i.test(anchor.url)) continue;
    if (seen.has(anchor.url)) continue;
    seen.add(anchor.url);

    // Try to extract price from surrounding text
    const priceMatch = anchor.text.match(/([0-9,]+万円)/);
    const priceRaw = priceMatch ? priceMatch[1] : null;

    candidates.push({
      source_name: sourceName,
      listing_url: anchor.url,
      title: anchor.text || sourceName,
      price_raw: priceRaw,
      location_raw: '埼玉県',
      discovered_at: now
    });
  }

  return candidates;
}

registerListingStrategy('tokigawa_listing', extractTokigawaListings);

// ---------------------------------------------------------------------------
// Detail strategy — td/td table format with background-color label cells
// ---------------------------------------------------------------------------

/**
 * Tokigawa uses: <td style="background-color:#ccffff">label</td><td>value</td>
 */
function extractTdLabelValue(html, label) {
  const regex = new RegExp(
    `<td[^>]*background-color:[^>]*>[\\s]*${label}[\\s]*</td>[\\s]*<td[^>]*>([\\s\\S]*?)</td>`,
    'i'
  );
  const match = html.match(regex);
  return match ? normalizeText(stripTags(match[1])).trim() : null;
}

function tryExtractTd(html, labelAlts) {
  for (const label of labelAlts.split('|')) {
    const val = extractTdLabelValue(html, label);
    if (val) return val;
  }
  return null;
}

function extractTokigawaProperty(html, url) {
  const title = normalizeText(
    decodeHtml(
      extractMetaContent(html, 'og:title') ||
      matchOne(html, /<title>([^<]+)<\/title>/) ||
      ''
    )
  );

  const addressRaw = tryExtractTd(html, '物件所在地|所在地|住所');
  const priceRaw = tryExtractTd(html, '売却希望価格|売買価格|価格');
  const landRaw = tryExtractTd(html, '土地面積|敷地面積');
  const buildingRaw = tryExtractTd(html, '建物面積|延床面積|延べ床面積');
  const layoutRaw = tryExtractTd(html, '間取り');
  const constructionRaw = tryExtractTd(html, '築年月|建築時期|建築年');

  // Prepend 埼玉県ときがわ町 if address doesn't include prefecture
  let fullAddress = addressRaw;
  if (addressRaw && !addressRaw.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)) {
    fullAddress = `埼玉県${addressRaw}`;
  }

  const parts = parseAddressParts(fullAddress);
  const layout = layoutRaw || matchOne(title, /(\d+[SLDKK]+|\d+LDK|\d+DK|\d+K|\d+R)/i);
  const constructionYear = parseConstructionYear(constructionRaw || title);
  const buildingAge = constructionYear ? (new Date().getFullYear() - constructionYear) : null;

  const bodyText = normalizeText(stripTags(decodeHtml(html)));
  const isAkiya = /空き家|空家/.test(title) || /空き家|空家/.test(bodyText);
  const hasBuilding = Boolean(
    buildingRaw || layout ||
    /家屋|戸建|古民家|住宅|建物/.test(title)
  );

  // Extract images
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

  // Inquiry code from URL: /Info/1548 → 1548
  const inquiryCode = matchOne(url, /\/Info\/(\d+)/i);

  // Registration number from title: 登録番号70 → 70
  const regNumber = matchOne(title, /登録番号(\d+)/);

  return {
    url,
    source: 'tokigawa_akiya',
    title: title || null,
    price_yen: parsePriceYen(priceRaw),
    price_raw: priceRaw || null,
    prefecture: parts.prefecture || '埼玉県',
    city: parts.city || 'ときがわ町',
    address_raw: addressRaw || null,
    is_akiya: isAkiya,
    has_building: hasBuilding,
    layout: layout || null,
    building_area_sqm: parseAreaValue(buildingRaw),
    land_area_sqm: parseAreaValue(landRaw),
    building_age: buildingAge,
    notes: regNumber ? `登録番号: ${regNumber}` : null,
    contact: null,
    image_urls: imageUrls,
    inquiry_code: inquiryCode || regNumber,
    status_text: null,
    scraped_at: new Date().toISOString()
  };
}

registerDetailStrategy('tokigawa_detail', extractTokigawaProperty);

module.exports = {
  extractTokigawaListings,
  extractTokigawaProperty
};
