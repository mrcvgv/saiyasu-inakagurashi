# PAGE_MAP.md — ページ構成と導線設計

## ページ一覧

### コアページ (MVP必須)

| パス | ページ名 | 概要 | SEOキーワード | 状態 |
|---|---|---|---|---|
| `/` | トップ | ヒーロー + カテゴリ + 価格 + エリア + 新着 + 人気 | 格安物件, 田舎暮らし, 空き家 | 実装済み |
| `/search` | 検索結果 | フィルタ付き物件一覧 | {都道府県} 空き家, 格安物件 {エリア} | 実装済み |
| `/listings` | 物件一覧 | 全物件のページネーション一覧 | 格安物件一覧, 空き家バンク | 実装済み |
| `/listings/[id]` | 物件詳細 | 個別物件の詳細情報 + 関連物件 + 関連補助金 | — | 実装済み |
| `/cheap` | 格安特集 | 100万円以下の物件 | 100万円以下 物件, 格安不動産 | 実装済み |
| `/subsidy` | 補助金一覧 | 都道府県別の移住補助金 | 移住補助金, 空き家改修補助 | 実装済み |

### カテゴリページ (Phase 2)

| パス | ページ名 | 概要 | SEOキーワード | 状態 |
|---|---|---|---|---|
| `/cheap-land` | 格安土地 | 0円〜1000万の土地・物件 | 格安土地, 安い土地 | 未実装 |
| `/akiya` | 空き家 | 古民家・再生物件 | 空き家, 古民家, セルフリノベ | 未実装 |
| `/cheap-rent` | 格安賃貸 | 月1万〜5万の賃貸 | 格安賃貸, 田舎 家賃 | 未実装 |
| `/auction` | 競売・公売 | 裁判所競売・官公庁オークション | 競売物件, 公売, 差押え | 未実装 |
| `/business` | 事業用物件 | 倉庫付き・店舗可 | 事業用物件, 倉庫付き | 未実装 |

### ガイド・コンテンツ (Phase 3)

| パス | ページ名 | 概要 |
|---|---|---|
| `/guide` | 移住ガイド | 移住の手順・注意点 |
| `/guide/subsidy` | 補助金の使い方 | 補助金申請ガイド |
| `/guide/akiya` | 空き家の買い方 | 購入手順・注意点 |
| `/guide/tax` | 固定資産税 | 税金の目安 |
| `/guide/cost` | 生活費 | 田舎の生活費シミュレーション |
| `/consult` | 無料相談 | 問い合わせフォーム |

### SEOランディングページ (Phase 4)

| パス | 概要 |
|---|---|
| `/prefecture/[slug]` | 都道府県別物件一覧 (47ページ) |
| `/prefecture/[slug]/subsidy` | 都道府県別補助金 |
| `/tag/[tag]` | タグ別物件 (古民家, 0円, 畑付き, etc.) |
| `/price/free` | 0円物件特集 |
| `/price/under-100man` | 100万円以下特集 |
| `/price/under-500man` | 500万円以下特集 |

---

## 導線設計

```
トップページ
├── カテゴリ導線 → /cheap-land, /akiya, /cheap-rent, /auction, /business, /guide
├── 価格導線 → /search?maxPrice=0, /search?maxPrice=1000000, ...
├── エリア導線 → /search?prefecture={都道府県}
├── 特集 → /search?maxPrice=0, /akiya, /subsidy
├── ガイド → /guide
├── 新着物件 → /listings/[id]
├── 人気物件 → /listings/[id]
└── CTA → /consult

検索結果 /search
├── 物件カード → /listings/[id]
└── 再検索フォーム

物件詳細 /listings/[id]
├── 関連物件 → /listings/[id]
├── 関連補助金 → /subsidy
├── 同じ都道府県 → /search?prefecture={都道府県}
└── CTA → /consult

補助金一覧 /subsidy
├── 都道府県フィルタ
└── 関連物件へのリンク → /search?prefecture={都道府県}
```

---

## URL設計ルール

- 日本語URLは使わない (slug は英語)
- 都道府県は slug (hokkaido, nagano, etc.)
- 検索パラメータは query string (prefecture, maxPrice, keyword)
- 物件IDは UUID (Supabase) または連番
