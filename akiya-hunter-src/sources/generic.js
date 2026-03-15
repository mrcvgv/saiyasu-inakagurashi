/**
 * Generic fallback listing strategy — matches anchors containing
 * property-related keywords (空き家, 物件, etc.).
 *
 * Used when a source has no dedicated listing parser.
 */

const { registerListingStrategy } = require('../source_registry');
const { extractAnchors, looksLikePropertyLink } = require('../parse_helpers');

function genericListingStrategy(html, baseUrl, sourceName, source) {
  const anchors = extractAnchors(html, baseUrl).filter(looksLikePropertyLink);
  const now = new Date().toISOString();

  return anchors.map((anchor) => ({
    source_name: sourceName,
    listing_url: anchor.url,
    title: anchor.text || sourceName,
    price_raw: null,
    location_raw: source?.prefecture || null,
    discovered_at: now
  }));
}

registerListingStrategy('generic_anchor', genericListingStrategy);

module.exports = { genericListingStrategy };
