import type { Metadata } from "next";
import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";

export const metadata: Metadata = {
  title: "格安賃貸 — 月6万円以下の賃貸物件",
  description:
    "月額6万円以下の格安賃貸物件を全国から検索。田舎暮らし・地方移住に最適な安い賃貸。",
};

export default function CheapRentPage() {
  const rentListings = listings
    .filter((l) => l.tags.some((t) => t.includes("賃貸")))
    .sort((a, b) => a.price - b.price);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">格安賃貸</h1>
      <p className="mb-8 text-sm text-gray-500">
        月6万円以下の格安賃貸物件（{rentListings.length}件）
      </p>

      {rentListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rentListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">
          現在、格安賃貸物件はありません。順次追加中です。
        </p>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/search"
          className="inline-block rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          条件を指定して検索する
        </Link>
      </div>
    </main>
  );
}
