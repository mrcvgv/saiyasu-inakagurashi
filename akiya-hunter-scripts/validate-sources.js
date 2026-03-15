#!/usr/bin/env node
/**
 * validate-sources — checks source configs and strategy registrations.
 *
 * Validates:
 *   1. config/sources.json schema correctness
 *   2. Every enabled source has registered listing + detail strategies
 *   3. config/source_inventory.json schema correctness
 *   4. No duplicate source_name entries
 *   5. Strategy names referenced in config exist in the registry
 *
 * Exit code 0 = all pass, 1 = failures found.
 *
 * Usage: node scripts/validate-sources.js
 */

const fs = require('fs');
const path = require('path');

// Load strategies by importing the source modules
require('../src/sources');
const { listRegisteredStrategies } = require('../src/source_registry');

const rootDir = path.resolve(__dirname, '..');
let failures = 0;
let passes = 0;

function pass(msg) {
  passes++;
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  failures++;
  console.error(`  ✗ ${msg}`);
}

// ---------------------------------------------------------------------------
// 1. Load and validate sources.json
// ---------------------------------------------------------------------------

console.log('\n── config/sources.json ──');

const sourcesPath = path.join(rootDir, 'config', 'sources.json');
let sources;
try {
  sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  if (!Array.isArray(sources)) throw new Error('must be an array');
  pass(`Parsed ${sources.length} source(s)`);
} catch (e) {
  fail(`Failed to parse: ${e.message}`);
  process.exit(1);
}

const requiredSourceFields = ['source_name', 'enabled', 'base_url', 'listing_strategy', 'detail_strategy'];
const sourceNames = new Set();

for (const source of sources) {
  const name = source.source_name || '<unnamed>';

  // Check required fields
  for (const field of requiredSourceFields) {
    if (source[field] === undefined || source[field] === null) {
      fail(`${name}: missing required field "${field}"`);
    }
  }

  // Check for duplicates
  if (sourceNames.has(name)) {
    fail(`${name}: duplicate source_name`);
  } else {
    sourceNames.add(name);
    pass(`${name}: unique source_name`);
  }

  // Check base_url is a valid URL
  try {
    new URL(source.base_url);
    pass(`${name}: valid base_url`);
  } catch {
    fail(`${name}: invalid base_url "${source.base_url}"`);
  }
}

// ---------------------------------------------------------------------------
// 2. Check strategy registrations
// ---------------------------------------------------------------------------

console.log('\n── Strategy registrations ──');

const registered = listRegisteredStrategies();
console.log(`  Registered listing strategies: ${registered.listing.join(', ')}`);
console.log(`  Registered detail strategies:  ${registered.detail.join(', ')}`);

for (const source of sources) {
  // Check strategy registrations for enabled sources and trial sources
  if (!source.enabled && source.status !== 'trial') continue;
  const name = source.source_name;

  if (registered.listing.includes(source.listing_strategy)) {
    pass(`${name}: listing strategy "${source.listing_strategy}" registered`);
  } else {
    fail(`${name}: listing strategy "${source.listing_strategy}" NOT registered`);
  }

  if (registered.detail.includes(source.detail_strategy)) {
    pass(`${name}: detail strategy "${source.detail_strategy}" registered`);
  } else {
    fail(`${name}: detail strategy "${source.detail_strategy}" NOT registered`);
  }
}

// ---------------------------------------------------------------------------
// 3. Validate source_inventory.json
// ---------------------------------------------------------------------------

console.log('\n── config/source_inventory.json ──');

const inventoryPath = path.join(rootDir, 'config', 'source_inventory.json');
let inventory;
try {
  inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  if (!Array.isArray(inventory)) throw new Error('must be an array');
  pass(`Parsed ${inventory.length} inventory entry(ies)`);
} catch (e) {
  fail(`Failed to parse: ${e.message}`);
  inventory = [];
}

const inventoryNames = new Set();
const validStatuses = ['live', 'planned', 'trial', 'blocked'];

for (const entry of inventory) {
  const name = entry.source_name || '<unnamed>';

  if (!entry.source_name) {
    fail(`${name}: missing source_name`);
    continue;
  }

  if (inventoryNames.has(name)) {
    fail(`${name}: duplicate in inventory`);
  } else {
    inventoryNames.add(name);
  }

  if (entry.status && !validStatuses.includes(entry.status)) {
    fail(`${name}: invalid status "${entry.status}" (expected: ${validStatuses.join(', ')})`);
  }

  // Cross-check: live inventory entries should be in sources.json
  if (entry.status === 'live' && !sourceNames.has(name)) {
    fail(`${name}: status is "live" in inventory but missing from sources.json`);
  }

  // Cross-check: sources.json entries should be "live", "trial", or "blocked" in inventory
  if (sourceNames.has(name) && !['live', 'trial', 'blocked'].includes(entry.status)) {
    fail(`${name}: in sources.json but inventory status is "${entry.status}" (expected "live", "trial", or "blocked")`);
  }
}

// Check sources.json entries exist in inventory
for (const name of sourceNames) {
  if (inventoryNames.has(name)) {
    pass(`${name}: present in both sources.json and inventory`);
  } else {
    fail(`${name}: in sources.json but missing from inventory`);
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n── Summary: ${passes} passed, ${failures} failed ──\n`);
process.exit(failures > 0 ? 1 : 0);
