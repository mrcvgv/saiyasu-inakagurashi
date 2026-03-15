# SUUMO型全国ポータルサイト設計書

## 概要

最安田舎暮らしを **全国の空き家・0円物件・低価格賃貸** をまとめるSUUMO型ポータルに進化させる。

---

## 1. データモデル

### 1.1 拡張Listing型

```typescript
export type ListingType = 'sale' | 'rent' | 'free';

export type ListingCategory =
  | 'akiya_bank'      // 空き家バンク
  | 'free_property'   // 0円物件
  | 'cheap_rent'      // 低価格賃貸
  | 'kominka'         // 古民家
  | 'general';

export type ListingStatus =
  | 'active' | 'under_negotiation' | 'contracted' | 'delisted';

export type Listing = {
  id: string;
  title: string;
  listingType: ListingType;
  price: number;
  priceLabel: string;
  monthlyRent?: number;
  monthlyRentLabel?: string;
  depositMonths?: number;
  keyMoneyMonths?: number;
  managementFee?: number;
  prefectureSlug: string;
  prefecture: string;
  citySlug: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  landArea?: number;
  buildingArea?: number;
  builtYear?: number;
  layout?: string;
  structure?: string;
  floors?: number;
  parkingSpaces?: number;
  category: ListingCategory;
  status: ListingStatus;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  sourceName: string;
  sourceUrl: string;
  sourceType: 'municipal_bank' | 'akiya_portal' | 'rent_portal' | 'general';
  tags: string[];
  isCheap: boolean;
  isFree: boolean;
  isOldHouse: boolean;
  isDIYFriendly: boolean;
  isPetFriendly?: boolean;
  hasGarden?: boolean;
  hasHotSpring?: boolean;
  createdAt: string;
  updatedAt: string;
  lastCrawledAt?: string;
};
```

### 1.2 自治体マスタ型

```typescript
export type Prefecture = {
  code: string;        // "01" - "47" (JIS X 0401)
  slug: string;        // "hokkaido"
  name: string;        // "北海道"
  nameKana: string;
  region: RegionSlug;
  listingCount: number;
  akiyaBankCount: number;
};

export type City = {
  code: string;        // "01100" (JIS X 0402)
  slug: string;        // "sapporo-shi"
  name: string;        // "札幌市"
  nameKana: string;
  prefectureCode: string;
  prefectureSlug: string;
  prefectureName: string;
  hasAkiyaBank: boolean;
  akiyaBankUrl?: string;
  listingCount: number;
  latitude?: number;
  longitude?: number;
};

export type RegionSlug =
  | 'hokkaido' | 'tohoku' | 'kanto' | 'chubu'
  | 'kinki' | 'chugoku' | 'shikoku' | 'kyushu';

export type Region = {
  slug: RegionSlug;
  name: string;
  prefectureCodes: string[];
};
```

### 1.3 補助金型（拡張）

```typescript
export type SubsidyCategory =
  | 'migration_support' | 'renovation' | 'housing_acquisition'
  | 'child_rearing' | 'akiya_utilization';

export type Subsidy = {
  id: string;
  prefectureCode: string;
  prefectureName: string;
  cityCode: string;
  cityName: string;
  title: string;
  summary: string;
  category: SubsidyCategory;
  amount?: string;
  maxAmount?: number;
  conditions?: string;
  eligibility?: string;
  applicationPeriod?: string;
  sourceUrl: string;
  isActive: boolean;
  updatedAt: string;
};
```

---

## 2. DB設計 (Supabase / PostgreSQL)

### 2.1 テーブル設計

```sql
-- 地理マスタ
CREATE TABLE regions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE prefectures (
  code CHAR(2) PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_kana TEXT,
  region_slug TEXT NOT NULL REFERENCES regions(slug),
  listing_count INTEGER DEFAULT 0,
  akiya_bank_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cities (
  code CHAR(5) PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  name_kana TEXT,
  prefecture_code CHAR(2) NOT NULL REFERENCES prefectures(code),
  has_akiya_bank BOOLEAN DEFAULT FALSE,
  akiya_bank_url TEXT,
  listing_count INTEGER DEFAULT 0,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prefecture_code, slug)
);

-- 物件テーブル
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent', 'free')),
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  price INTEGER,
  price_label TEXT,
  monthly_rent INTEGER,
  monthly_rent_label TEXT,
  deposit_months DECIMAL(3,1),
  key_money_months DECIMAL(3,1),
  management_fee INTEGER,
  prefecture_code CHAR(2) NOT NULL REFERENCES prefectures(code),
  city_code CHAR(5) REFERENCES cities(code),
  address TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  land_area_sqm DECIMAL(10,2),
  building_area_sqm DECIMAL(10,2),
  built_year INTEGER,
  layout TEXT,
  structure TEXT,
  floors INTEGER,
  parking_spaces INTEGER,
  description TEXT,
  image_url TEXT,
  image_urls JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_cheap BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  is_old_house BOOLEAN DEFAULT FALSE,
  is_diy_friendly BOOLEAN DEFAULT FALSE,
  is_pet_friendly BOOLEAN,
  has_garden BOOLEAN,
  has_hot_spring BOOLEAN,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_type TEXT DEFAULT 'general',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 補助金テーブル
CREATE TABLE subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefecture_code CHAR(2) NOT NULL REFERENCES prefectures(code),
  city_code CHAR(5) REFERENCES cities(code),
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  amount_text TEXT,
  max_amount INTEGER,
  conditions TEXT,
  eligibility TEXT,
  application_period TEXT,
  source_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- クローラーソース管理
CREATE TABLE crawler_sources (
  id SERIAL PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  prefecture_code CHAR(2) REFERENCES prefectures(code),
  city_code CHAR(5) REFERENCES cities(code),
  base_url TEXT NOT NULL,
  listing_strategy TEXT,
  detail_strategy TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'planned',
  priority INTEGER DEFAULT 5,
  last_crawled_at TIMESTAMPTZ,
  last_error TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 インデックス

```sql
CREATE INDEX idx_listings_prefecture_type ON listings(prefecture_code, listing_type) WHERE status = 'active';
CREATE INDEX idx_listings_city ON listings(city_code) WHERE status = 'active';
CREATE INDEX idx_listings_price ON listings(price) WHERE status = 'active' AND listing_type IN ('sale', 'free');
CREATE INDEX idx_listings_rent ON listings(monthly_rent) WHERE status = 'active' AND listing_type = 'rent';
CREATE INDEX idx_listings_free ON listings(prefecture_code) WHERE status = 'active' AND is_free = TRUE;
CREATE INDEX idx_listings_updated ON listings(updated_at DESC);
```

---

## 3. ページ構成（SUUMO型URL設計）

```
/                                      トップ（地方×種別マトリックス）
/sale/                                 売買物件トップ
/rent/                                 賃貸物件トップ
/free/                                 0円物件特集
/prefectures/                          全都道府県一覧
/prefectures/[slug]/                   都道府県ページ
/prefectures/[slug]/sale/              都道府県 × 売買
/prefectures/[slug]/rent/              都道府県 × 賃貸
/prefectures/[slug]/free/              都道府県 × 0円
/cities/[prefSlug]/[citySlug]/         市区町村ページ
/cities/[prefSlug]/[citySlug]/sale/    市区町村 × 売買
/cities/[prefSlug]/[citySlug]/rent/    市区町村 × 賃貸
/listings/[id]/                        物件詳細
/search/                               高度検索
/search/results/                       検索結果
/subsidy/                              補助金トップ
/subsidy/[prefSlug]/                   都道府県別補助金
```

---

## 4. クローラー拡張方針

### Tier 1: 全国ポータル（高効率）
- 家いちば (ieichiba) — 全国 — live
- zero.estate — 全国0円 — live (3県→全県展開)
- アットホーム空き家 — 全国 — planned
- ジモティー不動産 — 全国 — planned (賃貸含む)

### Tier 2: 広域ポータル（地方単位）
- 各都道府県の移住ポータル
- 地方の不動産ポータル

### Tier 3: 個別自治体
- municipal_base.js のパターンで順次追加

### 賃貸ソース
- ジモティー不動産（月3万円以下フィルタ）
- SUUMO賃貸（低価格帯）

---

## 5. ISR/SSG戦略

| ページ | 方式 | revalidate |
|---|---|---|
| トップ | SSG | — |
| 都道府県一覧 | SSG | — |
| 都道府県詳細 | ISR | 1時間 |
| 市区町村 | ISR | 1時間 |
| 物件詳細 | ISR | 30分 |
| 検索結果 | SSR | — |
| 補助金 | ISR | 24時間 |

---

## 6. 実装優先順位

### Phase 0: 基盤準備
1. Supabaseプロジェクト作成・テーブル作成
2. 都道府県・地方マスタデータ作成
3. 市区町村マスタデータ作成（総務省データ）
4. Supabaseクライアント設定
5. Listing型の拡張
6. 既存データのSupabaseインポート

### Phase 1: コアページ
7. 都道府県一覧ページ
8. 都道府県詳細ページ（ISR）
9. 市区町村ページ（ISR）
10. トップページの地方×種別マトリックス
11. パンくずナビ
12. ページネーション

### Phase 2: 検索・フィルタ
13. 高度検索フォーム（売買/賃貸/面積/築年/間取り）
14. サーバーサイド検索API
15. 検索結果ページ
16. 0円物件・カテゴリページのDB対応

### Phase 3: クローラー拡張
17. sync-to-supabase.ts 作成
18. zero.estate 全県展開
19. アットホーム空き家クローラー
20. 賃貸ソース追加
21. revalidate API連携

### Phase 4: SEO・UX
22. 動的サイトマップ
23. JSON-LD構造化データ
24. OGP画像自動生成
25. レスポンシブ統一
