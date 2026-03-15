# 最安田舎暮らし — SUUMO型全国ポータル設計書 v2

## コンセプト

**全国の格安物件を、全ポータルから横断検索できるまとめサイト**

- 不動産版カカクコム
- 0円〜1000万円の格安特化（nicheポジション）
- SUUMO, LIFULL, アットホーム, 空き家バンク etc. を横断集約
- 各物件にソースタグ表示（どのポータルに載っているか）

```
SUUMO ─┐
LIFULL ─┤
at home ─┤
家いちば ─┼→ 最安田舎暮らし（横断検索）→ ユーザー
空き家バンク ─┤
ジモティー ─┤
zero.estate ─┘
```

---

## ターゲット × 導線

| ターゲット | 導線 | 説明 |
|---|---|---|
| 格安で土地が欲しい個人 | /cheap-land | 0円〜1000万の土地・物件 |
| 格安で家が欲しい個人 | /cheap-house | 建物付き格安物件 |
| 安く借りたい人 | /cheap-rent | 月1万〜5万の格安賃貸 |
| DIY / 空き家再生 | /akiya | 古民家再生・セルフリノベ向け |
| 拠点が欲しい企業 | /business | 倉庫付き・店舗可・広い土地 |
| 移住検討者 | /guide | 補助金・買い方・生活費ガイド |
| 問い合わせ・相談 | /consult | 収益導線 |

---

## 価格フィルタ（ユーザー心理に合わせた区分）

| 価格帯 | 印象 |
|---|---|
| 0円 | ネタ枠 / 無償譲渡 |
| 100万円以下 | 超激安 |
| 300万円以下 | 安い |
| 500万円以下 | 現実的 |
| 1000万円以下 | 普通 |

---

## URL設計（SEO最適化）

### メイン導線

```
/                                      トップ
/cheap-land/                           格安土地
/cheap-house/                          格安物件（建物付き）
/cheap-rent/                           格安賃貸
/akiya/                                空き家・DIY物件
/business/                             事業用物件
```

### 地域検索（ユーザーは最初に場所を決める）

```
/area/                                 地域トップ
/area/hokkaido/                        北海道
/area/tohoku/                          東北
/area/kanto/                           関東
/area/chubu/                           中部
/area/kinki/                           近畿
/area/chugoku/                         中国
/area/shikoku/                         四国
/area/kyushu/                          九州・沖縄
/area/[region]/[prefSlug]/             都道府県
/area/[region]/[prefSlug]/[citySlug]/  市区町村
```

### 地域 × 種別

```
/area/kanto/nagano/sale/               長野 × 売買
/area/kanto/nagano/rent/               長野 × 賃貸
/area/kanto/nagano/akiya/              長野 × 空き家
/area/kanto/nagano/free/               長野 × 0円物件
```

### 物件詳細

```
/listings/[id]/                        物件詳細
```

### 検索

```
/search/                               高度検索
/search/results/                       検索結果
```

### ガイド（SEO入口コンテンツ）

```
/guide/                                ガイドトップ
/guide/migration/                      田舎移住とは
/guide/subsidy/                        移住の補助金
/guide/akiya-howto/                    空き家の買い方
/guide/cheap-land-tips/                格安土地の注意点
/guide/property-tax/                   固定資産税
/guide/living-cost/                    田舎の生活費
```

### 補助金

```
/subsidy/                              補助金トップ
/subsidy/[prefSlug]/                   都道府県別補助金
```

### 収益導線

```
/consult/                              相談・問い合わせ
```

---

## サイト構造（全体マップ）

```
HOME
├ cheap-land          格安土地
├ cheap-house         格安物件
├ cheap-rent          格安賃貸
├ akiya               空き家・DIY
├ business            事業用物件
│
├ area                地域検索
│  ├ hokkaido
│  ├ tohoku
│  ├ kanto
│  │  ├ nagano
│  │  │  ├ sale
│  │  │  ├ rent
│  │  │  ├ akiya
│  │  │  └ free
│  │  ├ chiba
│  │  └ ...
│  ├ chubu
│  ├ kinki
│  ├ chugoku
│  ├ shikoku
│  └ kyushu
│
├ search              検索
│
├ guide               ガイド（SEO入口）
│  ├ migration        移住
│  ├ subsidy          補助金
│  ├ akiya-howto      空き家の買い方
│  ├ cheap-land-tips  格安土地の注意点
│  ├ property-tax     固定資産税
│  └ living-cost      生活費
│
├ subsidy             補助金DB
│  └ [prefSlug]       都道府県別
│
└ consult             相談・問い合わせ（収益導線）
```

---

## ソースタグ表示（最大の差別化）

物件カードに掲載ポータルのバッジを表示：

```
┌─────────────────────────────────────┐
│ 長野県佐久市 古民家 4DK              │
│ 【売買】80万円                       │
│ [SUUMO] [LIFULL] [空き家バンク]      │
│ 土地 500㎡ / 建物 82㎡ / 築45年      │
└─────────────────────────────────────┘
```

### データモデル

```typescript
type ListingSource = {
  portalName: string;      // "SUUMO", "LIFULL", "空き家バンク"
  portalSlug: string;      // "suumo", "lifull", "akiya-bank"
  portalUrl: string;       // そのポータルでの物件URL
  price?: number;          // ポータルごとの価格
  lastSeen: string;        // 最終確認日
};

// Listing型に追加
type Listing = {
  // ...既存フィールド
  sources: ListingSource[];
  lowestPrice: number;
  portalCount: number;
};
```

---

## 移住コスト計算機

```
物件価格:        80万円
リフォーム概算:  +200万円
引越し費用:      +30万円
移住補助金:      -100万円
──────────────────
実質コスト:      210万円
```

---

## マネタイズ導線

### ① 不動産問い合わせ（/consult）
- 資料請求・問い合わせフォーム
- 1件 3万〜10万の紹介料

### ② 移住サポート
- 移住コンサルティング

### ③ 空き家DIY講座
- 有料コンテンツ

---

## DB設計 (Supabase / PostgreSQL)

### テーブル一覧

- regions — 8地方区分
- prefectures — 47都道府県
- cities — 市区町村
- listings — 物件
- listing_sources — 物件×ポータルの紐付け（複数ソース対応）
- subsidies — 補助金
- crawler_sources — クローラーソース管理
- crawl_runs — クロール実行ログ

### listing_sources テーブル（NEW）

```sql
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
```

---

## クローラー拡張（3層戦略）

### Tier 1: 全国ポータル
- 家いちば, zero.estate, アットホーム空き家, ジモティー

### Tier 2: 広域ポータル
- 各都道府県の移住ポータル

### Tier 3: 個別自治体
- municipal_base.js パターンで順次追加

### 賃貸ソース
- SUUMO賃貸（低価格帯）, LIFULL HOME'S, ジモティー

---

## ISR/SSG戦略

| ページ | 方式 | revalidate |
|---|---|---|
| トップ | SSG | — |
| 地域トップ | SSG | — |
| 都道府県 | ISR | 1時間 |
| 市区町村 | ISR | 1時間 |
| 物件詳細 | ISR | 30分 |
| 検索結果 | SSR | — |
| ガイド | SSG | — |
| 補助金 | ISR | 24時間 |

---

## 実装優先順位

### Phase 0: 基盤準備
1. Supabaseプロジェクト作成・テーブル作成
2. 都道府県・地方・市区町村マスタデータ
3. Supabaseクライアント設定
4. Listing型の拡張（ListingSource含む）
5. 既存データのSupabaseインポート

### Phase 1: コアページ
6. トップページ（最強の導線設計）
7. /area/ 地域検索ページ
8. 都道府県ページ（ISR）
9. 市区町村ページ（ISR）
10. /cheap-land/, /cheap-house/, /cheap-rent/, /akiya/ カテゴリページ
11. 物件詳細ページ（ソースタグ表示、複数画像）
12. パンくずナビ・ページネーション

### Phase 2: 検索・フィルタ
13. 高度検索フォーム
14. サーバーサイド検索API
15. 検索結果ページ
16. 価格フィルタ（0円/100万以下/300万以下/500万以下/1000万以下）

### Phase 3: クローラー拡張
17. sync-to-supabase.ts 作成
18. zero.estate 全県展開
19. 新規ポータル追加
20. 賃貸ソース追加

### Phase 4: SEO・ガイド・収益
21. /guide/ コンテンツ作成
22. 動的サイトマップ
23. JSON-LD構造化データ
24. /consult/ 収益導線ページ
25. 移住コスト計算機
