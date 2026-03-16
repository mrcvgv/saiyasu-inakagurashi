# SAIYASU_TASK.md — 最安田舎暮らし 現在のタスク

最終更新: 2026-03-16

---

## 現スプリント: MVP完成と実データ接続

### 優先度: 高

- [ ] **カテゴリページ実装** — /cheap-land, /akiya, /cheap-rent, /auction, /business
  - 各ページは /cheap と同様の構成 (フィルタ済み物件一覧)
  - listing_type / flags でフィルタ

- [ ] **Supabase実データ接続** — ダミーデータからDB読み込みに切り替え
  - lib/queries.ts を SSR で Supabase から fetch する形に
  - フォールバック: Supabase接続不可時はダミーデータを使用
  - 環境変数: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

- [ ] **物件詳細ページ強化** — /listings/[id]
  - 関連物件 (同じ都道府県, 同じ価格帯)
  - 関連補助金 (同じ都道府県)
  - パンくずリスト
  - 構造化データ (JSON-LD)

### 優先度: 中

- [ ] **SEO基盤** — metadata, sitemap, robots.txt
  - 各ページの title / description を設計
  - generateMetadata を全ページに実装
  - sitemap.xml の自動生成
  - OGP画像

- [ ] **都道府県別ページ** — /prefecture/[slug]
  - 47都道府県分の物件一覧
  - 都道府県の補助金情報も表示
  - SEOランディングページとして機能

- [ ] **検索機能強化**
  - カテゴリフィルタ追加 (listing_type)
  - ソート (価格順, 新着順, 面積順)
  - ページネーション

### 優先度: 低

- [ ] **ガイドコンテンツ** — /guide 以下
- [ ] **相談フォーム** — /consult のフォーム実装
- [ ] **Vercelデプロイ** — 本番環境構築
- [ ] **Google Analytics / Search Console 設定**

---

## 完了済み

- [x] Next.js プロジェクト初期化
- [x] トップページ (カテゴリ, 価格, エリア, 新着, 人気, CTA)
- [x] /search (検索結果ページ)
- [x] /listings (物件一覧)
- [x] /listings/[id] (物件詳細 基本版)
- [x] /cheap (格安特集)
- [x] /subsidy (補助金一覧)
- [x] /consult (相談ページ 基本版)
- [x] ダミーデータ (8物件, 6補助金)
- [x] 基本コンポーネント (Header, Footer, ListingCard, SearchForm, SectionTitle)
- [x] 型定義 (Listing, Subsidy)

---

## 次の Builder AI への指示

上記「優先度: 高」のタスクを上から順に実装してください。

参照すべきファイル:
- このファイル (SAIYASU_TASK.md)
- specs/SAIYASU_SPEC.md — 技術仕様
- specs/PAGE_MAP.md — ページ構成
- specs/UI_REQUIREMENTS.md — デザイン要件
- ../shared-ai/DB_SCHEMA.md — DBスキーマ
- ../shared-ai/API_CONTRACT.md — データ形式

やってはいけないこと:
- スクレイピング処理を書くこと
- OpenClaw依存のコードを書くこと
- データスキーマを勝手に変更すること
- 空き家ハンター側のコードを書くこと
