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

### 1-3. 自治体空き家バンク拡大

以下の手順で自治体ソースを増やす:

1. web_search で「○○県 空き家バンク」を検索
2. 各市区町村の空き家バンクURLを発見
3. HTMLの構造を確認（table / dl-dd / bullet / text）
4. municipal_base.js の既存パターンに当てはまるか判定
5. 当てはまればsources.jsonに追加、当てはまらなければ個別パーサー作成

#### 優先追加対象（物件数が多い地域）
- 北海道: 空知地域、上川地域、十勝地域
- 東北: 秋田県全域、山形県全域
- 関東: 茨城県、栃木県、群馬県
- 中部: 新潟県、富山県、石川県
- 中国: 島根県、山口県
- 四国: 高知県全域、愛媛県
- 九州: 大分県全域、宮崎県、鹿児島県

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

## ■ Phase 3 タスク: 補助金・制度収集

### 3-1. 補助金ページ巡回

各自治体について以下の手順:

1. web_search で「○○市 移住 補助金」「○○市 空き家 改修 補助」を検索
2. 公式ドメイン（.lg.jp / .city.*.jp / .town.*.jp）を優先
3. 以下を抽出:
   - 制度名
   - 支給額 / 補助率
   - 対象者条件
   - 申請期限
   - 制度URL
   - カテゴリ（移住支援/空き家改修/住宅取得/家賃補助/子育て支援/起業支援）
4. PDFしかない場合はPDFもダウンロードして解析

### 3-2. 制度更新検知

- 年度切り替え時（4月）に再チェック
- 金額変更 / 条件変更を差分として検知
- 終了した制度は is_active=false にする

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

毎日3回実行:
- 08:30 — クロール → エクスポート → push
- 12:30 — クロール → エクスポート → push
- 20:30 — クロール → エクスポート → push

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
