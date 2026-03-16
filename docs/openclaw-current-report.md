# OpenClaw 現状レポート

更新日時: 2026-03-16 18:41 JST
対象リポジトリ: `mrcvgv/saiyasu-inakagurashi`
ブランチ: `main`
最新 push 済みコミット: `c3f765d`

---

## 1. 結論

現時点での OpenClaw 作業内容は **GitHub に push 済み**。
ただし、スクレイピング全体は **未完了**。

- GitHub反映: **済み**
- SQLite投入パイプライン: **作成済み**
- export: **動作確認済み**
- Browser必須サイト: **環境依存で未達あり**
- 取得済みデータ: **DB 535件 / listings-live.json 535件**

---

## 2. 今回追加・変更したもの

### 追加 / 実装
- `scripts/scrape-pipeline.js`
  - best-effort scraping pipeline
  - Playwright 経由の browser scraping ルートを追加
  - fetch/semantic scraping ルートを追加
  - SQLite `properties` テーブルに保存
  - 実行レポートを JSON 出力
- `scripts/run-semantic-scrape-today.js`
  - 当日用の意味抽出スクレイプ実験スクリプト
- `package.json`
  - 実行スクリプト追加
    - `npm run scrape:pipeline`
    - `npm run export:listings`
- `package-lock.json`
  - Playwright 導入に伴い更新
- `src/data/listings-live.json`
  - export で更新
- `saiyasu-crawler-config/akiya-bank-registry.json`
  - スクレイプ結果反映

### 依存
- `playwright` を導入
- Chromium の Playwright browser binary を導入

---

## 3. コミット履歴（今回の主なもの）

- `21dd3ef` — `Add best-effort scraping pipeline`
- `c3f765d` — `chore: push current scraping work and reports`

`c3f765d` が現在 GitHub 上の最新 push。

---

## 4. 現在の DB / export 状態

### SQLite
- DB path: `/home/koheisato/saiyasu-inakagurashi/data/akiya_hunter_v1.sqlite`
- schema: `/home/koheisato/saiyasu-inakagurashi/saiyasu-crawler-schema.sql`

### 現在件数
- total rows: **535**

### source 別件数
- `zero_estate`: 379
- `jmty_realestate`: 50
- `ieichiba`: 29
- `inakanet`: 25
- `yamakita_akiya`: 20
- `kamogawa_akiya`: 16
- `sakuho_akiya`: 7
- `tokigawa_akiya`: 5
- `hanno_akiya`: 3
- `saihoku`: 1

### export
- 実行: `python3 scripts/export-from-db.py`
- 結果: **成功**
- 出力: `src/data/listings-live.json`
- exported listings: **535件**

---

## 5. 直近の scraping pipeline 結果

### latest run の source 別
- `suumo_rent`: 0
- `homes_rent`: 0
- `athome_rent`: 0
- `jmty_realestate`: 30
- `inakanet`: 25
- `inakagurashi`: 0

### 取れたもの
- `jmty_realestate`: 取得成功（少なくとも部分成功）
- `inakanet`: 取得成功（少なくとも部分成功）

### 取れていない / blocked
- `suumo_rent`
- `homes_rent`
- `athome_rent`
- `inakagurashi`

---

## 6. 主要ブロッカー

### A. Browser系3サイト
対象:
- SUUMO賃貸
- LIFULL HOME'S賃貸
- athome賃貸

状況:
- Playwright 実装は入れた
- ただし、このホストでは browser 起動時に共有ライブラリ不足で失敗

代表的なエラー:
- `libnspr4.so` missing

意味:
- **コード未実装が原因ではなく、実行ホスト依存の不足**
- 追加で他の shared library 不足も出る可能性あり

### B. inakagurashi
- DNS / host resolution failure
- この環境から名前解決できない

---

## 7. いま Claude Code に引き継ぐべきポイント

Claude Code には以下を優先させるのがよい。

### 優先1: Browser実行環境の復旧
- Playwright 用の system dependency を満たす
- `libnspr4.so` を含む不足ライブラリ群を解消
- その後 `npm run scrape:pipeline` を再実行

### 優先2: Browser系3サイトの回収
- `suumo_rent`
- `homes_rent`
- `athome_rent`

### 優先3: fetch系の拡張
- `inakanet` の精度向上
- `jmty_realestate` の抽出精度向上
- `inakagurashi` の DNS/入口URL再確認

### 優先4: DB品質改善
現状の best-effort/semantic 抽出では、以下の品質問題が残る可能性あり:
- 住所誤抽出
- 価格誤判定
- 都道府県誤推定
- 0円判定の誤爆

---

## 8. 主要コマンド

### scraping 実行
```bash
cd /home/koheisato/saiyasu-inakagurashi
npm run scrape:pipeline
```

### export
```bash
cd /home/koheisato/saiyasu-inakagurashi
python3 scripts/export-from-db.py
```

### DB件数確認
```bash
cd /home/koheisato/saiyasu-inakagurashi
node - <<'NODE'
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/akiya_hunter_v1.sqlite');
console.log(db.prepare('select count(*) as c from properties').get());
console.log(db.prepare('select source, count(*) as c from properties group by source order by c desc').all());
db.close();
NODE
```

---

## 9. 現状の評価

### できていること
- scraping pipeline の土台は入った
- SQLite保存が回っている
- export も回っている
- Playwright 導入までは済んだ
- GitHub に push 済み

### まだ足りないこと
- Browser必須サイトの取得完了
- 環境依存の browser 起動失敗解消
- 意味抽出精度の改善
- 全国ポータルの網羅性向上

---

## 10. 一言まとめ

**今の OpenClaw の状態は、「パイプラインと保存/export はできているが、browser必須サイトはホスト依存で未突破、fetch系は部分成功」という段階。**

GitHub には現状すべて push 済み。
