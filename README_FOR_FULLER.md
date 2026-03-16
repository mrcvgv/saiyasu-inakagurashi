# README FOR FULLER

掘り出し物件ラボのフロントエンド開発ガイド。
外部の開発者がこのリポジトリで作業するために必要な情報をすべてまとめています。

---

## セットアップ

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # 本番ビルド（必ずエラーなしで通ること）
npm run lint      # ESLint
```

---

## 技術スタック

| 技術 | バージョン |
|---|---|
| Next.js | 16 (App Router, Turbopack) |
| TypeScript | 5 |
| Tailwind CSS | v4 |
| React | 19 |

---

## ディレクトリ構成

```
src/
├── app/                    ← ページ（Next.js App Router）
│   ├── page.tsx               トップ
│   ├── search/page.tsx        検索結果
│   ├── listings/
│   │   ├── page.tsx           物件一覧
│   │   └── [id]/page.tsx      物件詳細（197件分を静的生成）
│   ├── cheap/page.tsx         激安特集（価格帯別）
│   ├── cheap-land/page.tsx    格安土地
│   ├── akiya/page.tsx         空き家・古民家
│   ├── cheap-rent/page.tsx    格安賃貸
│   ├── auction/page.tsx       競売・公売
│   ├── business/page.tsx      事業用物件
│   ├── subsidy/page.tsx       補助金一覧
│   ├── guide/page.tsx         移住ガイド
│   ├── consult/page.tsx       無料相談フォーム
│   ├── layout.tsx             共通レイアウト
│   └── globals.css            グローバルCSS
│
├── components/             ← 共通コンポーネント
│   ├── Header.tsx             ヘッダー（モバイルメニュー付き）
│   ├── Footer.tsx             フッター
│   ├── ListingCard.tsx        物件カード（画像・価格・タグ表示）
│   ├── SearchForm.tsx         検索フォーム（都道府県・価格帯）
│   └── SectionTitle.tsx       セクション見出し
│
├── data/                   ← データ層
│   ├── listings-live.json     実物件データ（197件・自動生成・編集禁止）
│   ├── listings.ts            ダミー物件データ（8件・フォールバック用）
│   ├── listings-loader.ts     データ読み込み統合
│   ├── subsidies.ts           補助金ダミーデータ（6件）
│   ├── prefectures.ts         47都道府県マスタ（single source of truth）
│   └── regions.ts             8地方区分マスタ
│
├── lib/                    ← ユーティリティ
│   ├── filters.ts             検索フィルタロジック
│   ├── format.ts              価格・面積・日付フォーマット
│   ├── queries.ts             Supabaseクエリ（将来用・今は未使用）
│   └── supabase.ts            Supabaseクライアント（将来用・今は未使用）
│
└── types/                  ← 型定義
    ├── listing.ts             Listing 型
    └── subsidy.ts             Subsidy 型
```

---

## データの流れ

```
listings-live.json (197件)    ← 別プロジェクトが自動生成。触るな。
        │
        ↓
listings-loader.ts            ← live が読めなければ dummy にフォールバック
        │
        ↓
各ページ (page.tsx)            ← filter → sort → map → ListingCard
```

- `listings-live.json` はスクレイピングで生成される。手動で編集しない。
- live データがない環境では `listings.ts` のダミー8件で動く。
- 都道府県は `prefectures.ts` が唯一の正。ハードコードしない。

---

## 型定義

### Listing

```typescript
type Listing = {
  id: string;
  title: string;          // 物件タイトル
  price: number;          // 価格（円）。0 = 無料
  priceLabel: string;     // 表示用（"80万円"）
  prefecture: string;     // "長野県"
  city: string;           // "佐久市"
  address?: string;
  landArea?: number;      // 土地面積 m²
  buildingArea?: number;  // 建物面積 m²
  builtYear?: number;     // 築年（西暦）
  description?: string;
  imageUrl?: string;
  sourceName: string;     // 取得元サイト名
  sourceUrl: string;      // 取得元URL
  tags: string[];         // ["古民家", "海近", "DIY可"]
  isCheap: boolean;       // price <= 1,000,000
  isFree: boolean;        // price === 0
  isOldHouse: boolean;    // builtYear < 1985
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
  title: string;        // 制度名
  summary: string;
  amount?: string;      // "最大100万円"
  conditions?: string;
  sourceUrl: string;
  updatedAt: string;
};
```

---

## コンポーネント

### ListingCard

物件を1枚のカードで表示。画像→タイトル→価格→所在地→面積→タグ。

```tsx
<ListingCard listing={listing} />
```

### SearchForm

検索フォーム。キーワード・都道府県・価格帯を選んで `/search` に遷移。

```tsx
<SearchForm defaultKeyword="古民家" defaultPrefecture="長野県" />
```

### SectionTitle

セクション見出し。左に緑ボーダー。

```tsx
<SectionTitle>新着物件</SectionTitle>
```

### Header

ナビリンクは `NAV_LINKS` 配列で管理。追加は1行。

```typescript
const NAV_LINKS = [
  { href: "/cheap-land", label: "格安土地" },
  { href: "/akiya", label: "空き家" },
  // ← ここに足す
];
```

---

## ページの追加手順

### 1. ファイルを作る

```
src/app/my-page/page.tsx
```

### 2. テンプレート

```tsx
import type { Metadata } from "next";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";

export const metadata: Metadata = {
  title: "ページタイトル",
  description: "説明文",
};

export default function MyPage() {
  const filtered = listings.filter((l) => /* 条件 */);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">見出し</h1>
      <p className="mb-8 text-sm text-gray-500">
        説明テキスト（{filtered.length}件）
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">
          該当する物件はありません
        </p>
      )}
    </main>
  );
}
```

### 3. ナビに追加

`src/components/Header.tsx` の `NAV_LINKS` に1行。

### 4. ビルド確認

```bash
npm run build
```

通れば OK。

---

## デザインルール

| 項目 | 値 |
|---|---|
| メインカラー | `green-700` / `green-900` |
| アクセント | `blue-600` / `blue-800` |
| 価格強調 | `red-600` / `orange-700` |
| 背景 | `white` / `gray-50` |
| テキスト | `gray-900` / `gray-700` |
| カード | `rounded-xl border border-gray-200 bg-white` |
| セクション間隔 | `mb-12` |
| レイアウト幅 | `max-w-5xl mx-auto px-4` |
| モバイル | 1列 |
| `sm` (640px) | 2列 |
| `lg` (1024px) | 必要に応じて3列 |

---

## 禁止事項

| やるな | 理由 |
|---|---|
| `listings-live.json` を手動編集 | 自動生成ファイル。壊すとビルドが落ちる |
| スクレイピングのコードを書く | 別プロジェクト `akiya-hunter` の責務 |
| 都道府県をハードコード | `src/data/prefectures.ts` を import して使え |
| `lib/queries.ts` / `lib/supabase.ts` を消す | DB接続用に予約されている |
| データスキーマを勝手に変える | `types/listing.ts` を変更する場合は要相談 |

---

## よくやる作業

### 新しいカテゴリページを追加する

1. `src/app/<slug>/page.tsx` を作る（上のテンプレートをコピー）
2. `listings.filter()` の条件を変える
3. `Header.tsx` の `NAV_LINKS` に追加
4. `Footer.tsx` にもリンクを追加
5. `npm run build` で確認

### 物件カードの見た目を変える

`src/components/ListingCard.tsx` を編集。
全ページのカード表示が一括で変わる。

### 検索フォームに項目を追加する

`src/components/SearchForm.tsx` を編集。
`handleSubmit` で URL params に追加し、`src/lib/filters.ts` にフィルタ条件を追加。

### 補助金データを追加する

`src/data/subsidies.ts` に追記。型は `src/types/subsidy.ts`。

---

## プロジェクト全体像

```
あなたの担当
    ↓
┌───────────────────────────┐
│  saiyasu-inakagurashi     │ ← このリポジトリ。フロントエンド。
│  (掘り出し物件ラボ)         │
└───────────┬───────────────┘
            │ listings-live.json を受け取る
            ↓
┌───────────────────────────┐
│  akiya-hunter             │ ← 別リポジトリ。スクレイピング。触らなくていい。
│  (空き家ハンター)           │
└───────────────────────────┘
```

フロントの仕事はこのリポジトリだけ。
データ収集側は別チームが別リポジトリでやっている。
