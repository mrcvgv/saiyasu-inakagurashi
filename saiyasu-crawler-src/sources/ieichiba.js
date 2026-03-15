/**
 * ieichiba source — listing + detail strategies for www.ieichiba.com
 *
 * ieichiba is a nationwide akiya marketplace portal.  Listings live under
 * /project/<code> paths.  The detail page exposes price, location, land/
 * building areas, and status in a <p class="page__body-overview"> block.
 */

const {
  registerListingStrategy,
  registerDetailStrategy
} = require('../source_registry');

const {
  extractAnchors,
  inferLocationRaw,
  stripTags,
  decodeHtml,
  matchOne,
  parsePriceYen,
  parseAreaValue,
  parseAddressParts,
  parseBuildingAge,
  extractMetaContent
} = require('../parse_helpers');

// ---------------------------------------------------------------------------
// Listing strategy
// ---------------------------------------------------------------------------

function extractIeichibaProjects(html, baseUrl, sourceName) {
  const anchors = extractAnchors(html, baseUrl);
  const now = new Date().toISOString();
  const seen = new Set();
  const candidates = [];

  for (const anchor of anchors) {
    if (!anchor.url.includes('/project/')) continue;
    if (seen.has(anchor.url)) continue;
    seen.add(anchor.url);

    candidates.push({
      source_name: sourceName,
      listing_url: anchor.url,
      title: anchor.text || sourceName,
      price_raw: null,
      location_raw: inferLocationRaw(anchor.text || ''),
      discovered_at: now
    });
  }

  return candidates;
}

registerListingStrategy('ieichiba_home', extractIeichibaProjects);

// ---------------------------------------------------------------------------
// Detail strategy
// ---------------------------------------------------------------------------

function extractOverviewValue(overview, label) {
  const regex = new RegExp(`${label}[：:]([^\n<]+?)(?=\s+\S+[：:]|$)`);
  return matchOne(overview, regex);
}

function extractIeichibaProperty(html, url) {
  const title = decodeHtml(extractMetaContent(html, 'og:title') || matchOne(html, /<title>([^<]+)<\/title>/));
  const notes = decodeHtml(extractMetaContent(html, 'description') || '');
  const image = extractMetaContent(html, 'name="image') || extractMetaContent(html, 'property="og:image');
  const overviewHtml = matchOne(html, /<p class="page__body-overview"[^>]*>([\s\S]*?)<\/p>/) || '';
  const overviewBlock = decodeHtml(stripTags(overviewHtml.replace(/<br\s*\/?>/gi, '\n')));
  const priceRaw = decodeHtml(stripTags(matchOne(html, /希望価格：\s*<span[^>]*>([\s\S]*?)<\/span>/)));
  const addressRaw = extractOverviewValue(overviewBlock, '場所');
  const landRaw = extractOverviewValue(overviewBlock, '土地');
  const buildingRaw = extractOverviewValue(overviewBlock, '建物');
  const structureRaw = extractOverviewValue(overviewBlock, '構造');
  const genkyoRaw = extractOverviewValue(overviewBlock, '現況');
  const { prefecture, city } = parseAddressParts(addressRaw);
  const layout = matchOne(`${structureRaw || ''} ${notes}`, /(\d+[SLDKK]+|\d+LDK|\d+DK|\d+K|\d+R)/i);
  const isAkiya = /現況：空き家|空き家/.test(overviewBlock) || /空き家/.test(notes);
  const hasBuilding = Boolean(buildingRaw || layout || /家屋|戸建|古民家|住宅|建物/.test(`${title} ${notes}`));

  return {
    url,
    source: 'ieichiba',
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
    building_age: parseBuildingAge(`${title || ''} ${notes}`),
    notes: notes || null,
    contact: null,
    image_urls: image ? [image] : [],
    inquiry_code: matchOne(url, /\/project\/(P[^/?#]+)/),
    status_text: genkyoRaw || null,
    scraped_at: new Date().toISOString()
  };
}

registerDetailStrategy('ieichiba_detail', extractIeichibaProperty);

module.exports = {
  extractIeichibaProjects,
  extractIeichibaProperty
};
