/**
 * zero_estate source — listing + detail strategies for zero.estate
 *
 * zero.estate is a nationwide portal for 0-yen (free transfer) properties.
 * Listing pages are per-prefecture: /category/zero/kanto/chiba/ etc.
 * Detail pages: /zero/<region>/<id>_<city>/ — WordPress, table format
 * using <th> pairs (label th has background-color: #fafafa, value th has colspan).
 *
 * One parser covers all prefectures — instantiate multiple source entries
 * with different listing URLs to target specific prefectures.
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

function extractZeroEstateListings(html, baseUrl, sourceName) {
  const anchors = extractAnchors(html, baseUrl);
  const now = new Date().toISOString();
  const seen = new Set();
  const candidates = [];

  for (const anchor of anchors) {
    // Match /zero/<region>/<id>_<city>/ or /zero/<region>/<slug>/
    if (!/\/zero\/[a-z]+\/[^/]+\/$/.test(anchor.url)) continue;
    // Exclude category/navigation links
    if (/\/category\//.test(anchor.url)) continue;
    if (seen.has(anchor.url)) continue;
    seen.add(anchor.url);

    candidates.push({
      source_name: sourceName,
      listing_url: anchor.url,
      title: anchor.text || sourceName,
      price_raw: '0円',
      location_raw: null,
      discovered_at: now
    });
  }

  return candidates;
}

registerListingStrategy('zero_estate_listing', extractZeroEstateListings);

// ---------------------------------------------------------------------------
// Detail strategy — extracts from th/th table pairs
// ---------------------------------------------------------------------------

/**
 * zero.estate uses a non-standard table where both label and value are <th>:
 *   <th style="background-color: #fafafa">label</th>
 *   <th style="..." colspan="3">value</th>
 */
function extractThThValue(html, label) {
  const regex = new RegExp(
    `<th[^>]*background-color:\\s*#fafafa[^>]*>[\\s]*${label}[\\s]*</th>[\\s]*<th[^>]*>([\\s\\S]*?)</th>`,
    'i'
  );
  const match = html.match(regex);
  return match ? stripTags(match[1]).trim() : null;
}

function extractZeroEstateProperty(html, url) {
  const title = normalizeText(
    decodeHtml(
      extractMetaContent(html, 'og:title') ||
      matchOne(html, /<title>([^<]+)<\/title>/) ||
      ''
    )
  );

  const addressRaw = extractThThValue(html, '所在地');
  const priceRaw = extractThThValue(html, '販売価格');
  const landRaw = extractThThValue(html, '土地面積');
  const buildingRaw = extractThThValue(html, '建物面積|延床面積');
  const layoutRaw = extractThThValue(html, '間取り');
  const constructionRaw = extractThThValue(html, '築年月|建築時期|建築年');
  const statusRaw = extractThThValue(html, '現況');
  const classificationRaw = extractThThValue(html, '物件分類');

  const { prefecture, city } = parseAddressParts(addressRaw);
  const layout = layoutRaw || matchOne(title, /(\d+[SLDKK]+|\d+LDK|\d+DK|\d+K|\d+R)/i);
  const constructionYear = parseConstructionYear(constructionRaw || title);
  const buildingAge = constructionYear ? (new Date().getFullYear() - constructionYear) : null;

  const bodyText = normalizeText(stripTags(decodeHtml(html)));
  const isAkiya = /空き家/.test(title) || /空き家/.test(bodyText) || /家屋|戸建|古民家|住宅/.test(classificationRaw || '');
  const hasBuilding = Boolean(
    buildingRaw || layout ||
    /家屋|戸建|古民家|住宅|建物/.test(`${title} ${classificationRaw || ''}`)
  );

  // Extract images
  const imageUrls = [];
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1];
    if (/\.(jpg|jpeg|png|gif)/i.test(src) && !/logo|icon|banner|header|nav|thumb/i.test(src)) {
      try {
        imageUrls.push(new URL(src, url).toString());
      } catch { /* skip invalid */ }
    }
  }

  // Extract inquiry code from URL: /zero/kanto/3131_sosa/ → 3131
  const inquiryCode = matchOne(url, /\/zero\/[^/]+\/(\d+)[_/]/);

  // Detect sold/closed status — only check within the property badge/title area,
  // not the entire page (sidebar/footer may contain "成約済" for other listings)
  const titleArea = html.match(/<article[\s\S]*?<\/article>/i)?.[0]
    || html.match(/<div[^>]*class="[^"]*entry[^"]*"[\s\S]*?<\/div>/i)?.[0]
    || '';
  const badgeArea = html.match(/<span[^>]*class="[^"]*sold[^"]*"[^>]*>[\s\S]*?<\/span>/i)?.[0] || '';
  const isSold = /成約済/.test(badgeArea) || /class="[^"]*sold[^"]*"/.test(titleArea);
  const isClosed = /受付停止/.test(badgeArea);
  const statusText = isSold ? '成約済' : isClosed ? '受付停止' : statusRaw || '募集中';

  return {
    url,
    source: 'zero_estate',
    title: title || null,
    price_yen: parsePriceYen(priceRaw),
    price_raw: priceRaw || null,
    prefecture,
    city,
    address_raw: addressRaw || null,
    is_akiya: isAkiya,
    has_building: hasBuilding,
    layout: layout || null,
    building_area_sqm: parseAreaValue(buildingRaw),
    land_area_sqm: parseAreaValue(landRaw),
    building_age: buildingAge,
    notes: classificationRaw ? `分類: ${classificationRaw}` : null,
    contact: null,
    image_urls: imageUrls,
    inquiry_code: inquiryCode,
    status_text: statusText,
    scraped_at: new Date().toISOString()
  };
}

registerDetailStrategy('zero_estate_detail', extractZeroEstateProperty);

module.exports = {
  extractZeroEstateListings,
  extractZeroEstateProperty
};
