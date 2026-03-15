# Akiya Hunter v1

Akiya Hunter v1 は、**埼玉・千葉・長野・神奈川・東京**を対象に、**100万円以下の空き家**を定期巡回し、**新着・値下げ・更新**を検知して **Discord に通知**するための自動探索システムです。

## Goal

- 条件に合う物件を自動収集する
- 構造化データに変換する
- 重複を除いて履歴管理する
- 新着・値下げ・更新だけを Discord 通知する
- SQLite / CSV に保存する

## Fixed Scope (v1)

### Target prefectures

- 埼玉県
- 千葉県
- 長野県
- 神奈川県
- 東京都

### Target properties

- 空き家
- 価格 100万円以下
- 建物あり
- 広さ不問

### Not prioritized in v1

- 駅距離
- 築年
- 土地面積
- 間取り
- 山間部判定
- スコアリング

## High-level Flow

```text
Scheduler
  -> akiya_hunter_v1
  -> collect_listing_urls
  -> extract_property_details
  -> normalize_and_filter
  -> dedupe_against_history
  -> send_discord_notification
  -> save_history
```

## Run Schedule

- 毎日 08:00
- 毎日 20:00

## Module Responsibilities

### collect_listing_urls
- 各ソースから候補 URL を収集
- 厳密判定はまだしない
- 空き家らしい候補を広く拾う

### extract_property_details
- 物件詳細ページを取得
- 必要項目を構造化 JSON に変換

### normalize_and_filter
- 価格や都県名の表記揺れを正規化
- 空き家条件・建物有無・価格上限で判定
- reject reason を付与

### dedupe_against_history
- 履歴 DB と比較
- new / price_down / updated / known を分類

### send_discord_notification
- 通知対象イベントのみ Discord 送信

### save_history
- SQLite に upsert
- CSV バックアップ出力

## Event Types

- `new`
- `price_down`
- `updated`
- `known`

`known` は通知しません。

## Notification Policy

### Notify immediately
- new
- price_down
- updated

## Storage

### Primary
- SQLite

### Backup
- CSV

## Suggested Sources

Priority order:

1. 自治体の空き家バンク
2. 自治体提携の空き家ポータル
3. 空き家ポータル
4. ジモティー系
5. 一般不動産サイト（補助）

## SQLite Core Schema

Main table: `properties`

Core columns:

- id
- url
- source
- inquiry_code
- title
- prefecture
- city
- address_raw
- price_yen
- price_raw
- is_akiya
- has_building
- layout
- building_area_sqm
- land_area_sqm
- building_age
- notes
- contact
- status_text
- image_urls_json
- event_type
- hash_signature
- first_seen_at
- last_seen_at
- last_notified_at

## Done Definition for v1

- 5都県を対象に巡回できる
- 100万円以下の空き家を抽出できる
- SQLite に履歴を保存できる
- new / price_down / updated を判定できる
- Discord 通知できる
- 1日2回自動実行できる

## Next

- GitHub Issues に分解
- SQLite schema をファイル化
- 実装雛形を生成
- ソース設定ファイルを追加
