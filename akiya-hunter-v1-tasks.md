# Akiya Hunter v1 実装タスク

## すぐ着手する順番

1. リポジトリ構成を切る
2. config を作る
3. SQLite schema を入れる
4. 候補 URL 収集モジュールを作る
5. 最初の自治体系ソースを1件つなぐ
6. 詳細抽出を作る
7. normalize/filter を作る
8. dedupe を作る
9. Discord 通知を作る
10. save_history を作る
11. scheduler をつなぐ
12. テストを足す

## 直近MVP

### MVP-1
- 1ソースで候補 URL を取れる
- 詳細ページから JSON を抜ける
- 100万円以下の空き家だけ通せる

### MVP-2
- SQLite に保存できる
- new / known 判定ができる
- Discord に新着通知できる

### MVP-3
- price_down / updated 判定ができる
- 1日2回まわる
- CSV バックアップが出る
