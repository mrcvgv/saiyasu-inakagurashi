import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import { regions } from "@/data/regions";
import { prefectures } from "@/data/prefectures";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

// --- カテゴリ導線 ---
const CATEGORIES = [
  {
    title: "格安土地",
    description: "0円〜1000万円の土地・物件",
    href: "/cheap-land",
    icon: "🏡",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    title: "空き家",
    description: "古民家再生・セルフリノベ向け",
    href: "/akiya",
    icon: "🏚️",
    color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  {
    title: "格安賃貸",
    description: "月1万〜5万円の格安賃貸",
    href: "/cheap-rent",
    icon: "🔑",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    title: "事業用物件",
    description: "倉庫付き・店舗可・広い土地",
    href: "/business",
    icon: "🏢",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    title: "移住向け",
    description: "補助金・移住支援付きエリア",
    href: "/guide",
    icon: "🌿",
    color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
  },
];

// --- 価格導線 ---
const PRICE_LINKS = [
  { label: "0円物件", href: "/search?maxPrice=0", accent: "text-red-600 bg-red-50 border-red-200" },
  { label: "100万円以下", href: "/search?maxPrice=1000000", accent: "text-orange-700 bg-orange-50 border-orange-200" },
  { label: "300万円以下", href: "/search?maxPrice=3000000", accent: "text-amber-700 bg-amber-50 border-amber-200" },
  { label: "500万円以下", href: "/search?maxPrice=5000000", accent: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { label: "1000万円以下", href: "/search?maxPrice=10000000", accent: "text-green-700 bg-green-50 border-green-200" },
];

// --- 特集 ---
const FEATURES = [
  { title: "0円物件特集", description: "無償譲渡の物件をまとめて紹介", href: "/search?maxPrice=0" },
  { title: "100万円以下の土地", description: "超格安の土地をピックアップ", href: "/search?maxPrice=1000000" },
  { title: "古民家特集", description: "歴史ある古民家を再生しよう", href: "/akiya" },
  { title: "補助金が使えるエリア", description: "移住補助金の対象地域を一覧", href: "/subsidy" },
];

// --- ガイド ---
const GUIDES = [
  { title: "移住補助金まとめ", href: "/guide" },
  { title: "空き家の買い方", href: "/guide" },
  { title: "格安土地の注意点", href: "/guide" },
  { title: "固定資産税の目安", href: "/guide" },
  { title: "田舎暮らしの生活費", href: "/guide" },
];

export default function Home() {
  const newListings = [...listings]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  const popularListings = [...listings]
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);

  return (
    <main>
      {/* ① ヒーロー */}
      <section className="mb-12 rounded-2xl bg-gradient-to-br from-green-700 to-green-900 px-6 py-12 text-center text-white sm:py-16">
        <p className="text-sm font-medium text-green-200">掘り出し物件ラボ</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          格安で土地・物件・賃貸を見つける
        </h1>
        <p className="mt-3 text-lg text-green-100">
          0円物件 / 空き家 / 格安賃貸 / 地方移住 — 全国のポータルを横断検索
        </p>

        {/* 検索UI */}
        <form
          action="/search"
          method="get"
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <select
            name="prefecture"
            className="flex-1 rounded-lg border-0 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-400"
          >
            <option value="">エリアを選ぶ</option>
            {prefectures.map((p) => (
              <option key={p.slug} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="maxPrice"
            className="flex-1 rounded-lg border-0 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-400"
          >
            <option value="">価格を選ぶ</option>
            <option value="0">0円</option>
            <option value="1000000">100万円以下</option>
            <option value="3000000">300万円以下</option>
            <option value="5000000">500万円以下</option>
            <option value="10000000">1000万円以下</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-white px-8 py-3 text-sm font-bold text-green-800 transition hover:bg-green-50"
          >
            検索する
          </button>
        </form>
      </section>

      {/* ② カテゴリ導線 */}
      <section className="mb-12">
        <SectionTitle>物件カテゴリから探す</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`rounded-xl border p-4 text-center transition ${cat.color}`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <h3 className="mt-2 text-sm font-bold text-gray-900">
                {cat.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ③ 価格検索 */}
      <section className="mb-12">
        <SectionTitle>価格から探す</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PRICE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl border px-4 py-4 text-center font-bold transition hover:shadow-md ${link.accent}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ④ エリア検索 */}
      <section className="mb-12">
        <SectionTitle>エリアから探す</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {regions.map((region) => (
            <div key={region.slug} className="rounded-xl border border-gray-200 p-4">
              <h3 className="mb-2 font-bold text-gray-900">{region.name}</h3>
              <div className="flex flex-wrap gap-1">
                {region.prefectures.map((prefSlug) => {
                  const pref = prefectures.find((p) => p.slug === prefSlug);
                  if (!pref) return null;
                  return (
                    <Link
                      key={prefSlug}
                      href={`/search?prefecture=${pref.name}`}
                      className="text-xs text-green-700 hover:underline"
                    >
                      {pref.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⑤ 特集コンテンツ */}
      <section className="mb-12">
        <SectionTitle>特集</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feat) => (
            <Link
              key={feat.title}
              href={feat.href}
              className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-md"
            >
              <h3 className="font-bold text-gray-900">{feat.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{feat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ⑥ 移住ガイド */}
      <section className="mb-12">
        <SectionTitle>移住ガイド</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {GUIDES.map((guide) => (
            <Link
              key={guide.title}
              href={guide.href}
              className="rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              {guide.title}
            </Link>
          ))}
        </div>
      </section>

      {/* ⑦ 新着物件 */}
      <section className="mb-12">
        <SectionTitle>新着物件</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {newListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/listings" className="text-sm text-green-700 hover:underline">
            すべての物件を見る →
          </Link>
        </div>
      </section>

      {/* ⑧ 人気物件 */}
      <section className="mb-12">
        <SectionTitle>人気物件</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {popularListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ⑨ 相談CTA */}
      <section className="mb-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">格安物件探しをお手伝いします</h2>
        <p className="mt-2 text-blue-100">
          ご希望の条件をお聞かせください。専門スタッフが無料でお探しします。
        </p>
        <Link
          href="/consult"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
        >
          無料相談はこちら
        </Link>
      </section>

      {/* ⑩ メディア記事 */}
      <section className="mb-4">
        <SectionTitle>お役立ち記事</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "空き家投資の始め方", href: "/guide" },
            { title: "格安土地を買うときの注意点", href: "/guide" },
            { title: "DIYリノベで理想の暮らし", href: "/guide" },
            { title: "地方移住で使える補助金まとめ", href: "/guide" },
          ].map((article) => (
            <Link
              key={article.title}
              href={article.href}
              className="rounded-lg border border-gray-200 p-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {article.title} →
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
