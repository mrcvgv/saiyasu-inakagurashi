const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function openDatabase(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return new DatabaseSync(dbPath);
}

function initDatabase(db, schemaPath) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

function mapRowToProperty(row) {
  return {
    url: row.url,
    source: row.source,
    inquiry_code: row.inquiry_code,
    title: row.title,
    prefecture: row.prefecture,
    city: row.city,
    address_raw: row.address_raw,
    price_yen: row.price_yen,
    price_raw: row.price_raw,
    is_akiya: Boolean(row.is_akiya),
    has_building: Boolean(row.has_building),
    layout: row.layout,
    building_area_sqm: row.building_area_sqm,
    land_area_sqm: row.land_area_sqm,
    building_age: row.building_age,
    notes: row.notes,
    contact: row.contact,
    status_text: row.status_text,
    image_urls: row.image_urls_json ? JSON.parse(row.image_urls_json) : [],
    event_type: row.event_type,
    hash_signature: row.hash_signature,
    first_seen_at: row.first_seen_at,
    last_seen_at: row.last_seen_at,
    last_notified_at: row.last_notified_at,
    scraped_at: row.last_seen_at
  };
}

function loadLatestProperties(db) {
  const stmt = db.prepare(`
    SELECT
      url, source, inquiry_code, title, prefecture, city, address_raw,
      price_yen, price_raw, is_akiya, has_building, layout,
      building_area_sqm, land_area_sqm, building_age, notes,
      contact, status_text, image_urls_json, event_type,
      hash_signature, first_seen_at, last_seen_at, last_notified_at
    FROM properties
  `);

  return stmt.all().map(mapRowToProperty);
}

function buildNotificationMap(notificationResult) {
  const map = new Map();
  for (const item of notificationResult?.sent_notifications || []) {
    if (item.url) {
      map.set(item.url, item.sent_at);
    }
  }
  return map;
}

function buildEventMap(events) {
  const map = new Map();
  for (const event of events || []) {
    const url = event?.property?.url;
    if (url) {
      map.set(url, event.event_type);
    }
  }
  return map;
}

function saveProperties(db, properties, events, notificationResult) {
  const eventMap = buildEventMap(events);
  const notifiedMap = buildNotificationMap(notificationResult);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO properties (
      url, source, inquiry_code, title, prefecture, city, address_raw,
      price_yen, price_raw, is_akiya, has_building, layout,
      building_area_sqm, land_area_sqm, building_age, notes,
      contact, status_text, image_urls_json, event_type,
      hash_signature, first_seen_at, last_seen_at, last_notified_at,
      created_at, updated_at
    ) VALUES (
      @url, @source, @inquiry_code, @title, @prefecture, @city, @address_raw,
      @price_yen, @price_raw, @is_akiya, @has_building, @layout,
      @building_area_sqm, @land_area_sqm, @building_age, @notes,
      @contact, @status_text, @image_urls_json, @event_type,
      @hash_signature, @first_seen_at, @last_seen_at, @last_notified_at,
      @created_at, @updated_at
    )
    ON CONFLICT(url) DO UPDATE SET
      source = excluded.source,
      inquiry_code = excluded.inquiry_code,
      title = excluded.title,
      prefecture = excluded.prefecture,
      city = excluded.city,
      address_raw = excluded.address_raw,
      price_yen = excluded.price_yen,
      price_raw = excluded.price_raw,
      is_akiya = excluded.is_akiya,
      has_building = excluded.has_building,
      layout = excluded.layout,
      building_area_sqm = excluded.building_area_sqm,
      land_area_sqm = excluded.land_area_sqm,
      building_age = excluded.building_age,
      notes = excluded.notes,
      contact = excluded.contact,
      status_text = excluded.status_text,
      image_urls_json = excluded.image_urls_json,
      event_type = excluded.event_type,
      hash_signature = excluded.hash_signature,
      last_seen_at = excluded.last_seen_at,
      last_notified_at = COALESCE(excluded.last_notified_at, properties.last_notified_at),
      updated_at = excluded.updated_at
  `);

  const existingFirstSeenStmt = db.prepare('SELECT first_seen_at FROM properties WHERE url = ?');
  let upserted = 0;

  for (const property of properties) {
    const existing = existingFirstSeenStmt.get(property.url);
    stmt.run({
      url: property.url,
      source: property.source,
      inquiry_code: property.inquiry_code || null,
      title: property.title || null,
      prefecture: property.prefecture || null,
      city: property.city || null,
      address_raw: property.address_raw || null,
      price_yen: property.price_yen ?? null,
      price_raw: property.price_raw || null,
      is_akiya: property.is_akiya ? 1 : 0,
      has_building: property.has_building ? 1 : 0,
      layout: property.layout || null,
      building_area_sqm: property.building_area_sqm ?? null,
      land_area_sqm: property.land_area_sqm ?? null,
      building_age: property.building_age ?? null,
      notes: property.notes || null,
      contact: property.contact || null,
      status_text: property.status_text || null,
      image_urls_json: JSON.stringify(property.image_urls || []),
      event_type: eventMap.get(property.url) || 'known',
      hash_signature: property.hash_signature || null,
      first_seen_at: existing?.first_seen_at || property.scraped_at || now,
      last_seen_at: property.scraped_at || now,
      last_notified_at: notifiedMap.get(property.url) || null,
      created_at: now,
      updated_at: now
    });
    upserted += 1;
  }

  return { upserted };
}

module.exports = {
  openDatabase,
  initDatabase,
  loadLatestProperties,
  saveProperties
};
