import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

const CATEGORIES = [
  {
    title: "物件検索",
    description: "条件を指定して物件を探す",
    href: "/search",
    color: "bg-green-50 border-green-200",
  },
  {
    title: "激安物件",
    description: "0円〜1000万円の格安物件",
    href: "/cheap",
    color: "bg-orange-50 border-orange-200",
  },
  {
    title: "移住補助金",
    description: "自治体の移住支援制度を探す",
    href: "/subsidy",
    color: "bg-blue-50 border-blue-200",
  },
];

const PRICE_LINKS = [
  { label: "0円物件", href: "/search?minPrice=0&maxPrice=0" },
  { label: "〜50万円", href: "/search?maxPrice=500000" },
  { label: "50万〜100万円", href: "/search?minPrice=500000&maxPrice=1000000" },
  { label: "100万〜500万円", href: "/search?minPrice=1000000&maxPrice=5000000" },
  { label: "500万〜1000万円", href: "/search?minPrice=5000000&maxPrice=10000000" },
];

const REGION_LINKS = [
  { label: "北海道", href: "/search?prefecture=北海道" },
  { label: "千葉県", href: "/search?prefecture=千葉県" },
  { label: "長野県", href: "/search?prefecture=長野県" },
  { label: "高知県", href: "/search?prefecture=高知県" },
  { label: "大分県", href: "/search?prefecture=大分県" },
];

export default function Home() {
  const newListings = [...listings]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  return (
    <main>
      {/* ヒーローセクション */}
      <section className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-green-800 sm:text-4xl">
          最安田舎暮らし
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          全国の0円〜1000万円の物件を探せるポータルサイト
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-lg bg-green-700 px-8 py-3 text-sm font-semibold text-white hover:bg-green-800 transition"
        >
          物件を検索する
        </Link>
      </section>

      {/* カテゴリカード */}
      <section className="mb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`rounded-lg border p-6 transition hover:shadow-md ${cat.color}`}
            >
              <h2 className="text-lg font-bold text-gray-900">{cat.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 新着物件 */}
      <section className="mb-12">
        <SectionTitle>新着物件</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {newListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/listings"
            className="text-sm text-green-700 hover:underline"
          >
            すべての物件を見る →
          </Link>
        </div>
      </section>

      {/* 価格帯別 */}
      <section className="mb-12">
        <SectionTitle>価格帯から探す</SectionTitle>
        <div className="flex flex-wrap gap-3">
          {PRICE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 hover:bg-green-100 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 地域別 */}
      <section className="mb-12">
        <SectionTitle>地域から探す</SectionTitle>
        <div className="flex flex-wrap gap-3">
          {REGION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
