CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  inquiry_code TEXT,
  title TEXT,
  prefecture TEXT,
  city TEXT,
  address_raw TEXT,
  price_yen INTEGER,
  price_raw TEXT,
  is_akiya INTEGER NOT NULL DEFAULT 0,
  has_building INTEGER NOT NULL DEFAULT 0,
  layout TEXT,
  building_area_sqm REAL,
  land_area_sqm REAL,
  building_age INTEGER,
  notes TEXT,
  contact TEXT,
  status_text TEXT,
  image_urls_json TEXT,
  event_type TEXT,
  hash_signature TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  last_notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_url
  ON properties(url);

CREATE INDEX IF NOT EXISTS idx_properties_prefecture_price
  ON properties(prefecture, price_yen);

CREATE INDEX IF NOT EXISTS idx_properties_last_seen_at
  ON properties(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_properties_hash_signature
  ON properties(hash_signature);
