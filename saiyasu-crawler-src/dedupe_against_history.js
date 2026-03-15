const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function normalizeInputArray(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.accepted_properties)) return value.accepted_properties;
  if (value && Array.isArray(value.properties)) return value.properties;
  return [];
}

function priceCloseEnough(a, b, threshold = 50000) {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= threshold;
}

function sameProperty(current, existing) {
  if (current.url && existing.url && current.url === existing.url) return true;
  if (current.inquiry_code && existing.inquiry_code && current.inquiry_code === existing.inquiry_code) return true;

  const titleA = (current.title || '').trim();
  const titleB = (existing.title || '').trim();
  const cityA = (current.city || '').trim();
  const cityB = (existing.city || '').trim();
  if (titleA && titleB && cityA && cityB && titleA === titleB && cityA === cityB && priceCloseEnough(current.price_yen, existing.price_yen)) {
    return true;
  }

  const addressA = (current.address_raw || '').trim();
  const addressB = (existing.address_raw || '').trim();
  if (addressA && addressB && addressA === addressB && current.price_yen === existing.price_yen) {
    return true;
  }

  return false;
}

function summarizeChanges(current, existing) {
  const changes = [];

  if ((existing.price_yen ?? null) !== (current.price_yen ?? null)) {
    changes.push('price');
  }
  if ((existing.notes || '').trim() !== (current.notes || '').trim()) {
    changes.push('notes');
  }
  if ((existing.layout || null) !== (current.layout || null)) {
    changes.push('layout');
  }
  if ((existing.building_area_sqm ?? null) !== (current.building_area_sqm ?? null)) {
    changes.push('building_area_sqm');
  }
  if ((existing.land_area_sqm ?? null) !== (current.land_area_sqm ?? null)) {
    changes.push('land_area_sqm');
  }
  if ((existing.contact || '').trim() !== (current.contact || '').trim()) {
    changes.push('contact');
  }
  if ((existing.status_text || '').trim() !== (current.status_text || '').trim()) {
    changes.push('status_text');
  }
  if ((existing.image_urls || []).length !== (current.image_urls || []).length) {
    changes.push('image_urls');
  }

  return changes;
}

function classifyEvent(current, existing) {
  if (!existing) {
    return { event_type: 'new', changes: [] };
  }

  if (existing.price_yen != null && current.price_yen != null && current.price_yen < existing.price_yen) {
    return {
      event_type: 'price_down',
      changes: ['price']
    };
  }

  const changes = summarizeChanges(current, existing).filter((field) => field !== 'price');
  if (changes.length > 0) {
    return {
      event_type: 'updated',
      changes
    };
  }

  return {
    event_type: 'known',
    changes: []
  };
}

function dedupeAgainstHistory(currentProperties, historyProperties) {
  const events = [];

  for (const property of currentProperties) {
    const existing = historyProperties.find((candidate) => sameProperty(property, candidate)) || null;
    const classification = classifyEvent(property, existing);

    events.push({
      event_type: classification.event_type,
      property,
      matched_history: existing,
      changes: classification.changes
    });
  }

  return { events };
}

function main() {
  const currentPath = process.argv[2];
  const historyPath = process.argv[3];

  if (!currentPath || !historyPath) {
    console.error('Usage: npm run dedupe:history -- <current.json> <history.json>');
    process.exit(1);
  }

  const current = normalizeInputArray(readJson(currentPath));
  const history = normalizeInputArray(readJson(historyPath));
  const result = dedupeAgainstHistory(current, history);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  dedupeAgainstHistory,
  sameProperty,
  summarizeChanges,
  classifyEvent,
  priceCloseEnough
};
