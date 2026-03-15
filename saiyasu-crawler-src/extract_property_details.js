const fs = require('fs');
const path = require('path');

// Load all source strategy modules (self-register on import)
require('./sources');

const { getDetailStrategyForUrl } = require('./source_registry');
const {
  parsePriceYen,
  parseAreaValue,
  parseAddressParts,
  parseBuildingAge,
  extractPdfText
} = require('./parse_helpers');

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchDocument(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'AkiyaHunterV1/0.1 (+https://github.com/mrcvgv/akiya-hunter-v1)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return { buffer, contentType };
}

function isPdfResponse(contentType, buffer) {
  return /application\/pdf/i.test(contentType) || buffer.subarray(0, 4).toString() === '%PDF';
}

// ---------------------------------------------------------------------------
// Load sources config for strategy lookup
// ---------------------------------------------------------------------------

function loadSourcesConfig() {
  const rootDir = path.resolve(__dirname, '..');
  const sourcesPath = fs.existsSync(path.join(rootDir, 'config', 'sources.json'))
    ? path.join(rootDir, 'config', 'sources.json')
    : path.join(rootDir, 'config', 'sources.example.json');
  return JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
}

// ---------------------------------------------------------------------------
// Extract property details — uses registry lookup
// ---------------------------------------------------------------------------

async function extractPropertyDetails(urls) {
  const sources = loadSourcesConfig();
  const properties = [];
  const errors = [];

  for (const url of urls) {
    try {
      const { buffer, contentType } = await fetchDocument(url);
      const { strategy } = getDetailStrategyForUrl(url, sources);

      if (strategy) {
        const body = isPdfResponse(contentType, buffer)
          ? await extractPdfText(buffer)
          : buffer.toString('utf8');
        properties.push(strategy(body, url));
      } else {
        errors.push({ url, message: 'No registered detail strategy for this URL' });
      }
    } catch (error) {
      errors.push({ url, message: error.message });
    }
  }

  return { properties, errors };
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('Usage: npm run extract:property -- <url> [url...]');
    process.exit(1);
  }

  const result = await extractPropertyDetails(urls);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  extractPropertyDetails,
  parsePriceYen,
  parseAreaValue,
  parseAddressParts,
  parseBuildingAge
};
