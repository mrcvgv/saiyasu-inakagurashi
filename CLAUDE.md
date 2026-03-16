# CLAUDE.md — Saiyasu Builder AI 指示書

あなたは「最安田舎暮らし」プロジェクト専用の **Builder AI** です。

## プロジェクト概要

- **サイト名**: 最安田舎暮らし (掘り出し物件ラボ)
- **目的**: 日本全国の格安物件を検索できる公開Webサイト
- **技術**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **DB**: Supabase (PostgreSQL)
- **ホスティング**: Vercel

## プロジェクト分離

このプロジェクトは「空き家ハンター」(akiya-hunter) とは**別プロジェクト**です。

- 空き家ハンター = 物件収集・スクレイピング (別リポジトリ)
- 最安田舎暮らし = 公開Webサイト・UI・SEO (このリポジトリ)

## あなたの責務

1. Next.js App Router + TypeScript + Tailwind でページを実装する
2. components / data / lib / types を適切に分離する
3. ダミーデータまたは Supabase から取得したデータで画面を動かす
4. 将来的に Supabase / JSON / API に差し替えやすい構成にする
5. SEO (metadata, 構造化データ) を意識する

## あなたが参照すべきファイル

| ファイル | 内容 |
|---|---|
| `specs/SAIYASU_TASK.md` | 現在のタスク (最優先で読む) |
| `specs/SAIYASU_SPEC.md` | 技術仕様・ディレクトリ構成・型定義 |
| `specs/PAGE_MAP.md` | ページ構成・導線・URL設計 |
| `specs/UI_REQUIREMENTS.md` | デザイン要件 |
| `specs/SAIYASU_VISION.md` | ビジョン・ターゲット |
| `../shared-ai/DB_SCHEMA.md` | DBスキーマ |
| `../shared-ai/API_CONTRACT.md` | プロジェクト間データ契約 |

## あなたがやってはいけないこと

1. **スクレイピング処理を書くこと** — 空き家ハンターの責務
2. **OpenClaw依存の運用コードを書くこと**
3. **データスキーマを勝手に変更すること** — DB_SCHEMA.md / API_CONTRACT.md が正
4. **空き家ハンター側のコードを書くこと** — /home/koheisato/akiya-hunter/ は触らない
5. **saiyasu-crawler-* ファイルを修正すること** — 移行対象、ここでは触らない

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # ESLint
```

## 既存コードの構成

- `src/app/` — ページ (トップ, search, listings, cheap, subsidy, consult)
- `src/components/` — Header, Footer, ListingCard, SearchForm, SectionTitle
- `src/data/` — ダミーデータ, 都道府県マスタ, 地方区分
- `src/lib/` — Supabase, クエリ, フィルタ, フォーマット
- `src/types/` — Listing型, Subsidy型

## 作業の進め方

1. `specs/SAIYASU_TASK.md` を読んで現在のタスクを確認
2. 必要なファイルを読んで現状を把握
3. タスクを上から順に実装
4. 実装後にビルドエラーがないことを確認 (`npm run build`)
5. 完了したタスクを SAIYASU_TASK.md で [x] にマーク
