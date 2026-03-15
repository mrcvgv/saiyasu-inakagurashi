/**
 * saihoku source — listing + detail strategies for akiyabank.saihoku-ijuu.com
 *
 * 埼北空き家バンク (Saihoku Akiya Bank) is a regional portal covering 7
 * municipalities in northern Saitama prefecture:
 *   熊谷市, 本庄市, 深谷市, 美里町, 神川町, 上里町, 寄居町
 *
 * Listing page: akiyabank.saihoku-ijuu.com/ (WordPress, static HTML)
 * Detail pages: /property/<municipality>/<id>
 * Detail format: <li class="title">label</li><li class="text">value</li>
 *
 * One parser entry covers all 7 municipalities.
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

function extractSaihokuListings(html, baseUrl, sourceName) {
  const anchors = extractAnchors(html, baseUrl);
  const now = new Date().toISOString();
  const seen = new Set();
  const candidates = [];

  for (const anchor of anchors) {
    if (!/\/property\/[^/]+\/\d+/.test(anchor.url)) continue;
    if (seen.has(anchor.url)) continue;
    seen.add(anchor.url);

    // Try to extract price from anchor text (e.g., "売買価格：1000万円")
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

registerListingStrategy('saihoku_listing', extractSaihokuListings);

// ---------------------------------------------------------------------------
// Detail strategy — extracts from li.title / li.text pairs
// ---------------------------------------------------------------------------

/**
 * saihoku uses: <li class="title">label</li><li class="text">value</li>
 */
function extractLiValue(html, label) {
  const regex = new RegExp(
    `<li[^>]*class="title[^"]*"[^>]*>[\\s]*(?:<[^>]+>)*[\\s]*${label}[\\s]*(?:<[^>]+>)*[\\s]*</li>[\\s]*<li[^>]*class="text[^"]*"[^>]*>([\\s\\S]*?)</li>`,
    'i'
  );
  const match = html.match(regex);
  return match ? normalizeText(stripTags(match[1])).trim() : null;
}

function tryExtractLi(html, labelAlts) {
  for (const label of labelAlts.split('|')) {
    const val = extractLiValue(html, label);
    if (val) return val;
  }
  return null;
}

function extractSaihokuProperty(html, url) {
  const title = normalizeText(
    decodeHtml(
      extractMetaContent(html, 'og:title') ||
      matchOne(html, /<title>([^<]+)<\/title>/) ||
      ''
    )
  );

  const addressRaw = tryExtractLi(html, '所在地|住所');
  const priceRaw = tryExtractLi(html, '売買価格|価格');
  const landRaw = tryExtractLi(html, '土地面積|敷地面積');
  const buildingRaw = tryExtractLi(html, '建物面積|延床面積|延べ床面積');
  const layoutRaw = tryExtractLi(html, '間取り');
  const constructionRaw = tryExtractLi(html, '築年月|建築時期|建築年');
  const structureRaw = tryExtractLi(html, '構造');
  const propertyType = tryExtractLi(html, '種別');

  // Address: prepend 埼玉県 if not already present
  let fullAddress = addressRaw;
  if (addressRaw && !addressRaw.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)) {
    fullAddress = `埼玉県${addressRaw}`;
  }

  const parts = parseAddressParts(fullAddress);
  const layout = layoutRaw || matchOne(title, /(\d+[SLDKK]+|\d+LDK|\d+DK|\d+K|\d+R)/i);
  const constructionYear = parseConstructionYear(constructionRaw || title);
  const buildingAge = constructionYear ? (new Date().getFullYear() - constructionYear) : null;

  const bodyText = normalizeText(stripTags(decodeHtml(html)));
  const isAkiya = /空き家/.test(title) || /空き家/.test(bodyText);
  const hasBuilding = Boolean(
    buildingRaw || layout ||
    /建物|家屋|戸建|古民家|住宅/.test(`${title} ${propertyType || ''}`)
  );

  // Extract images from slider
  const imageUrls = [];
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  const seenImgs = new Set();
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1];
    if (/\.(jpg|jpeg|png|gif)/i.test(src) && !/logo|icon|banner|header|nav|title/i.test(src)) {
      try {
        const absUrl = new URL(src, url).toString();
        if (!seenImgs.has(absUrl)) {
          seenImgs.add(absUrl);
          imageUrls.push(absUrl);
        }
      } catch { /* skip invalid */ }
    }
  }

  // Inquiry code from URL: /property/kamikawa/2996 → 2996
  const inquiryCode = matchOne(url, /\/property\/[^/]+\/(\d+)/);

  // Municipality from URL: /property/kamikawa/2996 → kamikawa
  const municipalitySlug = matchOne(url, /\/property\/([^/]+)\/\d+/);

  return {
    url,
    source: 'saihoku',
    title: title || null,
    price_yen: parsePriceYen(priceRaw),
    price_raw: priceRaw || null,
    prefecture: parts.prefecture || '埼玉県',
    city: parts.city || null,
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
    inquiry_code: inquiryCode,
    status_text: null,
    scraped_at: new Date().toISOString()
  };
}

registerDetailStrategy('saihoku_detail', extractSaihokuProperty);

module.exports = {
  extractSaihokuListings,
  extractSaihokuProperty
};
