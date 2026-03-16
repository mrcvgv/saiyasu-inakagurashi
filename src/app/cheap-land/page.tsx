import type { Metadata } from "next";
import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "格安土地 — 0円〜1000万円の土地・物件",
  description:
    "0円〜1000万円の格安土地・物件を特集。田舎暮らし・移住向けの安い土地を全国から探せます。",
};

export default function CheapLandPage() {
  const cheapListings = listings
    .filter((l) => l.price <= 10000000)
    .sort((a, b) => a.price - b.price);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">格安土地</h1>
      <p className="mb-8 text-sm text-gray-500">
        0円〜1000万円の土地・物件をまとめて掲載しています（{cheapListings.length}件）
      </p>

      {cheapListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cheapListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">
          現在、該当する物件はありません
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
