# STATUS.md — プロジェクト現状レポート

最終更新: 2026-03-16 19:00 JST

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

### 実装済みページ (13ページ / 550静的ルート)

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

## クローラー / スクレイピング

### 2系統のパイプライン

#### 1. akiya_hunter_v1.js (メイン)

```
sources.json (80ソース定義)
  ↓
akiya_hunter_v1.js (Node.js)
  ↓ collect → extract → normalize → dedupe → notify → save
data/akiya_hunter_v1.sqlite (SQLite DB, 535件)
  ↓
export-from-db.py (Python)
  ↓
src/data/listings-live.json (535件)
```

- 実行: `node saiyasu-crawler-src/akiya_hunter_v1.js`
- エクスポート: `python3 scripts/export-from-db.py`

#### 2. scrape-pipeline.js (OpenClaw 追加)

```
scripts/scrape-pipeline.js
  ↓ best-effort scraping (fetch + Playwright browser)
  ↓ semantic extraction
data/akiya_hunter_v1.sqlite に投入
```

- 実行: `npm run scrape:pipeline`
- Playwright 経由で Browser scraping 対応
- **ただし現環境では Playwright の共有ライブラリ不足 (libnspr4.so) で Browser 起動が失敗**

### ソース設定 (80ソース)

| カテゴリ | ソース数 | 状態 |
|---|---|---|
| **0円物件 (zero.estate 47県)** | 47 | web_fetch 稼働中 |
| **自治体空き家バンク** | 10 | web_fetch 稼働中 |
| **全国ポータル** | 7 | 一部稼働 (ieichiba, inakanet, jmty) |
| **賃貸サイト** | 12 | web_fetch 一部稼働 / Browser待ち |
| **協会系 (ハトマーク/ラビーネット)** | 3 | Browser待ち |
| **その他 (disabled)** | 1 | DNS解決不可 (akiya_gateway) |

---

## OpenClaw 最新活動 (2026-03-16 時点)

### 今回 OpenClaw がやったこと

- `scripts/scrape-pipeline.js` — best-effort scraping pipeline を作成
- `scripts/run-semantic-scrape-today.js` — 意味抽出スクレイプ実験スクリプト
- Playwright 導入 (Chromium browser binary)
- `npm run scrape:pipeline` / `npm run export:listings` コマンド追加
- GitHub に push 済み (`c3f765d`, `21dd3ef`)

### OpenClaw 側の直近スクレイプ結果

| ソース | 件数 | 状態 |
|---|---|---|
| jmty_realestate | 30 | 取得成功 |
| inakanet | 25 | 取得成功 |
| suumo_rent | 0 | **Browser 起動失敗** (libnspr4.so 不足) |
| homes_rent | 0 | **Browser 起動失敗** |
| athome_rent | 0 | **Browser 起動失敗** |
| inakagurashi | 0 | **DNS解決失敗** |

### OpenClaw cron ジョブ (全9ジョブ, 全有効)

| ジョブ | スケジュール | 最終実行 | 状態 |
|---|---|---|---|
| 賃貸ポータル巡回 | 毎日 06:00 JST | 2026-03-16 | OK |
| 空き家バンク+全国ポータル | 毎日 08:00 JST | 2026-03-16 | OK (415秒) |
| 全国ポータル2巡目 | 毎日 20:00 JST | 待機中 | — |
| エクスポート+git push | 毎日 21:00 JST | 待機中 | — |
| 補助金チェック (週次) | 月曜 09:00 JST | 2026-03-16 | OK |
| 新ソース発見 (週次) | 日曜 03:00 JST | 待機中 | — |
| 年度補助金チェック (3-4月) | 毎日 09:30 JST | 2026-03-16 | OK |
| Akiya Hunter v1 (workspace版) | 毎日 08:00/20:00 JST | 2026-03-16 | OK |
| Discord 通知 | 毎日 08:00/20:00 JST | 2026-03-16 | **エラー** (連続5回) |

### OpenClaw のブロッカー

| 問題 | 影響 | 対策 |
|---|---|---|
| **Playwright 共有ライブラリ不足** | SUUMO/HOMES/athome が取得できない | `sudo apt install libnspr4 libnss3 libatk1.0-0` 等を実行 |
| **Discord 通知エラー** | 新着物件の通知が飛ばない | delivery 設定を `discord` → 正しいチャンネル形式に修正 |
| **inakagurashi DNS 失敗** | 田舎暮らし情報館が取得できない | URLを `https://www.inakagurashi.jp/` で再確認 |
| **workspace側が旧設定 (11ソース)** | 80ソース設定と未同期 | saiyasu 側のクローラーを正とし、workspace 側は補助のみ |

---

## Claude Code 側の直近実行結果

| 実行 | ソース数 | 候補URL | 抽出 | accepted | DB件数 |
|---|---|---|---|---|---|
| 2026-03-16 08:38 UTC | 59 | 785 | 702 | 688 | 535 |
| 2026-03-16 07:51 UTC | 56 | 739 | 703 | 687 | 460 |
| 2026-03-16 07:26 UTC | 55 | 709 | 703 | 79 | — |
| 2026-03-16 06:55 UTC (初回) | 55 | 709 | 701 | 30 | — |

フィルタ緩和により 30 → 688 まで改善した。

---

## 技術スタック

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js | 16 (App Router, Turbopack) | Webフレームワーク |
| TypeScript | 5 | 型安全 |
| Tailwind CSS | v4 | スタイリング |
| React | 19 | UI |
| SQLite | — | クローラーDB |
| Playwright | — | Browser scraping (OpenClaw 追加) |
| Supabase | — | 将来のDB接続 |
| OpenClaw | gpt-5.4 | スクレイピング自動化 |
| Vercel | — | ホスティング (予定) |

---

## プロジェクト構成

```
saiyasu-inakagurashi/
├── src/app/               13ページ (Next.js App Router)
├── src/components/        6コンポーネント
├── src/data/              listings-live.json (535件) + dummy + masters
├── src/lib/               filters, sort, format, supabase, queries
├── src/types/             Listing, Subsidy
├── saiyasu-crawler-src/   クローラーパイプライン (akiya_hunter_v1.js)
├── saiyasu-crawler-config/ sources.json (80ソース)
├── scripts/
│   ├── export-from-db.py         DB → JSON エクスポート
│   ├── crawl-and-deploy.sh       クロール+エクスポート+git push 自動化
│   ├── scrape-pipeline.js        best-effort scraping (OpenClaw作成)
│   ├── run-semantic-scrape-today.js  意味抽出実験 (OpenClaw作成)
│   ├── export-listings.js        Node.js版エクスポート
│   └── import-to-supabase.js     Supabase投入
├── specs/                 AI間仕様書
├── docs/
│   ├── openclaw-scraping-orders.md   OpenClaw への全ソース指示書
│   └── openclaw-current-report.md    OpenClaw 最新活動レポート
├── data/                  SQLite DB, 実行ログ (gitignore)
├── CLAUDE.md              Builder AI 指示書
├── CONTRIBUTING.md        開発者向けガイド
├── README.md              ユーザー向け説明
├── README_FOR_FULLER.md   フロントマン向け詳細ガイド
└── STATUS.md              このファイル
```

---

## 主要コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# クローラー実行 (akiya_hunter_v1)
node saiyasu-crawler-src/akiya_hunter_v1.js

# best-effort scraping (OpenClaw版)
npm run scrape:pipeline

# DB → listings-live.json エクスポート
python3 scripts/export-from-db.py

# DB件数確認
python3 -c "import sqlite3; db=sqlite3.connect('data/akiya_hunter_v1.sqlite'); print(db.execute('SELECT COUNT(*) FROM properties').fetchone()[0])"

# クロール+エクスポート+git push 一括
./scripts/crawl-and-deploy.sh
```

---

## 次にやること

### 優先度: 最高
1. **Playwright 環境を修復** — `libnspr4.so` 等の不足ライブラリをインストールし、SUUMO/HOMES/athome を取得可能にする
2. **Browser必須サイト5つの取得** — SUUMO賃貸, HOMES賃貸, athome賃貸, ハトマーク, ラビーネット (月6万以下)
3. **Discord 通知の修復** — delivery channel 設定の修正

### 優先度: 高
4. **Vercel デプロイ** — 公開URL取得
5. **cron の安定稼働確認** — 21:00 の自動 export+push が正しく動くか検証
6. **fetch系ソースの精度向上** — jmty/inakanet の抽出精度改善

### 優先度: 中
7. **都道府県別ページ** — /prefecture/[slug] (SEOランディング47ページ)
8. **SEO基盤** — metadata, sitemap.xml, 構造化データ
9. **Supabase 接続** — 静的JSONからDB読み込みに切り替え
10. **DB品質改善** — 住所誤抽出, 価格誤判定, 0円判定の誤爆を修正

### 優先度: 低
11. **補助金データ拡充** — 現在6件 → 500件目標
12. **ガイド記事コンテンツ** — /guide 以下
13. **相談フォームのバックエンド** — 送信機能実装
