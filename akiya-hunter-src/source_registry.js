/**
 * Source registry — strategy lookup for listing collection and detail extraction.
 *
 * Each source in config/sources.json declares a `listing_strategy` and
 * `detail_strategy`. This module maps those strategy names to concrete
 * handler functions so the pipeline can dispatch without hard-coded
 * if/else chains.
 *
 * To onboard a new source:
 *   1. Add its config to config/sources.json
 *   2. Implement a listing handler and/or detail handler
 *   3. Register both in the maps below
 */

// ---------------------------------------------------------------------------
// Listing strategies
// ---------------------------------------------------------------------------
// Signature: (html, baseUrl, sourceName) => candidate[]
//   candidate = { source_name, listing_url, title, price_raw, location_raw, discovered_at }

const listingStrategies = new Map();

// Detail strategies
// ---------------------------------------------------------------------------
// Signature: (html, url) => property object
//   property = { url, source, title, price_yen, ... }

const detailStrategies = new Map();

// ---------------------------------------------------------------------------
// Registration helpers
// ---------------------------------------------------------------------------

function registerListingStrategy(name, handler) {
  listingStrategies.set(name, handler);
}

function registerDetailStrategy(name, handler) {
  detailStrategies.set(name, handler);
}

function getListingStrategy(name) {
  return listingStrategies.get(name) || null;
}

function getDetailStrategy(name) {
  return detailStrategies.get(name) || null;
}

function listRegisteredStrategies() {
  return {
    listing: [...listingStrategies.keys()],
    detail: [...detailStrategies.keys()]
  };
}

// ---------------------------------------------------------------------------
// Source config helpers
// ---------------------------------------------------------------------------

function resolveSourceStrategy(source) {
  const listing = getListingStrategy(source.listing_strategy);
  const detail = getDetailStrategy(source.detail_strategy);
  return { listing, detail };
}

function getDetailStrategyForUrl(url, sources) {
  for (const source of sources) {
    if (!source.enabled) continue;
    const detail = getDetailStrategy(source.detail_strategy);
    if (!detail) continue;
    if (source.base_url && url.startsWith(new URL(source.base_url).origin)) {
      return { strategy: detail, source };
    }
  }
  return { strategy: null, source: null };
}

module.exports = {
  registerListingStrategy,
  registerDetailStrategy,
  getListingStrategy,
  getDetailStrategy,
  listRegisteredStrategies,
  resolveSourceStrategy,
  getDetailStrategyForUrl
};
