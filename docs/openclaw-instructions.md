# OpenClaw 指示書 — 掘り出し物件ラボ クローラー

この指示書はOpenClawにそのまま貼って使う。
空き家ハンター（オリジナル）は一切触らないこと。
作業対象は /home/koheisato/saiyasu-inakagurashi/ 内のファイルのみ。

---

## ■ プロジェクト概要

「掘り出し物件ラボ」は、全国の格安物件（0円〜1000万円）を横断検索できるポータルサイト。
空き家バンク・賃貸ポータル・売買ポータルの情報を集約し、ソースタグ付きで表示する。

サイト: https://saiyasu-inakagurashi.vercel.app
リポジトリ: /home/koheisato/saiyasu-inakagurashi/
クローラー: /home/koheisato/saiyasu-inakagurashi/saiyasu-crawler-src/
設定: /home/koheisato/saiyasu-inakagurashi/saiyasu-crawler-config/

---

## ■ 現在の稼働状況（2026-03-16 更新）

### 稼働中ソース（60件 live）

#### 全国ポータル（1件）
1. ieichiba（家いちば） — 全国 — akiya_portal

#### 自治体空き家バンク（9件）
2. yamakita_akiya（山北町） — 神奈川県 — municipal_bank
3. hanno_akiya（飯能市） — 埼玉県 — municipal_bank
4. saku_akiya（佐久市） — 長野県 — municipal_bank
5. kamogawa_akiya（鴨川市） — 千葉県 — municipal_bank
6. chichibu_akiya（秩父地域） — 埼玉県 — municipal_bank
7. minamiboso_akiya（南房総市） — 千葉県 — municipal_bank
8. sakuho_akiya（佐久穂町） — 長野県 — municipal_bank
9. saihoku（埼北空き家バンク） — 埼玉県 — akiya_portal
10. tokigawa_akiya（ときがわ町） — 埼玉県 — municipal_bank

#### zero.estate（47件 — 全国展開済み）
11-57. zero_estate_{prefecture} — 各都道府県 — akiya_portal（0円物件）

#### ブロック中（3件 — enabled: false）
- athome_akiya — HTTP 403（ブラウザ自動化が必要）
- akiya_gateway — DNS解決不可（サイト廃止の可能性）
- lifull_akiyabank — HTTP 403（ブラウザ自動化が必要）

#### Phase 2 予定（3件 — planned）
- jmty_estate（ジモティー不動産） — rent_portal
- suumo_rent（SUUMO賃貸） — rent_portal — browser-heavy
- fudousan_japan（不動産ジャパン） — sale_portal

### 現在の設定
- 対象: 全47都道府県
- 価格上限: 1000万円（10,000,000円）
- 実行: 1日3回（08:30/12:30/20:30 JST）
- 通知: Discord（空き家ハンター びむ）
- 最低土地面積: 90㎡

---

## ■ レジストリファイル

### akiya-bank-registry.json
全国空き家バンクの発見・管理レジストリ。
- 10件 live（sources.json と連動）
- 44件 planned（URL発見待ち）
- 3件 blocked
- 9件の都道府県集約ポータルを記録
- 8波に分けた段階的発見計画

### subsidies-registry.json
全国移住補助金レジストリ。
- 6件のシード補助金データ（src/data/subsidies.ts と同期）
- 2件の国の制度（移住支援事業、起業支援事業）
- 8カテゴリ分類（migration_support, housing_acquisition, akiya_renovation, etc.）
- 8波に分けた段階的収集計画
- 現時点の安全な定期更新は seed sync と公式ドメインURL整備まで。自治体別の本格収集は search/fetch 前提で未自動化
- fiscal-year の daily subsidy check は、まず公式URL到達確認と seed の鮮度確認を行い、制度詳細URLが安全に特定できる場合のみ更新する（推測更新しない）

---

## ■ Phase 1 タスク: ソース拡大

### 1-1. zero.estate を全国展開 ✅ 完了
47都道府県すべてを sources.json に追加済み。
既存の zero_estate_listing / zero_estate_detail パーサーを共有使用。

### 1-2. 全国ポータル追加
- アットホーム空き家バンク — **BLOCKED**: HTTP 403
- 空き家ゲートウェイ — **BLOCKED**: DNS解決不可

### 1-3. 全国の空き家バンクを網羅的に収集（最重要）
akiya-bank-registry.json にレジストリ構築済み。
段階的発見・パーサー作成を8波で実行予定。

手順:
1. web_search で都道府県別に空き家バンクURLを発見
2. web_fetch でHTML構造を確認
3. municipal_base.js のパターンに当てはまるか判定
4. sources.json に追加、status を "live" に変更

---

## ■ Phase 1.5 タスク: 競売・差押・公売物件

### 1.5-1. 裁判所競売物件（BIT）
- URL: https://www.bit.courts.go.jp/
- 種別: auction（競売）
- カバー: 全国（全地方裁判所）
- 方式: web_fetch or Browser tool
- やること:
  - 都道府県別に不動産競売物件を巡回
  - 物件種別: 土地 / 戸建 / マンション / 農地
  - 売却基準価額 1000万円以下でフィルタ
  - 抽出項目: 事件番号 / 売却基準価額 / 買受可能価額 / 所在地 / 土地面積 / 建物面積 / 間取り / 入札期間 / 物件明細 / 写真
  - listing_type='sale', category='auction'
  - 入札期間終了後は status='contracted' に更新

### 1.5-2. 国税庁公売（官公庁オークション）
- URL: https://kankocho.jp/
- 種別: seized（差押物件）
- カバー: 全国
- 方式: web_fetch
- やること:
  - 不動産カテゴリを巡回
  - 国税局・税務署の差押不動産を抽出
  - 見積価額 1000万円以下でフィルタ
  - listing_type='sale', category='seized'
  - 公売期間終了後は status='contracted' に更新

### 1.5-3. Yahoo!官公庁オークション
- URL: https://koubai.auctions.yahoo.co.jp/
- 種別: seized
- カバー: 全国
- 方式: web_fetch or Browser tool
- やること:
  - 不動産カテゴリを巡回
  - 自治体の差押不動産・公有財産売却を抽出
  - listing_type='sale', category='seized'

### 1.5-4. 自治体公有財産売却
- 各自治体が独自に行う公有地・差押不動産の売却
- web_search で「○○市 公有財産 売却」「○○市 差押 不動産 公売」を検索
- 補助金収集と同時に発見する

---

## ■ Phase 2 タスク: 賃貸・売買ポータル

### 2-1. ジモティー不動産
- URL: https://jmty.jp/all/est
- 種別: rent_portal
- フィルタ: 月額5万円以下
- ステータス: planned（sources.json に追加済み）

### 2-2. SUUMO賃貸（低価格帯）
- URL: https://suumo.jp/chintai/
- 種別: rent_portal
- フィルタ: 月額3万円以下
- ステータス: planned（browser-heavy、実装は慎重に）

### 2-3. 不動産ジャパン
- URL: https://www.fudousan.or.jp/
- 種別: sale_portal
- フィルタ: 1000万円以下
- ステータス: planned

---

## ■ Phase 3 タスク: 全国自治体の移住補助金DB化

subsidies-registry.json にスキーマ・シードデータ構築済み。

### 収集対象カテゴリ
- 移住支援金（国の制度連携）
- 住宅取得補助（新築/中古）
- 空き家改修補助
- 家賃補助
- 子育て支援
- 起業支援
- テレワーク移住支援
- 就農支援

### データスキーマ
```json
{
  "id": "sub_{prefecture}_{city}_{type}",
  "prefecture": "長野県",
  "city": "佐久市",
  "title": "佐久市移住支援金",
  "category": "migration_support",
  "amount_text": "単身60万円、世帯100万円",
  "max_amount": 1000000,
  "conditions": "...",
  "eligibility": "...",
  "application_period": "...",
  "source_url": "https://...",
  "is_active": true,
  "fiscal_year": "2026"
}
```

---

## ■ 正規化ルール

全ソースからの取得データを以下のルールで統一する。

### 価格
- 「0円」「無償」→ 0
- 「50万円」→ 500000
- 「1,200万円」→ 12000000
- 「月3.8万円」→ monthly_rent: 38000
- 「応相談」「価格未定」→ null

### 面積
- ㎡ → そのまま
- 坪 → ×3.306 で㎡に変換

### 住所
- 都道府県を正規化（全47都道府県対応済み）
- 市区町村を分離

### 種別分類（実装済み）
- listing_type: 'sale' | 'rent' | 'free'
- category: 'akiya_bank' | 'free_property' | 'cheap_rent' | 'kominka' | 'general'
- 0円 → listing_type='free', category='free_property'
- 空き家バンク → category='akiya_bank'
- 月額賃料あり → listing_type='rent'
- 築50年以上 → category='kominka'

### ソースタグ（実装済み）
- 各物件に sources 配列を持たせる
- 同一物件が複数ソースにある場合はマージ
- 例: sources: [{portalName: "家いちば", portalUrl: "https://..."}]

---

## ■ 重複排除ルール

1. source_url（元URL）が完全一致 → 同一物件
2. 物件ID（inquiry_code）が一致 → 同一物件
3. 住所 + 価格 + 面積が近似 → 重複候補 → sources配列にマージ
4. 画像URLが同一 → 強い重複シグナル

---

## ■ 出力仕様

クロール完了後、自動化スクリプトで実行:

```bash
./scripts/crawl-and-deploy.sh
```

内部処理:
1. `node saiyasu-crawler-src/akiya_hunter_v1.js` — クロール
2. `node scripts/export-listings.js` — JSONエクスポート
3. `git add src/data/listings-live.json && git commit && git push` — デプロイ

安全性:
- クローラーエラーでもエクスポートは実行
- エクスポートエラーでもgit操作は実行
- git push失敗でもクローラー処理は止めない

---

## ■ スケジュール

用途別に実行:
- 06:00 — 賃貸ポータル巡回（Phase 2以降）
- 08:00 — 空き家バンク + 全国ポータル巡回
- 20:00 — 全国ポータル巡回（2回目）
- 21:00 — エクスポート → git push（1日1回だけ）
- 毎週月 09:00 — 補助金チェック
- 毎週日 03:00 — 新規ソース発見
- 年度末のみ（3/1〜4/30）— 補助金を毎日チェック

※ 3/1〜4/30 の daily subsidy job は cron だけでは月全体を拾うため、ジョブ側で日付ガード（3/1〜4/30のみ実行）を入れること。

cron設定例（scheduler.example.json参照）:
```
30 8 * * *  /home/koheisato/saiyasu-inakagurashi/scripts/crawl-and-deploy.sh
30 12 * * * /home/koheisato/saiyasu-inakagurashi/scripts/crawl-and-deploy.sh
30 20 * * * /home/koheisato/saiyasu-inakagurashi/scripts/crawl-and-deploy.sh
```

---

## ■ 絶対守ること

1. .openclaw/workspace/ 内の空き家ハンター（オリジナル）は絶対に触らない
2. saiyasu-inakagurashi/ 内のファイルだけを変更する
3. robots.txt を確認してからクロールする
4. クロール間隔は最低10秒空ける
5. 1サイトへの同時接続は1本まで
6. User-Agentを適切に設定する
7. 取得元URLを必ず保持する（sourceUrl）
8. エラーが出ても他のソースの処理は継続する
9. 個人情報（電話番号・メールアドレス等）は保存しない
10. git push が失敗してもクローラー処理は止めない
��理は止めない
