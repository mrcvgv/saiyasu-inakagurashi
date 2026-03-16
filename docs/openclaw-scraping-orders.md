# OpenClaw スクレイピング指示書（全ソース網羅版）

## 前提

パーサーを個別に作るのは遅すぎる。
お前はAIなんだから、ページの構造を見て意味的にデータを抽出しろ。
CSSセレクタやXPathに頼るな。ページを読んで人間のように理解して抽出しろ。

作業対象: /home/koheisato/saiyasu-inakagurashi/ のみ
.openclaw/workspace/ は絶対触るな

---

## ■ 指示1: 全国の空き家バンクを全部見つけろ

### やり方

47都道府県すべてについて、以下を実行:

```
web_search「{都道府県名} 空き家バンク」
web_search「{都道府県名} 空き家バンク 一覧」
web_search「{都道府県名} 空き家 物件」
```

さらに各都道府県の移住ポータルを探す:

```
web_search「{都道府県名} 移住 ポータル」
web_search「{都道府県名} 移住支援 空き家」
```

見つかったURLをすべて web_fetch で開き、以下を確認:
- 物件一覧ページがあるか
- 物件が1件以上掲載されているか
- アクセスできるか（403 / ページなし等でないか）

結果を /home/koheisato/saiyasu-inakagurashi/saiyasu-crawler-config/akiya-bank-registry.json に追記。

### 見つけるべきソースの種類

1. **自治体公式の空き家バンク**（.lg.jp / .city.*.jp / .town.*.jp）
2. **都道府県の空き家バンク集約サイト**
   - 長野県 → 楽園信州 https://rakuen-shinshu.jp/
   - 高知県 → 高知家で暮らす
   - 北海道 → 北海道移住まるごと情報
   - 新潟県 → にいがた暮らし
   - 等。全県分見つけろ
3. **広域の空き家バンクポータル**
   - ニッポン移住・交流ナビ（JOIN） https://www.iju-join.jp/
   - LIFULL HOME'S 空き家バンク https://www.homes.co.jp/akiyabank/
   - アットホーム空き家バンク https://www.akiya-athome.jp/
   - 空き家ゲートウェイ https://akiya-gateway.jp/
   - 空き家活用株式会社 https://aki-katsu.co.jp/
4. **独立系の空き家ポータル**
   - 家いちば https://www.ieichiba.com/（接続済み）
   - ゼロ円不動産 https://zero.estate/（接続済み）
   - 田舎暮らし情報館 https://www.inakagurashi.jp/
   - 空き家活用.net
   - 空き家バンクナビ

### 目標件数

現在13ソース → **最低100ソース、目標300ソース以上**

---

## ■ 指示2: 全国ポータルサイトを全部クロールしろ

以下のサイトはすべて全国の物件情報を持っている。
全部巡回対象にしろ。

### 売買系

| サイト | URL | 方式 |
|---|---|---|
| 家いちば | https://www.ieichiba.com/ | web_fetch（接続済み） |
| ゼロ円不動産 | https://zero.estate/ | web_fetch（接続済み） |
| アットホーム空き家バンク | https://www.akiya-athome.jp/ | web_fetch |
| LIFULL HOME'S 空き家バンク | https://www.homes.co.jp/akiyabank/ | web_fetch or browser |
| 田舎暮らし情報館 | https://www.inakagurashi.jp/ | web_fetch |
| 別荘リゾートネット | https://www.resort-net.co.jp/ | web_fetch |
| 田舎ねっと | https://www.inakanet.jp/ | web_fetch |
| ビレッジハウス | https://www.villagehouse.jp/ | web_fetch（格安賃貸） |
| 不動産ジャパン | https://www.fudousan.or.jp/ | web_fetch |
| HOME'S（低価格帯） | https://www.homes.co.jp/ | browser |
| SUUMO（低価格帯） | https://suumo.jp/ | browser |
| at home（低価格帯） | https://www.athome.co.jp/ | browser |
| Yahoo!不動産 | https://realestate.yahoo.co.jp/ | browser |

### 賃貸系

| サイト | URL | 方式 |
|---|---|---|
| ジモティー不動産 | https://jmty.jp/all/est | web_fetch |
| ビレッジハウス | https://www.villagehouse.jp/ | web_fetch |
| UR賃貸住宅 | https://www.ur-net.go.jp/ | web_fetch |
| 公営住宅（各自治体） | 各自治体サイト | web_fetch |
| SUUMO賃貸（3万以下） | https://suumo.jp/chintai/ | browser |
| HOME'S賃貸（3万以下） | https://www.homes.co.jp/chintai/ | browser |

### 競売・公売系

| サイト | URL | 方式 |
|---|---|---|
| BIT（裁判所競売） | https://www.bit.courts.go.jp/ | web_fetch or browser |
| KSI官公庁オークション | https://kankocho.jp/ | web_fetch |
| Yahoo!官公庁オークション | https://koubai.auctions.yahoo.co.jp/ | web_fetch |
| 各自治体の公有財産売却 | web_search で発見 | web_fetch |

### 土地専門系

| サイト | URL | 方式 |
|---|---|---|
| 土地NET | https://www.tochinet.com/ | web_fetch |
| 土地価格ドットコム | https://www.tochidai.info/ | web_fetch（参考価格） |
| 農地の売買（各農業委員会） | web_search で発見 | web_fetch |

---

## ■ 指示3: スクレイピングの方法を変えろ

### 今の問題

個別パーサーを作るのが遅い。
サイトごとにHTML構造が違うので、固定のCSSセレクタが壊れる。

### 新しい方法

**お前はAIだ。ページを読んで理解しろ。**

各サイトについて:

1. web_fetch でページを取得
2. HTMLの内容を読む
3. 以下の情報を**意味的に**抽出する:

```
- タイトル（物件名）
- 価格（売買価格 or 賃料）
- 所在地（都道府県・市区町村・住所）
- 土地面積
- 建物面積
- 間取り
- 築年数
- 画像URL
- 物件詳細URL
- 物件説明文
- 状態（掲載中 / 成約済み）
```

4. 結果を以下のJSON形式で出力:

```json
{
  "title": "...",
  "price": 800000,
  "price_raw": "80万円",
  "listing_type": "sale",
  "prefecture": "長野県",
  "city": "佐久市",
  "address": "...",
  "land_area_sqm": 500,
  "building_area_sqm": 82,
  "built_year": 1975,
  "layout": "4DK",
  "image_url": "https://...",
  "source_url": "https://...",
  "source_name": "ieichiba",
  "description": "..."
}
```

5. ページネーションがあれば次のページも取得
6. 各物件の詳細ページも web_fetch で開いて追加情報を取得

### 取得できないサイトの対応

- 403が返る → Browser toolに切り替え
- JSレンダリングが必要 → Browser toolに切り替え
- robots.txt で禁止 → スキップして記録
- CAPTCHAが出る → スキップして記録

---

## ■ 指示4: 補助金を全市区町村から集めろ

### やり方

47都道府県 × 各市区町村について:

```
web_search「{市区町村名} 移住 補助金」
web_search「{市区町村名} 空き家 補助 改修」
web_search「{市区町村名} 定住 支援」
web_search「{市区町村名} 住宅取得 補助」
```

見つかったページを web_fetch で開いて以下を抽出:

```
- 制度名
- 支給額（最大額）
- 対象者条件
- 申請期限
- カテゴリ（移住支援/空き家改修/住宅取得/家賃補助/子育て/起業/テレワーク/就農）
- ソースURL
- 年度
```

### 効率化

都道府県の移住ポータルに市区町村の補助金一覧がまとまっていることが多い。
そこから一括で取れ。

例:
- 長野県「楽園信州」→ 市町村別支援制度一覧
- 高知県「高知家で暮らす」→ 支援制度検索
- ふるさと回帰支援センター → https://www.furusatokaiki.net/

### 目標

現在6件 → **最低500件、目標1000件以上**

---

## ■ 指示5: 結果の保存先

### 物件データ

取得した物件データは以下に保存:

```bash
/home/koheisato/saiyasu-inakagurashi/src/data/listings-live.json
```

形式は既存のListing型JSONに合わせる。

### 補助金データ

```bash
/home/koheisato/saiyasu-inakagurashi/src/data/subsidies-live.json
```

### ソースレジストリ

発見したソースURLの記録:

```bash
/home/koheisato/saiyasu-inakagurashi/saiyasu-crawler-config/akiya-bank-registry.json
/home/koheisato/saiyasu-inakagurashi/saiyasu-crawler-config/subsidies-registry.json
```

### Supabaseへの直接投入

可能ならSupabase APIに直接投入:

```
URL: https://syxrzgmbzczuaapvxmrx.supabase.co/rest/v1/listings
Headers:
  apikey: sb_publishable_YcllDJu24XSTAej_EzMNKQ_BlynEIpR
  Authorization: Bearer sb_publishable_YcllDJu24XSTAej_EzMNKQ_BlynEIpR
  Content-Type: application/json
  Prefer: resolution=merge-duplicates
Method: POST
```

source_url が UNIQUE キーなので、同じURLの物件は自動で重複排除される。

---

## ■ 指示6: 実行順序

### 今すぐやること（Phase A）

1. 全国ポータル（上の表の全サイト）を web_fetch で1つずつ開いて、物件一覧を取得
2. 取得できたサイトから物件データを抽出
3. Supabaseに投入
4. 取得できなかったサイトをリストアップ（403 / JS必須 / robots禁止）

### 次にやること（Phase B）

5. 47都道府県の空き家バンクURLを web_search で全部発見
6. 発見したURLを web_fetch で開いて物件抽出
7. 補助金ページを web_search で発見して抽出

### その後（Phase C）

8. 403 / JS必須のサイトを Browser tool で対応
9. PDFの物件チラシを解析
10. 定期巡回のスケジュール設定

---

## ■ 指示7: 実行時の注意

1. **1サイトあたり10秒以上間隔を空けろ**
2. **robots.txt を確認しろ**
3. **403が出たらそのサイトは飛ばして次に行け。止まるな。**
4. **1つのサイトで失敗しても他の全サイトを処理しろ**
5. **取得できた物件数と失敗したサイトを毎回報告しろ**
6. **.openclaw/workspace/ は絶対に触るな**
7. **個人情報（電話番号・メールアドレス）は保存するな**
8. **取得元URLは必ず保持しろ（source_url）**

---

## ■ 指示8: 進捗報告フォーマット

各実行後に以下の形式で報告:

```
【スクレイピング結果】
実行日時: 2026-03-16 21:00
処理サイト数: 25
取得物件数: 342
新規物件数: 48
取得補助金数: 89
失敗サイト数: 5
失敗サイト:
  - suumo.jp (403)
  - homes.co.jp (JS必須)
  - ...
Supabase投入: OK
```

---

## ■ 今日これだけやれ

まずは以下のサイトだけでいいから全部スクレイピングしろ:

1. https://www.ieichiba.com/ — 全ページ取得（既存パーサー活用可）
2. https://zero.estate/ — 全47都道府県ページ取得
3. https://www.inakagurashi.jp/ — 田舎暮らし情報館
4. https://www.inakanet.jp/ — 田舎ねっと
5. https://jmty.jp/all/est — ジモティー不動産
6. https://www.akiya-athome.jp/ — アットホーム空き家バンク
7. https://www.bit.courts.go.jp/ — 裁判所競売

取得できた物件を全部 Supabase に投入しろ。
終わったら結果を報告しろ。
