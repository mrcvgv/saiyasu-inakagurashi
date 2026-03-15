const fs = require('fs');
const path = require('path');

// Load all source strategy modules (self-register on import)
require('./sources');

const { getListingStrategy } = require('./source_registry');
const { extractAnchors, looksLikePropertyLink, absoluteUrl, stripTags } = require('./parse_helpers');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'AkiyaHunterV1/0.1 (+https://github.com/mrcvgv/akiya-hunter-v1)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

// ---------------------------------------------------------------------------
// Collect from source — uses registry lookup
// ---------------------------------------------------------------------------

async function collectFromSource(source) {
  const html = await fetchText(source.base_url);

  const strategy = getListingStrategy(source.listing_strategy);
  if (strategy) {
    return strategy(html, source.base_url, source.source_name, source);
  }

  // Fallback: generic anchor extraction
  const fallback = getListingStrategy('generic_anchor');
  return fallback(html, source.base_url, source.source_name, source);
}

async function collectListingUrls({ appConfigPath, sourcesConfigPath } = {}) {
  const rootDir = path.resolve(__dirname, '..');
  const defaultAppConfigPath = fs.existsSync(path.join(rootDir, 'config', 'app.json'))
    ? path.join(rootDir, 'config', 'app.json')
    : path.join(rootDir, 'config', 'app.example.json');
  const defaultSourcesConfigPath = fs.existsSync(path.join(rootDir, 'config', 'sources.json'))
    ? path.join(rootDir, 'config', 'sources.json')
    : path.join(rootDir, 'config', 'sources.example.json');
  const appConfig = readJson(appConfigPath || defaultAppConfigPath);
  const sources = readJson(sourcesConfigPath || defaultSourcesConfigPath);

  const allowedPrefectures = new Set(appConfig.targets.prefectures || []);
  const enabledSources = sources.filter((source) => {
    if (!source.enabled) return false;
    if (!source.prefecture) return true;
    return allowedPrefectures.has(source.prefecture);
  });

  const candidates = [];
  const errors = [];

  for (const source of enabledSources) {
    try {
      const items = await collectFromSource(source);
      candidates.push(...items);
    } catch (error) {
      errors.push({
        source_name: source.source_name,
        message: error.message
      });
    }
  }

  return { candidates, errors };
}

async function main() {
  const result = await collectListingUrls({
    appConfigPath: process.env.APP_CONFIG_PATH,
    sourcesConfigPath: process.env.SOURCES_CONFIG_PATH
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  collectListingUrls,
  extractAnchors,
  looksLikePropertyLink,
  absoluteUrl,
  stripTags
};
