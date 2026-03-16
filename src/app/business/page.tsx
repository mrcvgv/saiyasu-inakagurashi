import type { Metadata } from "next";
import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";

export const metadata: Metadata = {
  title: "事業用物件 — 倉庫付き・店舗可・広い土地",
  description:
    "事業用に使える物件を全国から検索。倉庫付き・店舗可・広い土地の物件情報。",
};

export default function BusinessPage() {
  const businessListings = listings
    .filter(
      (l) =>
        l.tags.some((t) => t.includes("倉庫") || t.includes("店舗") || t.includes("事業")) ||
        (l.landArea && l.landArea >= 500)
    )
    .sort((a, b) => a.price - b.price);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">事業用物件</h1>
      <p className="mb-8 text-sm text-gray-500">
        倉庫付き・店舗可・広い土地の物件（{businessListings.length}件）
      </p>

      {businessListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {businessListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">
          現在、該当する物件はありません。順次追加中です。
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
