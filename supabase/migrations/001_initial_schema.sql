-- ===================================================
-- 掘り出し物件ラボ — 初期スキーマ
-- ===================================================

-- 地方区分
CREATE TABLE regions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

INSERT INTO regions (slug, name, sort_order) VALUES
  ('hokkaido', '北海道', 1),
  ('tohoku', '東北', 2),
  ('kanto', '関東', 3),
  ('chubu', '中部', 4),
  ('kinki', '近畿', 5),
  ('chugoku', '中国', 6),
  ('shikoku', '四国', 7),
  ('kyushu', '九州・沖縄', 8);

-- 都道府県
CREATE TABLE prefectures (
  code CHAR(2) PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_kana TEXT,
  region_slug TEXT NOT NULL REFERENCES regions(slug),
  listing_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO prefectures (code, slug, name, region_slug) VALUES
  ('01', 'hokkaido', '北海道', 'hokkaido'),
  ('02', 'aomori', '青森県', 'tohoku'),
  ('03', 'iwate', '岩手県', 'tohoku'),
  ('04', 'miyagi', '宮城県', 'tohoku'),
  ('05', 'akita', '秋田県', 'tohoku'),
  ('06', 'yamagata', '山形県', 'tohoku'),
  ('07', 'fukushima', '福島県', 'tohoku'),
  ('08', 'ibaraki', '茨城県', 'kanto'),
  ('09', 'tochigi', '栃木県', 'kanto'),
  ('10', 'gunma', '群馬県', 'kanto'),
  ('11', 'saitama', '埼玉県', 'kanto'),
  ('12', 'chiba', '千葉県', 'kanto'),
  ('13', 'tokyo', '東京都', 'kanto'),
  ('14', 'kanagawa', '神奈川県', 'kanto'),
  ('15', 'niigata', '新潟県', 'chubu'),
  ('16', 'toyama', '富山県', 'chubu'),
  ('17', 'ishikawa', '石川県', 'chubu'),
  ('18', 'fukui', '福井県', 'chubu'),
  ('19', 'yamanashi', '山梨県', 'chubu'),
  ('20', 'nagano', '長野県', 'chubu'),
  ('21', 'gifu', '岐阜県', 'chubu'),
  ('22', 'shizuoka', '静岡県', 'chubu'),
  ('23', 'aichi', '愛知県', 'chubu'),
  ('24', 'mie', '三重県', 'kinki'),
  ('25', 'shiga', '滋賀県', 'kinki'),
  ('26', 'kyoto', '京都府', 'kinki'),
  ('27', 'osaka', '大阪府', 'kinki'),
  ('28', 'hyogo', '兵庫県', 'kinki'),
  ('29', 'nara', '奈良県', 'kinki'),
  ('30', 'wakayama', '和歌山県', 'kinki'),
  ('31', 'tottori', '鳥取県', 'chugoku'),
  ('32', 'shimane', '島根県', 'chugoku'),
  ('33', 'okayama', '岡山県', 'chugoku'),
  ('34', 'hiroshima', '広島県', 'chugoku'),
  ('35', 'yamaguchi', '山口県', 'chugoku'),
  ('36', 'tokushima', '徳島県', 'shikoku'),
  ('37', 'kagawa', '香川県', 'shikoku'),
  ('38', 'ehime', '愛媛県', 'shikoku'),
  ('39', 'kochi', '高知県', 'shikoku'),
  ('40', 'fukuoka', '福岡県', 'kyushu'),
  ('41', 'saga', '佐賀県', 'kyushu'),
  ('42', 'nagasaki', '長崎県', 'kyushu'),
  ('43', 'kumamoto', '熊本県', 'kyushu'),
  ('44', 'oita', '大分県', 'kyushu'),
  ('45', 'miyazaki', '宮崎県', 'kyushu'),
  ('46', 'kagoshima', '鹿児島県', 'kyushu'),
  ('47', 'okinawa', '沖縄県', 'kyushu');

-- 物件テーブル
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent', 'free')),
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('akiya_bank', 'free_property', 'cheap_rent', 'kominka', 'auction', 'seized', 'general')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'under_negotiation', 'contracted', 'delisted')),
  price INTEGER,
  price_label TEXT,
  monthly_rent INTEGER,
  monthly_rent_label TEXT,
  prefecture_code CHAR(2) NOT NULL REFERENCES prefectures(code),
  prefecture_name TEXT,
  city TEXT,
  address TEXT,
  land_area_sqm DECIMAL(10,2),
  building_area_sqm DECIMAL(10,2),
  built_year INTEGER,
  layout TEXT,
  structure TEXT,
  description TEXT,
  image_url TEXT,
  image_urls JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_cheap BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  is_old_house BOOLEAN DEFAULT FALSE,
  is_diy_friendly BOOLEAN DEFAULT FALSE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_type TEXT DEFAULT 'general',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 物件ソース（複数ポータル対応）
CREATE TABLE listing_sources (
  id SERIAL PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  portal_name TEXT NOT NULL,
  portal_slug TEXT NOT NULL,
  portal_url TEXT NOT NULL,
  price INTEGER,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, portal_slug)
);

-- 補助金テーブル
CREATE TABLE subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefecture_code CHAR(2) NOT NULL REFERENCES prefectures(code),
  city TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT CHECK (category IN (
    'migration_support', 'renovation', 'housing_acquisition',
    'rent_subsidy', 'child_rearing', 'business_startup',
    'telework', 'farming', 'akiya_utilization'
  )),
  amount_text TEXT,
  max_amount INTEGER,
  conditions TEXT,
  eligibility TEXT,
  application_period TEXT,
  source_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  fiscal_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_listings_prefecture ON listings(prefecture_code) WHERE status = 'active';
CREATE INDEX idx_listings_type ON listings(listing_type) WHERE status = 'active';
CREATE INDEX idx_listings_price ON listings(price) WHERE status = 'active';
CREATE INDEX idx_listings_rent ON listings(monthly_rent) WHERE status = 'active' AND listing_type = 'rent';
CREATE INDEX idx_listings_free ON listings(prefecture_code) WHERE status = 'active' AND is_free = TRUE;
CREATE INDEX idx_listings_updated ON listings(updated_at DESC);
CREATE INDEX idx_listings_source_url ON listings(source_url);
CREATE INDEX idx_subsidies_prefecture ON subsidies(prefecture_code) WHERE is_active = TRUE;
CREATE INDEX idx_listing_sources_listing ON listing_sources(listing_id);

-- RLS（公開読み取り専用）
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prefectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read" ON prefectures FOR SELECT USING (true);
CREATE POLICY "Public read" ON listings FOR SELECT USING (true);
CREATE POLICY "Public read" ON listing_sources FOR SELECT USING (true);
CREATE POLICY "Public read" ON subsidies FOR SELECT USING (true);
