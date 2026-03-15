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

## ■ 現在の稼働状況

### 稼働中ソース（13件）
1. ieichiba（家いちば） — 全国 — akiya_portal
2. yamakita_akiya（山北町） — 神奈川県 — municipal_bank
3. hanno_akiya（飯能市） — 埼玉県 — municipal_bank
4. saku_akiya（佐久市） — 長野県 — municipal_bank
5. kamogawa_akiya（鴨川市） — 千葉県 — municipal_bank
6. chichibu_akiya（秩父地域） — 埼玉県 — municipal_bank
7. minamiboso_akiya（南房総市） — 千葉県 — municipal_bank
8. sakuho_akiya（佐久穂町） — 長野県 — municipal_bank
9. zero_estate_chiba — 千葉県 — akiya_portal（0円物件）
10. zero_estate_saitama — 埼玉県 — akiya_portal（0円物件）
11. zero_estate_nagano — 長野県 — akiya_portal（0円物件）
12. saihoku（埼北空き家バンク） — 埼玉県 — akiya_portal
13. tokigawa_akiya（ときがわ町） — 埼玉県 — municipal_bank

### 現在の設定
- 対象: 北海道/埼玉/千葉/東京/神奈川/長野/秋田/広島/高知/大分
- 価格上限: 1000万円
- 実行: 1日3回（08:00/12:00/20:00）
- 通知: Discord

---

## ■ Phase 1 タスク: ソース拡大

以下の順で新規ソースを追加してほしい。
各ソースは saiyasu-crawler-config/sources.json に追加し、
対応するパーサーを saiyasu-crawler-src/sources/ に作成する。

### 1-1. zero.estate を全国展開

現在3県のみ。以下を追加:

```
https://zero.estate/category/zero/hokkaido/hokkaido/     北海道
https://zero.estate/category/zero/tohoku/akita/           秋田県
https://zero.estate/category/zero/tohoku/aomori/          青森県
https://zero.estate/category/zero/tohoku/iwate/           岩手県
https://zero.estate/category/zero/tohoku/miyagi/          宮城県
https://zero.estate/category/zero/tohoku/yamagata/        山形県
https://zero.estate/category/zero/tohoku/fukushima/       福島県
https://zero.estate/category/zero/kanto/ibaraki/          茨城県
https://zero.estate/category/zero/kanto/tochigi/          栃木県
https://zero.estate/category/zero/kanto/gunma/            群馬県
https://zero.estate/category/zero/kanto/tokyo/            東京都
https://zero.estate/category/zero/kanto/kanagawa/         神奈川県
https://zero.estate/category/zero/chubu/niigata/          新潟県
https://zero.estate/category/zero/koushinetsu/yamanashi/  山梨県
https://zero.estate/category/zero/chubu/toyama/           富山県
https://zero.estate/category/zero/chubu/ishikawa/         石川県
https://zero.estate/category/zero/chubu/fukui/            福井県
https://zero.estate/category/zero/chubu/gifu/             岐阜県
https://zero.estate/category/zero/chubu/shizuoka/         静岡県
https://zero.estate/category/zero/chubu/aichi/            愛知県
https://zero.estate/category/zero/kinki/mie/              三重県
https://zero.estate/category/zero/kinki/shiga/            滋賀県
https://zero.estate/category/zero/kinki/kyoto/            京都府
https://zero.estate/category/zero/kinki/osaka/            大阪府
https://zero.estate/category/zero/kinki/hyogo/            兵庫県
https://zero.estate/category/zero/kinki/nara/             奈良県
https://zero.estate/category/zero/kinki/wakayama/         和歌山県
https://zero.estate/category/zero/chugoku/tottori/        鳥取県
https://zero.estate/category/zero/chugoku/shimane/        島根県
https://zero.estate/category/zero/chugoku/okayama/        岡山県
https://zero.estate/category/zero/chugoku/hiroshima/      広島県
https://zero.estate/category/zero/chugoku/yamaguchi/      山口県
https://zero.estate/category/zero/shikoku/tokushima/      徳島県
https://zero.estate/category/zero/shikoku/kagawa/         香川県
https://zero.estate/category/zero/shikoku/ehime/          愛媛県
https://zero.estate/category/zero/shikoku/kochi/          高知県
https://zero.estate/category/zero/kyushu/fukuoka/         福岡県
https://zero.estate/category/zero/kyushu/saga/            佐賀県
https://zero.estate/category/zero/kyushu/nagasaki/        長崎県
https://zero.estate/category/zero/kyushu/kumamoto/        熊本県
https://zero.estate/category/zero/kyushu/oita/            大分県
https://zero.estate/category/zero/kyushu/miyazaki/        宮崎県
https://zero.estate/category/zero/kyushu/kagoshima/       鹿児島県
https://zero.estate/category/zero/okinawa/okinawa/        沖縄県
```

既存の zero_estate_listing / zero_estate_detail パーサーをそのまま使う。
sources.json に県別エントリを追加するだけでいい。

### 1-2. 全国ポータル追加

以下のサイトを web_fetch で調査し、パーサーを作成:

#### アットホーム空き家バンク
- URL: https://www.akiya-athome.jp/
- 種別: akiya_portal
- カバー: 全国
- 方式: web_fetch（静的HTML）
- やること: 都道府県別一覧ページを巡回、詳細ページから物件情報を抽出

#### 空き家ゲートウェイ
- URL: https://akiya-gateway.jp/
- 種別: akiya_portal
- カバー: 全国
- 方式: web_fetch
- やること: 一覧巡回、詳細抽出

### 1-3. 全国の空き家バンクを網羅的に収集（最重要タスク）

目標: 全国約900自治体が運営する空き家バンクを全件発見・登録・巡回する。
これはこのサイトの根幹データなので、最優先で進める。

#### 手順

##### ステップ1: 全国空き家バンク一覧の構築

以下の方法で全自治体の空き家バンクURLを収集し、
saiyasu-crawler-config/akiya-bank-registry.json に保存する。

1. web_search で「全国 空き家バンク 一覧」を検索し、まとめサイトからURLリストを取得
2. 47都道府県それぞれについて web_search で「○○県 空き家バンク」を検索
3. 各都道府県の空き家バンク集約ページがあればそこから市区町村の一覧を取得
   例: 長野県なら「楽園信州」、高知県なら「高知家で暮らす」など
4. 各市区町村について web_search で「○○市 空き家バンク」を検索
5. 公式ドメイン（.lg.jp / .city.*.jp / .town.*.jp）を優先判定
6. 結果をJSON形式で保存:

```json
{
  "prefecture": "長野県",
  "city": "佐久市",
  "akiya_bank_url": "https://39ijyu.com/all.php?kubun=IE",
  "domain_type": "external_portal",
  "status": "discovered",
  "discovered_at": "2026-03-16"
}
```

##### ステップ2: 各空き家バンクのパーサー作成

発見した空き家バンクごとに:

1. web_fetch でページを取得
2. HTMLの構造を確認（table / dl-dd / bullet / text / カード型）
3. municipal_base.js の既存4パターンに当てはまるか判定
4. 当てはまれば sources.json に設定追加のみ
5. 当てはまらなければ saiyasu-crawler-src/sources/ に個別パーサー作成
6. パーサーが動いたら status を "live" に変更

##### ステップ3: 都道府県別に順次実行

以下の順で都道府県を処理する（物件数が多い順）:

**第1波（物件数が多い）:**
北海道 → 長野県 → 千葉県 → 茨城県 → 栃木県 → 群馬県 → 新潟県

**第2波:**
秋田県 → 山形県 → 岩手県 → 福島県 → 青森県 → 宮城県

**第3波:**
高知県 → 愛媛県 → 徳島県 → 香川県

**第4波:**
大分県 → 鹿児島県 → 宮崎県 → 熊本県 → 佐賀県 → 長崎県 → 福岡県

**第5波:**
島根県 → 山口県 → 鳥取県 → 岡山県 → 広島県

**第6波:**
富山県 → 石川県 → 福井県 → 岐阜県 → 山梨県 → 静岡県

**第7波:**
和歌山県 → 奈良県 → 三重県 → 滋賀県 → 京都府 → 兵庫県

**第8波:**
埼玉県 → 神奈川県 → 東京都 → 愛知県 → 大阪府 → 沖縄県

各波ごとに:
- 空き家バンクURL発見 → パーサー作成 → テスト実行 → sources.json追加 → 完了報告

##### ステップ4: 定期更新

- 全空き家バンクを毎日巡回する
- 新着物件 / 価格変更 / 成約済みを検知
- 新しい空き家バンクが開設されたら追加
- 閉鎖された空き家バンクは status を "deprecated" にする

---

## ■ Phase 2 タスク: 賃貸・売買ポータル

### 2-1. 賃貸ソース追加

#### ジモティー不動産
- URL: https://jmty.jp/all/est
- 種別: rent_portal
- フィルタ: 月額5万円以下
- 方式: web_fetch（一覧はHTMLベース）
- 抽出: 賃料/所在地/面積/写真/詳細URL

#### SUUMO賃貸（低価格帯）
- URL: https://suumo.jp/chintai/
- 種別: rent_portal
- フィルタ: 月額3万円以下
- 方式: Browser tool（JS-heavy）
- 注意: robots.txt確認、レート制御必須、過度なアクセス禁止

### 2-2. 売買ポータル追加

#### 不動産ジャパン
- URL: https://www.fudousan.or.jp/
- 種別: sale_portal
- 方式: web_fetch
- フィルタ: 1000万円以下

---

## ■ Phase 3 タスク: 全国自治体の移住補助金DB化（最重要タスク）

目標: 全国約1,740市区町村の移住・定住支援制度を網羅的に収集し、
常に最新の状態を維持するDBを構築する。

### 3-1. 補助金の全国一括収集

#### ステップ1: 都道府県単位で補助金を発見

47都道府県それぞれについて以下を実行:

1. web_search で以下のキーワードを検索:
   - 「○○県 移住 補助金 一覧」
   - 「○○県 移住支援金」
   - 「○○県 空き家 改修 補助」
   - 「○○県 定住促進 助成」
   - 「○○県 家賃補助 移住」
   - 「○○県 子育て 移住 支援」
   - 「○○県 起業 移住 補助」

2. 都道府県の移住ポータルがあればそこから市区町村の一覧を取得
   例: 長野県「楽園信州」、高知県「高知家で暮らす」、北海道「北海道移住まるごと情報」

3. 国の制度も収集:
   - 地方創生移住支援事業（最大100万円）
   - 地方創生起業支援事業（最大200万円）
   - これらの対象自治体一覧

#### ステップ2: 市区町村単位で詳細収集

各市区町村について:

1. web_search で「○○市 移住 補助金」「○○市 空き家 補助」を検索
2. 公式ドメイン（.lg.jp / .city.*.jp / .town.*.jp）を優先
3. 以下の全カテゴリを抽出:

**移住支援金系:**
- 移住支援金（国の制度連携）
- 独自移住奨励金
- UIターン支援金
- 引越し費用補助

**住宅系:**
- 住宅取得補助（新築/中古）
- 空き家改修補助
- 空き家バンク利用補助
- 家賃補助
- 住宅ローン利子補給

**子育て系:**
- 出産祝い金
- 子育て支援金
- 保育料補助
- 医療費助成

**就業・起業系:**
- 起業支援金
- 就農支援
- テレワーク移住支援
- 地域おこし協力隊

4. 各制度について以下を抽出:

```json
{
  "prefecture": "長野県",
  "city": "佐久市",
  "title": "佐久市移住支援金",
  "category": "migration_support",
  "amount_text": "単身60万円、世帯100万円",
  "max_amount": 1000000,
  "conditions": "東京23区在住または通勤者、5年以上居住の意思",
  "eligibility": "転入前に東京圏に5年以上在住",
  "application_period": "通年（予算上限あり）",
  "source_url": "https://www.city.saku.nagano.jp/...",
  "is_active": true,
  "fiscal_year": "2026"
}
```

5. PDFしかない場合はPDFもダウンロードしてテキスト抽出
6. 表形式の場合は項目マッピング

#### ステップ3: 結果の保存

収集した補助金データを以下に保存:
- saiyasu-crawler-config/subsidies-registry.json — 全件の補助金レジストリ
- src/data/subsidies-live.json — サイト表示用（export-subsidies.js で変換）

#### ステップ4: 都道府県別に順次実行（空き家バンクと同じ順序で）

第1波から第8波まで、空き家バンク収集と同時並行で進める。
1つの市区町村を調査するときに、空き家バンクと補助金の両方を一度に収集する。

### 3-2. 定期更新（常に最新を維持）

#### 毎日の更新
- 全補助金ページを巡回し、変更を検知
- 金額変更 / 条件変更を差分として記録
- 新規制度を追加

#### 年度更新（毎年3月〜4月）
- 全制度の年度切り替えを一斉チェック
- 「令和7年度」→「令和8年度」の表記変更を検知
- 終了した制度は is_active=false にする
- 新年度の制度を追加
- 予算額の変更を記録

#### 不定期更新
- 補正予算による制度変更を検知
- 予算上限到達による受付停止を検知
- 新設された臨時制度を発見

### 3-3. 補助金と物件の自動マッチング

物件詳細ページで「この地域で使える補助金」を自動表示するため:

1. 物件の prefecture + city から該当する補助金を検索
2. 物件の listing_type（売買/賃貸/無償）に対応する補助金を絞り込み
3. 空き家バンク物件には「空き家改修補助」を優先表示
4. 結果を物件データに紐づける

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
- 「土地:256.53m2 建物:105.66m2」→ land_area_sqm: 256.53, building_area_sqm: 105.66

### 住所
- 都道府県を正規化（「東京」→「東京都」、「千葉」→「千葉県」）
- 市区町村を分離
- 番地以降は address フィールドに

### 種別分類
- listing_type: 'sale' | 'rent' | 'free'
- category: 'akiya_bank' | 'free_property' | 'cheap_rent' | 'kominka' | 'general'
- 0円 → listing_type='free', category='free_property'
- 空き家バンク → category='akiya_bank'
- 月額賃料あり → listing_type='rent'
- 築50年以上 → category='kominka' タグ追加

### ソースタグ
- 各物件に sources 配列を持たせる
- 同一物件が複数ソースにある場合はマージ
- 例: sources: [{portalName: "家いちば", portalUrl: "https://..."}, {portalName: "空き家バンク", portalUrl: "https://..."}]

---

## ■ 重複排除ルール

1. source_url（元URL）が完全一致 → 同一物件
2. 物件ID（inquiry_code）が一致 → 同一物件
3. 住所 + 価格 + 面積が近似 → 重複候補 → sources配列にマージ
4. 画像URLが同一 → 強い重複シグナル

重複時はsources配列に追加し、最安値をlowestPriceに設定。

---

## ■ 出力仕様

クロール完了後、以下を実行:

```bash
cd /home/koheisato/saiyasu-inakagurashi
node scripts/export-listings.js
git add src/data/listings-live.json
git commit -m "物件データ自動更新"
git push
```

これでVercelに自動デプロイされ、サイトに反映される。

---

## ■ スケジュール

ソースの更新頻度に合わせた最適スケジュール。
不動産は高頻度で変わらないので、無駄なクロールはしない。

### 毎日
| 時刻 | 対象 | 理由 |
|---|---|---|
| 06:00 | 賃貸ポータル（Phase2以降） | 早朝に取得して朝の検索に備える |
| 08:00 | 空き家バンク（自治体）＋ 全国ポータル（ieichiba等） | 自治体は営業時間に更新するため朝1回 |
| 12:00 | 0円物件（zero.estate） | 掲載数が少なく変動も少ないため1日1回 |
| 20:00 | 全国ポータル（ieichiba等）2回目 | 個人投稿があるので朝夕でカバー |
| 21:00 | エクスポート → git push | 1日の最後にまとめて1回だけpush |

### 毎週
| 曜日・時刻 | 対象 | 理由 |
|---|---|---|
| 月曜 09:00 | 補助金チェック | 制度は月単位でしか変わらない |
| 日曜 03:00 | 新規ソース発見（web_search） | 新しい空き家バンクの開設を検知 |

### 年度末特別（3/1〜4/30）
| 時刻 | 対象 | 理由 |
|---|---|---|
| 毎日 09:00 | 補助金全件チェック | 年度切り替えで制度が大量に変わるため |

### エクスポート＋pushの流れ（毎日21:00に1回だけ）
```bash
cd /home/koheisato/saiyasu-inakagurashi
node scripts/export-listings.js
git add src/data/listings-live.json
git commit -m "物件データ自動更新 $(date +%Y-%m-%d)"
git push
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
