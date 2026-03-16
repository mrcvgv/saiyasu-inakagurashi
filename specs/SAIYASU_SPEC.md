# SAIYASU_SPEC.md — 最安田舎暮らし 技術仕様

## ディレクトリ構成

```
saiyasu-inakagurashi/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # トップページ
│   │   ├── layout.tsx               # 共通レイアウト
│   │   ├── globals.css
│   │   ├── search/page.tsx          # 検索結果
│   │   ├── listings/
│   │   │   ├── page.tsx             # 物件一覧
│   │   │   └── [id]/page.tsx        # 物件詳細
│   │   ├── cheap/page.tsx           # 格安特集 (100万以下)
│   │   ├── cheap-land/page.tsx      # 格安土地
│   │   ├── akiya/page.tsx           # 空き家特集
│   │   ├── cheap-rent/page.tsx      # 格安賃貸
│   │   ├── auction/page.tsx         # 競売・公売
│   │   ├── business/page.tsx        # 事業用物件
│   │   ├── subsidy/page.tsx         # 補助金一覧
│   │   ├── guide/page.tsx           # 移住ガイド
│   │   └── consult/page.tsx         # 相談フォーム
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ListingCard.tsx
│   │   ├── SearchForm.tsx
│   │   └── SectionTitle.tsx
│   ├── data/
│   │   ├── listings.ts              # ダミーデータ
│   │   ├── listings-live.json       # 実データ (ハンター出力)
│   │   ├── listings-loader.ts       # データ読み込み統合
│   │   ├── subsidies.ts             # ダミー補助金
│   │   ├── prefectures.ts           # 都道府県マスタ
│   │   └── regions.ts               # 地方区分マスタ
│   ├── lib/
│   │   ├── supabase.ts              # Supabaseクライアント
│   │   ├── queries.ts               # DBクエリ
│   │   ├── filters.ts               # フィルタロジック
│   │   └── format.ts                # フォーマットユーティリティ
│   └── types/
│       ├── listing.ts               # Listing型
│       └── subsidy.ts               # Subsidy型
├── specs/                           # AI間指示ファイル (このディレクトリ)
├── docs/                            # ドキュメント
├── public/
├── scripts/
└── supabase/
```

## 型定義 (現行)

### Listing

```typescript
type Listing = {
  id: string;
  title: string;
  price: number;
  priceLabel: string;
  prefecture: string;
  city: string;
  address?: string;
  landArea?: number;
  buildingArea?: number;
  builtYear?: number;
  description?: string;
  imageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  isCheap: boolean;
  isFree: boolean;
  isOldHouse: boolean;
  isDIYFriendly: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Subsidy

```typescript
type Subsidy = {
  id: string;
  prefecture: string;
  city: string;
  title: string;
  summary: string;
  amount?: string;
  conditions?: string;
  sourceUrl: string;
  updatedAt: string;
};
```

## データフロー

```
空き家ハンター
  → exports/normalized_listings.json
  → Supabase投入 (import-to-supabase.js) or 直接APIコール
  → Supabase DB
  → lib/queries.ts (SSR時にfetch)
  → ページコンポーネントで表示

フォールバック:
  Supabase接続不可 → data/listings.ts (ダミーデータ) を使用
```

## ページごとのデータ要件

| ページ | データ | フィルタ |
|---|---|---|
| / | listings (新着4件 + 人気4件) | sort by updatedAt / price |
| /search | listings | prefecture, maxPrice, keyword |
| /listings | listings (全件) | ページネーション |
| /listings/[id] | listing (1件) + 関連物件 + 関連補助金 | id |
| /cheap | listings (100万以下) | price <= 1_000_000 |
| /cheap-land | listings (格安土地) | price <= 10_000_000, listing_type = sale |
| /akiya | listings (空き家) | isOldHouse = true |
| /cheap-rent | listings (格安賃貸) | listing_type = rent |
| /auction | listings (競売) | listing_type = auction |
| /subsidy | subsidies (全件) | prefecture |
| /guide | 静的コンテンツ | — |
| /consult | フォーム | — |
