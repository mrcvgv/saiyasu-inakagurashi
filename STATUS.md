# STATUS.md — プロジェクト現状レポート

最終更新: 2026-03-16

---

## サイト概要

**掘り出し物件ラボ (saiyasu-inakagurashi)**
日本全国の格安物件・空き家・賃貸を横断検索できる公開Webサイト

---

## データ現況

| 指標 | 数値 |
|---|---|
| **掲載物件数** | **535件** |
| **稼働ソース数** | **10** |
| **設定済みソース** | **80 (78有効)** |
| **対応都道府県** | **44** |
| **画像あり物件** | **527件 (98%)** |
| **売買物件** | 285件 |
| **0円(無償譲渡)物件** | 199件 |
| **賃貸物件** | 51件 |

### ソース別内訳

| ソース | 件数 | 種別 | 状態 |
|---|---|---|---|
| zero_estate (ゼロ円不動産) | 379 | 売買/0円 | 稼働中 |
| jmty_realestate (ジモティー) | 50 | 賃貸/売買 | 稼働中 |
| ieichiba (家いちば) | 29 | 売買 | 稼働中 |
| inakanet (田舎ねっと) | 25 | 売買 | 稼働中 |
| yamakita_akiya (山北町空き家バンク) | 20 | 空き家 | 稼働中 |
| kamogawa_akiya (鴨川市空き家バンク) | 16 | 空き家 | 稼働中 |
| sakuho_akiya (佐久穂町空き家バンク) | 7 | 空き家 | 稼働中 |
| tokigawa_akiya (ときがわ町空き家バンク) | 5 | 空き家 | 稼働中 |
| hanno_akiya (飯能市空き家バンク) | 3 | 空き家 | 稼働中 |
| saihoku (最北空き家バンク) | 1 | 空き家 | 稼働中 |

---

## サイト機能

### 実装済みページ (13ページ)

| ページ | パス | 状態 |
|---|---|---|
| トップ | `/` | 稼働中 |
| 検索 | `/search` | 稼働中 (ソート対応) |
| 物件一覧 | `/listings` | 稼働中 (ソート+成約済みフィルタ) |
| 物件詳細 | `/listings/[id]` | 稼働中 (535件分の静的ページ) |
| 激安特集 | `/cheap` | 稼働中 |
| 格安土地 | `/cheap-land` | 稼働中 |
| 空き家 | `/akiya` | 稼働中 |
| 格安賃貸 | `/cheap-rent` | 稼働中 |
| 競売・公売 | `/auction` | 稼働中 |
| 事業用 | `/business` | 稼働中 |
| 補助金 | `/subsidy` | 稼働中 |
| 移住ガイド | `/guide` | 稼働中 |
| 無料相談 | `/consult` | 稼働中 |

### 実装済み機能

- ソート: 価格順(安い/高い) / 土地広い順 / 建物広い順 / 新着順
- 成約済みフィルタ: チェックボックスで除外
- 成約済みバッジ: カード+詳細ページに赤ラベル表示
- 物件タイプバッジ: 0円=オレンジ / 賃貸=青
- 物件画像: 実画像を表示 (527/535件)
- モバイルメニュー: ハンバーガーメニュー
- 検索: キーワード / 都道府県 / 価格帯

---

## クローラー (OpenClaw / akiya_hunter_v1)

### アーキテクチャ

```
sources.json (80ソース定義)
  ↓
akiya_hunter_v1.js (Node.js パイプライン)
  ↓ collect → extract → normalize → dedupe → notify → save
data/akiya_hunter_v1.sqlite (SQLite DB)
  ↓
export-from-db.py (Python エクスポート)
  ↓
src/data/listings-live.json (Next.js が読むデータ)
```

### ソース設定 (80ソース)

| カテゴリ | ソース数 | 状態 |
|---|---|---|
| **0円物件 (zero.estate 47県)** | 47 | web_fetch 稼働中 |
| **自治体空き家バンク** | 10 | web_fetch 稼働中 |
| **全国ポータル** | 7 | 一部稼働 (ieichiba, inakanet, jmty) |
| **賃貸サイト** | 12 | web_fetch 一部稼働 / Browser待ち |
| **協会系** | 3 | Browser待ち |
| **その他 (disabled)** | 1 | DNS解決不可 |

### Browser tool 必須 (OpenClaw 待ち)

以下はJS レンダリング必須で、OpenClaw の Browser tool でのみ取得可能:

| サイト | URL | フィルタ |
|---|---|---|
| SUUMO 賃貸 | suumo.jp/chintai/ | 月6万以下 |
| LIFULL HOME'S 賃貸 | homes.co.jp/chintai/ | 月6万以下 |
| athome 賃貸 | athome.co.jp/chintai/ | 月6万以下 |
| ハトマークサイト | hatomarksite.com | 賃貸6万以下 |
| ラビーネット (ウサギマーク) | rabbynet.zennichi.or.jp | 賃貸6万以下 |

### cron スケジュール (設定済み・要有効化)

| ジョブ | 時刻 | 頻度 |
|---|---|---|
| 賃貸ポータル巡回 | 06:00 | 毎日 |
| 空き家バンク+全国ポータル | 08:00 | 毎日 |
| 全国ポータル2巡目 | 20:00 | 毎日 |
| エクスポート+git push | 21:00 | 毎日 |
| 補助金チェック | 09:00 月曜 | 週1 |
| 新ソース発見 | 03:00 日曜 | 週1 |

---

## 技術スタック

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js | 16 (App Router, Turbopack) | Webフレームワーク |
| TypeScript | 5 | 型安全 |
| Tailwind CSS | v4 | スタイリング |
| React | 19 | UI |
| SQLite | — | クローラーDB |
| Supabase | — | 将来のDB接続 |
| OpenClaw | gpt-5.4 | スクレイピング自動化 |
| Vercel | — | ホスティング (予定) |

---

## プロジェクト構成

```
saiyasu-inakagurashi/
├── src/app/          13ページ (Next.js App Router)
├── src/components/   6コンポーネント (Header, Footer, ListingCard, SearchForm, SectionTitle, ListingControls)
├── src/data/         データ層 (listings-live.json 535件, dummy, prefectures, regions, subsidies)
├── src/lib/          ユーティリティ (filters, sort, format, supabase, queries)
├── src/types/        型定義 (Listing, Subsidy)
├── saiyasu-crawler-src/    クローラーパイプライン (Node.js)
├── saiyasu-crawler-config/ ソース定義 (80ソース)
├── scripts/          export-from-db.py, crawl-and-deploy.sh 等
├── specs/            AI間仕様書 (SAIYASU_SPEC, PAGE_MAP, UI_REQUIREMENTS 等)
├── data/             SQLite DB, 実行ログ (gitignore)
├── CLAUDE.md         Builder AI 指示書
├── CONTRIBUTING.md   開発者向けガイド
├── README.md         ユーザー向け説明
└── README_FOR_FULLER.md  フロントマン向け詳細ガイド
```

---

## 関連プロジェクト

| プロジェクト | パス | 役割 |
|---|---|---|
| saiyasu-inakagurashi | /home/koheisato/saiyasu-inakagurashi/ | 公開Webサイト (このリポジトリ) |
| akiya-hunter | /home/koheisato/akiya-hunter/ | 物件収集の分離先 (予定) |
| shared-ai | /home/koheisato/shared-ai/ | プロジェクト間仕様共有 |
| peakful | /home/koheisato/peakful/ | 100サービス量産基盤 |
| OpenClaw workspace | ~/.openclaw/workspace/ | スクレイピング自動化エージェント |

---

## 次にやること

### 優先度: 高
1. **OpenClaw で Browser tool ソースを取得** — SUUMO/HOMES/athome/ハトマーク/ラビーネット
2. **Vercel デプロイ** — 公開URL取得
3. **cron 有効化** — 毎日自動クロール+エクスポート+push

### 優先度: 中
4. **都道府県別ページ** — /prefecture/[slug] (SEOランディング47ページ)
5. **SEO基盤** — metadata, sitemap.xml, 構造化データ
6. **Supabase 接続** — 静的JSONからDB読み込みに切り替え

### 優先度: 低
7. **補助金データ拡充** — 現在6件 → 500件目標
8. **ガイド記事コンテンツ** — /guide 以下
9. **相談フォームのバックエンド** — 送信機能実装
