# Contributing Guide

掘り出し物件ラボ（最安田舎暮らし）のフロントエンド開発ガイドです。

## セットアップ

```bash
git clone <repo-url>
cd saiyasu-inakagurashi
npm install
npm run dev
```

http://localhost:3000 で開発サーバーが起動します。

## 技術スタック

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js | 16 (App Router) | フレームワーク |
| TypeScript | 5 | 型安全 |
| Tailwind CSS | v4 | スタイリング |
| Supabase | — | DB (将来接続) |

## ディレクトリ構成

```
src/
├── app/                  # ページ (App Router)
│   ├── page.tsx          # トップページ
│   ├── search/           # 検索結果
│   ├── listings/         # 物件一覧 / 詳細
│   ├── cheap/            # 激安特集
│   ├── cheap-land/       # 格安土地
│   ├── akiya/            # 空き家・古民家
│   ├── cheap-rent/       # 格安賃貸
│   ├── auction/          # 競売・公売
│   ├── business/         # 事業用物件
│   ├── subsidy/          # 補助金一覧
│   ├── guide/            # 移住ガイド
│   └── consult/          # 無料相談フォーム
├── components/           # 共通コンポーネント
│   ├── Header.tsx        # ヘッダー (モバイルメニュー付き)
│   ├── Footer.tsx        # フッター
│   ├── ListingCard.tsx   # 物件カード
│   ├── SearchForm.tsx    # 検索フォーム
│   └── SectionTitle.tsx  # セクション見出し
├── data/                 # データ
│   ├── listings.ts       # ダミー物件データ (8件)
│   ├── listings-live.json # 実データ (スクレイピング結果)
│   ├── listings-loader.ts # データ読み込み (live → fallback to dummy)
│   ├── subsidies.ts      # ダミー補助金データ
│   ├── prefectures.ts    # 47都道府県マスタ
│   └── regions.ts        # 8地方区分マスタ
├── lib/                  # ユーティリティ
│   ├── filters.ts        # 検索フィルタロジック
│   ├── format.ts         # 価格・面積・日付フォーマット
│   ├── queries.ts        # Supabase クエリ (将来用)
│   └── supabase.ts       # Supabase クライアント (将来用)
└── types/                # 型定義
    ├── listing.ts        # Listing 型
    └── subsidy.ts        # Subsidy 型
```

## データの流れ

```
listings-live.json (実データ, 197件)
        ↓
listings-loader.ts (読み込み・統合)
        ↓ fallback
listings.ts (ダミーデータ, 8件)
        ↓
各ページ (import { allListings } from "@/data/listings-loader")
```

`listings-live.json` はスクレイピングで自動生成されるファイルです。
手動編集は不要ですが、フォーマットが壊れていたら `npm run build` でエラーが出ます。

## ページの追加方法

1. `src/app/<slug>/page.tsx` を作成
2. データが必要なら `@/data/listings-loader` から import
3. 既存コンポーネント (`ListingCard`, `SectionTitle` 等) を活用
4. `Header.tsx` の `NAV_LINKS` にリンクを追加

## コンポーネントの追加方法

1. `src/components/<Name>.tsx` を作成
2. Props の型を定義
3. Tailwind CSS でスタイリング

## 型の追加方法

1. `src/types/<name>.ts` に型を定義
2. 各コンポーネントから import

## コマンド

```bash
npm run dev    # 開発サーバー (http://localhost:3000)
npm run build  # 本番ビルド (エラーチェック)
npm run lint   # ESLint
```

## 注意事項

- **スクレイピング関連のコードはこのリポジトリに書かないでください** (別プロジェクト `akiya-hunter` の責務)
- `listings-live.json` は自動生成ファイルなので手動編集しない
- 都道府県データは `src/data/prefectures.ts` を single source of truth として使う
- `lib/queries.ts` と `lib/supabase.ts` は将来の DB 接続用。現在は未使用
