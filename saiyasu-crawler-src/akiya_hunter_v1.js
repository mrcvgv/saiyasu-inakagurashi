const fs = require('fs');
const path = require('path');

const { collectListingUrls } = require('./collect_listing_urls');
const { extractPropertyDetails } = require('./extract_property_details');
const { normalizeAndFilter } = require('./normalize_and_filter');
const { dedupeAgainstHistory } = require('./dedupe_against_history');
const { sendDiscordNotifications } = require('./send_discord_notification');
const { openDatabase, initDatabase, loadLatestProperties, saveProperties } = require('./persistence_sqlite');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeRunId() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function runPipeline(options = {}) {
  const rootDir = path.resolve(__dirname, '..');
  const dataDir = path.join(rootDir, 'data');
  const startedAt = new Date().toISOString();
  const runId = makeRunId();
  const runDir = path.join(dataDir, 'runs', runId);
  const historyDir = path.join(dataDir, 'history');
  const historyPropertiesPath = path.join(historyDir, 'properties.latest.json');
  const historyEventsPath = path.join(historyDir, 'events.latest.json');
  const appConfigPath = fs.existsSync(path.join(rootDir, 'config', 'app.json'))
    ? path.join(rootDir, 'config', 'app.json')
    : path.join(rootDir, 'config', 'app.example.json');
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
  const schemaPath = path.join(rootDir, 'akiya-hunter-v1-schema.sql');
  const dbPath = path.join(rootDir, 'data', 'akiya_hunter_v1.sqlite');

  ensureDir(runDir);
  ensureDir(historyDir);

  const collectResult = await collectListingUrls();
  writeJson(path.join(runDir, 'candidates.json'), collectResult);

  const maxProperties = Number(process.env.MAX_PROPERTIES || options.maxProperties || 0);
  const candidateUrls = collectResult.candidates.map((item) => item.listing_url);
  const selectedUrls = maxProperties > 0 ? candidateUrls.slice(0, maxProperties) : candidateUrls;

  const extractResult = await extractPropertyDetails(selectedUrls);
  writeJson(path.join(runDir, 'properties.json'), extractResult);

  const normalizedResult = normalizeAndFilter(extractResult.properties, {
    prefectures: appConfig.targets.prefectures,
    max_price: appConfig.targets.max_price_yen,
    min_land_area_sqm: appConfig.targets.min_land_area_sqm,
    exclude_keywords: appConfig.targets.exclude_keywords || [],
    require_akiya: appConfig.targets.require_akiya,
    require_building: appConfig.targets.require_building
  });
  writeJson(path.join(runDir, 'normalized.json'), normalizedResult);

  const db = openDatabase(dbPath);
  initDatabase(db, schemaPath);
  const historyProperties = loadLatestProperties(db);
  const dedupeResult = dedupeAgainstHistory(normalizedResult.accepted_properties, historyProperties);
  writeJson(path.join(runDir, 'events.json'), dedupeResult);

  const dryRun = Boolean(options.dryRun);
  const hasPlaceholderWebhook = String(appConfig.discord.webhook_url || '').includes('REPLACE_ME');
  const notificationResult = await sendDiscordNotifications(dedupeResult.events, {
    webhookUrl: appConfig.discord.webhook_url,
    username: appConfig.discord.username,
    dryRun: dryRun || hasPlaceholderWebhook
  });
  writeJson(path.join(runDir, 'notifications.json'), notificationResult);

  const persistenceResult = saveProperties(db, normalizedResult.accepted_properties, dedupeResult.events, notificationResult);
  writeJson(historyPropertiesPath, normalizedResult.accepted_properties);
  writeJson(historyEventsPath, dedupeResult.events);

  const summary = {
    run_id: runId,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    scanned_sources_count: new Set(collectResult.candidates.map((item) => item.source_name)).size,
    discovered_candidates_count: collectResult.candidates.length,
    extracted_properties_count: extractResult.properties.length,
    accepted_count: normalizedResult.accepted_properties.length,
    rejected_count: normalizedResult.rejected_properties.length,
    new_count: dedupeResult.events.filter((event) => event.event_type === 'new').length,
    price_down_count: dedupeResult.events.filter((event) => event.event_type === 'price_down').length,
    updated_count: dedupeResult.events.filter((event) => event.event_type === 'updated').length,
    known_count: dedupeResult.events.filter((event) => event.event_type === 'known').length,
    notified_count: notificationResult.sent_notifications.length,
    error_count: collectResult.errors.length + extractResult.errors.length + notificationResult.failed_notifications.length,
    dry_run: dryRun || hasPlaceholderWebhook,
    upserted_count: persistenceResult.upserted,
    db_path: dbPath
  };
  writeJson(path.join(runDir, 'summary.json'), summary);
  db.close();

  return {
    run_id: runId,
    summary,
    paths: {
      run_dir: runDir,
      history_properties: historyPropertiesPath,
      history_events: historyEventsPath,
      db_path: dbPath
    }
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const result = await runPipeline({ dryRun });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message || error);
    process.exit(1);
  });
}

module.exports = {
  runPipeline
};
