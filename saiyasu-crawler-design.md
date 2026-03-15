# Akiya Hunter v1 設計書

## 1. 概要

Akiya Hunter v1 は、**埼玉・千葉・長野・神奈川・東京**を対象に、**100万円以下の空き家**を定期巡回し、**新着・値下げ・更新**を検知して **Discord に通知**する自動探索システムである。

v1 では条件を意図的に絞り、まずは以下の4条件のみを厳格に満たす物件を収集対象とする。

- 対象都県内であること
- 価格が100万円以下であること
- 空き家であること
- 建物付きであること

広さ、駅距離、築年、山間部かどうかなどのスコアリングは v1 では行わない。

---

## 2. 目的

### 2.1 ビジネス目的

手作業では追跡が難しい空き家物件の新着・更新・値下げを自動で発見し、見逃しを減らす。

### 2.2 システム目的

- 条件に合う物件を自動収集する
- 構造化データへ変換する
- 重複や既知物件を判定する
- 差分イベントのみ Discord に通知する
- 履歴を SQLite / CSV に保存する

---

## 3. スコープ

## 3.1 対象エリア

- 埼玉県
- 千葉県
- 長野県
- 神奈川県
- 東京都

## 3.2 対象物件条件

- 種別: 空き家
- 価格: 1,000,000円以下
- 広さ: 不問

## 3.3 優先しない条件

- 駅距離
- 築年
- 土地面積
- 間取り
- 山間部判定
- リフォーム必要度のスコア化

## 3.4 除外対象

- 土地のみ
- 成約済み
- 価格不明
- 対象都県外
- 100万円超

---

## 4. システム全体構成

```text
[Scheduler]
  ↓
[akiya_hunter_v1]
  ↓
[collect_listing_urls]
  ↓
[extract_property_details]
  ↓
[normalize_and_filter]
  ↓
[dedupe_against_history]
  ↓
[send_discord_notification]
  ↓
[save_history]
```

---

## 5. 実行スケジュール

### 5.1 実行頻度

- 毎日 08:00
- 毎日 20:00

### 5.2 理由

空き家物件は高頻度更新されるカテゴリではないため、1日2回で十分なカバレッジを確保できる。

### 5.3 OpenClaw での想定

- cron により 1日2回起動
- 親ワークフロー `akiya_hunter_v1` を実行

---

## 6. モジュール責務定義

## 6.1 親ワークフロー

### `akiya_hunter_v1`

責務:
- 実行全体のオーケストレーション
- 各モジュールへの入力受け渡し
- ログ集約
- 最終成否判定

入力:
- 対象都県一覧
- 最大価格
- 実行時刻
- 通知先設定
- DB パス

出力:
- 実行サマリ
- 検知イベント一覧
- 保存件数
- エラー件数

---

## 6.2 子モジュール

### 6.2.1 `collect_listing_urls`

責務:
- 各ソースを巡回し、候補物件 URL 一覧を収集する
- この時点では厳密判定をしない
- 「空き家らしい候補」を広めに拾う

主な入力:
- prefectures
- max_price
- source_configs
- discovered_after (任意)

主な出力:
- 候補一覧配列

### 6.2.2 `extract_property_details`

責務:
- 候補 URL ごとの詳細ページを取得
- 必要項目を構造化 JSON に変換
- 取得失敗や欠損を明示的に残す

主な入力:
- candidate listing URL 一覧

主な出力:
- 物件詳細 JSON 一覧

### 6.2.3 `normalize_and_filter`

責務:
- 表記揺れを統一する
- 価格や地域を正規化する
- 条件適合判定を行う
- 除外理由を付与する

主な入力:
- 物件詳細 JSON 一覧
- prefectures
- max_price
- require_akiya
- require_building

主な出力:
- accepted_properties
- rejected_properties

### 6.2.4 `dedupe_against_history`

責務:
- 履歴 DB と比較し同一物件を判定
- new / price_down / updated / known を分類
- 通知対象イベントを抽出

主な入力:
- accepted_properties
- sqlite db path

主な出力:
- classified_events

### 6.2.5 `send_discord_notification`

責務:
- 通知対象イベントを Discord へ送る
- メッセージテンプレートに従って整形
- 通知成功時刻を返す

主な入力:
- events
- discord webhook / channel config

主な出力:
- sent_notifications
- failed_notifications

### 6.2.6 `save_history`

責務:
- 最新物件情報を SQLite に保存
- 必要に応じて CSV バックアップを出力
- first_seen / last_seen / last_notified を更新

主な入力:
- all normalized properties
- classified events
- notification result

主な出力:
- upsert 結果
- CSV 出力結果

---

## 7. ソース戦略

## 7.1 優先対象

1. 自治体の空き家バンク
2. 自治体提携の空き家ポータル
3. 空き家系ポータル
4. ジモティー系
5. 一般不動産サイト（補助）

## 7.2 方針

v1 では、まず **「空き家であることが明示されやすいソース」** を優先する。
理由は、一般不動産ポータルよりもフィルタ精度が高く、初期運用でノイズが少ないためである。

## 7.3 ソース設定データ例

```json
[
  {
    "source_name": "nagano_akiya_bank",
    "source_type": "municipal_bank",
    "enabled": true,
    "prefecture": "長野県",
    "base_url": "https://example.com/nagano",
    "listing_strategy": "html_list",
    "detail_strategy": "html_detail"
  },
  {
    "source_name": "kanagawa_akiya_portal",
    "source_type": "portal",
    "enabled": true,
    "prefecture": "神奈川県",
    "base_url": "https://example.com/kanagawa",
    "listing_strategy": "rss_or_html",
    "detail_strategy": "html_detail"
  }
]
```

---

## 8. データモデル

## 8.1 物件詳細 JSON スキーマ

```json
{
  "url": "https://example.com/item/123",
  "source": "akiya_bank",
  "title": "空き家バンク登録物件",
  "price_yen": 800000,
  "price_raw": "80万円",
  "prefecture": "長野県",
  "city": "上田市",
  "address_raw": "長野県上田市...",
  "is_akiya": true,
  "has_building": true,
  "layout": "4DK",
  "building_area_sqm": 82.4,
  "land_area_sqm": null,
  "building_age": 45,
  "notes": "要修繕",
  "contact": "上田市空き家バンク",
  "image_urls": [],
  "inquiry_code": null,
  "status_text": "掲載中",
  "scraped_at": "2026-03-14T20:00:00+09:00"
}
```

## 8.2 候補 URL 収集 JSON

```json
{
  "source_name": "nagano_akiya_bank",
  "listing_url": "https://example.com/item/123",
  "title": "上田市 空き家バンク登録物件",
  "price_raw": "80万円",
  "location_raw": "長野県上田市",
  "discovered_at": "2026-03-14T08:00:00+09:00"
}
```

## 8.3 正規化後の内部標準 JSON

```json
{
  "canonical_id": null,
  "url": "https://example.com/item/123",
  "source": "nagano_akiya_bank",
  "title": "空き家バンク登録物件",
  "prefecture": "長野県",
  "city": "上田市",
  "address_raw": "長野県上田市...",
  "price_yen": 800000,
  "is_akiya": true,
  "has_building": true,
  "layout": "4DK",
  "building_area_sqm": 82.4,
  "land_area_sqm": null,
  "building_age": 45,
  "notes": "要修繕",
  "contact": "上田市空き家バンク",
  "image_urls": [],
  "inquiry_code": null,
  "status_text": "掲載中",
  "exclude_reason": null,
  "hash_signature": "sha256:...",
  "scraped_at": "2026-03-14T20:00:00+09:00"
}
```

---

## 9. 入出力仕様

## 9.1 `collect_listing_urls` 入出力

### Input

```json
{
  "prefectures": ["埼玉県", "千葉県", "長野県", "神奈川県", "東京都"],
  "max_price": 1000000,
  "source_configs": [],
  "run_at": "2026-03-14T08:00:00+09:00"
}
```

### Output

```json
{
  "candidates": [
    {
      "source_name": "nagano_akiya_bank",
      "listing_url": "https://example.com/item/123",
      "title": "空き家バンク登録物件",
      "price_raw": "80万円",
      "location_raw": "長野県上田市",
      "discovered_at": "2026-03-14T08:00:00+09:00"
    }
  ],
  "errors": []
}
```

## 9.2 `extract_property_details` 入出力

### Input

```json
{
  "candidates": [
    {
      "source_name": "nagano_akiya_bank",
      "listing_url": "https://example.com/item/123"
    }
  ]
}
```

### Output

```json
{
  "properties": [
    {
      "url": "https://example.com/item/123",
      "source": "nagano_akiya_bank",
      "title": "空き家バンク登録物件",
      "price_yen": 800000,
      "price_raw": "80万円",
      "prefecture": "長野県",
      "city": "上田市",
      "address_raw": "長野県上田市...",
      "is_akiya": true,
      "has_building": true,
      "layout": "4DK",
      "building_area_sqm": 82.4,
      "land_area_sqm": null,
      "building_age": 45,
      "notes": "要修繕",
      "contact": "上田市空き家バンク",
      "image_urls": [],
      "inquiry_code": null,
      "status_text": "掲載中",
      "scraped_at": "2026-03-14T08:05:00+09:00"
    }
  ],
  "errors": []
}
```

## 9.3 `normalize_and_filter` 入出力

### Input

```json
{
  "properties": [],
  "prefectures": ["埼玉県", "千葉県", "長野県", "神奈川県", "東京都"],
  "max_price": 1000000,
  "require_akiya": true,
  "require_building": true
}
```

### Output

```json
{
  "accepted_properties": [
    {
      "url": "https://example.com/item/123",
      "source": "nagano_akiya_bank",
      "title": "空き家バンク登録物件",
      "prefecture": "長野県",
      "city": "上田市",
      "address_raw": "長野県上田市...",
      "price_yen": 800000,
      "is_akiya": true,
      "has_building": true,
      "layout": "4DK",
      "building_area_sqm": 82.4,
      "land_area_sqm": null,
      "building_age": 45,
      "notes": "要修繕",
      "contact": "上田市空き家バンク",
      "image_urls": [],
      "inquiry_code": null,
      "status_text": "掲載中",
      "exclude_reason": null,
      "hash_signature": "sha256:...",
      "scraped_at": "2026-03-14T08:05:00+09:00"
    }
  ],
  "rejected_properties": [
    {
      "url": "https://example.com/item/999",
      "exclude_reason": "price_over_limit"
    }
  ]
}
```

## 9.4 `dedupe_against_history` 入出力

### Input

```json
{
  "accepted_properties": [],
  "db_path": "./data/akiya_hunter_v1.sqlite"
}
```

### Output

```json
{
  "events": [
    {
      "event_type": "new",
      "property": {
        "url": "https://example.com/item/123",
        "title": "空き家バンク登録物件",
        "prefecture": "長野県",
        "city": "上田市",
        "price_yen": 800000
      },
      "changes": {}
    }
  ]
}
```

## 9.5 `send_discord_notification` 入出力

### Input

```json
{
  "events": [],
  "discord": {
    "webhook_url": "https://discord.com/api/webhooks/..."
  }
}
```

### Output

```json
{
  "sent_notifications": [
    {
      "event_type": "new",
      "url": "https://example.com/item/123",
      "sent_at": "2026-03-14T08:06:00+09:00"
    }
  ],
  "failed_notifications": []
}
```

## 9.6 `save_history` 入出力

### Input

```json
{
  "properties": [],
  "events": [],
  "notification_result": {
    "sent_notifications": [],
    "failed_notifications": []
  },
  "db_path": "./data/akiya_hunter_v1.sqlite",
  "csv_path": "./data/exports/properties_latest.csv"
}
```

### Output

```json
{
  "upserted": 12,
  "csv_written": true,
  "db_path": "./data/akiya_hunter_v1.sqlite"
}
```

---

## 10. 正規化ルール

## 10.1 価格正規化

以下のような表記を整数円に変換する。

- `80万円` → `800000`
- `100万` → `1000000`
- `1,000,000円` → `1000000`
- `応相談` → `null`
- `価格未定` → `null`

## 10.2 地域正規化

以下を正式都県名へ統一する。

- `東京` → `東京都`
- `神奈川` → `神奈川県`
- `千葉` → `千葉県`
- `埼玉` → `埼玉県`
- `長野` → `長野県`

## 10.3 空き家表記統一

以下の文言を `is_akiya=true` 判定候補とする。

- 空き家
- 空家
- 空き家バンク
- 空家バンク
- 住宅付き空き地（文脈確認）
- 未使用住宅（文脈確認）

## 10.4 建物有無判定

`has_building=true` の候補例:
- 建物面積記載あり
- 間取り記載あり
- 写真に住宅建物あり
- 「中古戸建」「住宅」「家屋あり」等の文言あり

`has_building=false` の候補例:
- 更地
- 土地のみ
- 古家解体予定
- 建物なし

---

## 11. フィルタ条件

通過条件:

- `prefecture` が対象都県に含まれる
- `price_yen <= 1000000`
- `is_akiya == true` または空き家系文言あり
- `has_building == true`
- `status_text` が成約済み等でない

除外理由コード:

- `out_of_area`
- `price_unknown`
- `price_over_limit`
- `not_akiya`
- `land_only`
- `contracted`
- `missing_required_fields`

---

## 12. 重複判定仕様

同一物件判定は以下の優先順位で行う。

1. URL一致
2. 問い合わせ番号一致
3. タイトル + 市区町村 + 価格近似
4. 住所 + 価格一致

## 12.1 イベント分類

- `new`: 既存履歴に存在しない
- `price_down`: 既存より価格が下がった
- `updated`: 価格以外の重要項目が変化
- `known`: 既知かつ差分なし

## 12.2 updated 判定対象フィールド

以下が変わった場合は `updated` とする。

- notes
- image_urls 数
- layout
- building_area_sqm
- land_area_sqm
- contact
- status_text

### 例外

- scraped_at のみ変化 → `known`
- whitespace 差分のみ → `known`

---

## 13. Discord 通知仕様

## 13.1 通知対象

- `new`
- `price_down`
- `updated`

`known` は通知しない。

## 13.2 通知タイミング

- new: 即通知
- price_down: 即通知
- updated: 即通知

## 13.3 通知テンプレート

### 新着通知

```text
【新着空き家】
エリア: {prefecture} {city}
価格: {price_label}
種別: 空き家
間取り: {layout_or_unknown}
建物面積: {building_area_label}
土地面積: {land_area_label}
築年: {building_age_label}
備考: {notes_or_none}

URL:
{url}
```

### 値下げ通知

```text
【値下げ空き家】
エリア: {prefecture} {city}
価格: {old_price_label} → {new_price_label}
種別: 空き家
備考: {notes_or_none}

URL:
{url}
```

### 更新通知

```text
【更新空き家】
エリア: {prefecture} {city}
価格: {price_label}
更新内容: {change_summary}

URL:
{url}
```

## 13.4 change_summary 生成例

- `備考欄変更`
- `写真追加`
- `間取り更新`
- `面積情報更新`

---

## 14. SQLite スキーマ

```sql
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  inquiry_code TEXT,
  title TEXT,
  prefecture TEXT,
  city TEXT,
  address_raw TEXT,
  price_yen INTEGER,
  price_raw TEXT,
  is_akiya INTEGER NOT NULL DEFAULT 0,
  has_building INTEGER NOT NULL DEFAULT 0,
  layout TEXT,
  building_area_sqm REAL,
  land_area_sqm REAL,
  building_age INTEGER,
  notes TEXT,
  contact TEXT,
  status_text TEXT,
  image_urls_json TEXT,
  event_type TEXT,
  hash_signature TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  last_notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_url
  ON properties(url);

CREATE INDEX IF NOT EXISTS idx_properties_prefecture_price
  ON properties(prefecture, price_yen);

CREATE INDEX IF NOT EXISTS idx_properties_last_seen_at
  ON properties(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_properties_hash_signature
  ON properties(hash_signature);
```

---

## 15. CSV バックアップ仕様

### 出力ファイル例

- `./data/exports/properties_latest.csv`
- `./data/exports/properties_2026-03-14_0800.csv`

### カラム例

- url
- source
- title
- prefecture
- city
- address_raw
- price_yen
- is_akiya
- has_building
- layout
- building_area_sqm
- land_area_sqm
- building_age
- notes
- contact
- event_type
- first_seen_at
- last_seen_at
- last_notified_at
- hash_signature

---

## 16. エラー処理方針

## 16.1 ソース収集中の失敗

- 単一ソース失敗で全体停止しない
- `errors` 配列に記録して継続
- 実行サマリに失敗ソース名を残す

## 16.2 詳細取得失敗

- 対象 URL をスキップ
- 失敗 URL をログへ記録
- 一定回数までは再試行可

## 16.3 通知失敗

- DB 保存は継続する
- `last_notified_at` は成功時のみ更新
- 次回再通知戦略は v1 では未実装でも可

## 16.4 データ欠損

- 必須項目不足は reject
- reject 理由を記録する

---

## 17. ログ設計

各 run ごとに以下を出力する。

- run_id
- started_at
- finished_at
- scanned_sources_count
- discovered_candidates_count
- extracted_properties_count
- accepted_count
- rejected_count
- new_count
- price_down_count
- updated_count
- known_count
- notified_count
- error_count

実行サマリ JSON 例:

```json
{
  "run_id": "2026-03-14T08:00:00+09:00",
  "started_at": "2026-03-14T08:00:00+09:00",
  "finished_at": "2026-03-14T08:07:31+09:00",
  "scanned_sources_count": 8,
  "discovered_candidates_count": 31,
  "extracted_properties_count": 26,
  "accepted_count": 9,
  "rejected_count": 17,
  "new_count": 2,
  "price_down_count": 1,
  "updated_count": 1,
  "known_count": 5,
  "notified_count": 4,
  "error_count": 2
}
```

---

## 18. OpenClaw 実装責務

## 18.1 OpenClaw で持つ責務

- 定期起動
- ワークフロー順次実行
- 通知送信
- ログ保存
- 将来的なソース追加の運用基盤

## 18.2 エージェント責務分離

### Agent: Source Collector
- 一覧ページ巡回
- 候補 URL 収集

### Agent: Detail Extractor
- 詳細ページ解析
- 構造化 JSON 出力

### Agent: Filter / Normalizer
- 価格・地域・空き家判定
- reject reason 付与

### Agent: Dedupe / Comparator
- DB 比較
- イベント分類

### Agent: Notifier
- Discord メッセージ整形
- 通知送信

### Agent: Persistence
- SQLite upsert
- CSV 書き出し

---

## 19. 実装順タスクリスト

### Phase 1: 基盤

1. プロジェクトディレクトリ作成
2. SQLite ファイル配置
3. DB schema 作成
4. 設定ファイル定義（対象都県、価格上限、通知先、ソース設定）

### Phase 2: データ収集

5. `collect_listing_urls` 実装
6. 自治体系ソースを1〜2件接続
7. 候補 URL JSON 出力確認

### Phase 3: 詳細抽出

8. `extract_property_details` 実装
9. 詳細ページの HTML パーサ作成
10. サンプル物件で抽出精度確認

### Phase 4: 判定ロジック

11. `normalize_and_filter` 実装
12. 価格正規化実装
13. 都県正規化実装
14. 空き家 / 建物あり判定実装
15. reject reason 実装

### Phase 5: 差分検知

16. `dedupe_against_history` 実装
17. URL / inquiry_code / 住所ベースの重複判定実装
18. new / price_down / updated / known 分類実装

### Phase 6: 通知

19. `send_discord_notification` 実装
20. 通知テンプレート組み込み
21. Discord 送信テスト

### Phase 7: 保存と運用

22. `save_history` 実装
23. CSV バックアップ実装
24. スケジューラ登録（08:00 / 20:00）
25. 実運用ログ確認

---

## 20. v1 完成条件

以下を満たせば v1 完了とする。

- 5都県の少なくとも一部ソースを巡回できる
- 100万円以下の空き家を抽出できる
- SQLite に履歴保存できる
- 新着 / 値下げ / 更新を分類できる
- Discord に通知できる
- 1日2回自動実行できる

---

## 21. v2 以降の拡張候補

- 物件スコアリング
- 修繕前提フラグの強化
- 接道 / 再建築可否の抽出
- 山間部判定
- 地図連携
- 画像の簡易判定
- 通知の優先度分け
- 日次サマリ通知
- ソースごとの失敗監視

---

## 22. 最終仕様サマリ

### システム名

**Akiya Hunter v1**

### 固定仕様

- 対象: 埼玉 / 千葉 / 長野 / 神奈川 / 東京
- 条件: 100万円以下
- 種別: 空き家
- 建物あり必須
- 広さ条件なし
- 通知先: Discord
- 保存先: SQLite + CSV
- 実行頻度: 1日2回（08:00 / 20:00）

### 判定優先度

1. 対象都県
2. 100万円以下
3. 空き家
4. 建物あり

### 通知対象

- 新着
- 値下げ
- 更新

以上を Akiya Hunter v1 の固定設計とする。
