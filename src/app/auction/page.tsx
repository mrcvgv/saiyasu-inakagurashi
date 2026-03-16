import type { Metadata } from "next";
import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";

export const metadata: Metadata = {
  title: "競売・公売物件 — 裁判所競売・官公庁オークション",
  description:
    "裁判所競売・公売・差押え物件をまとめて掲載。格安で不動産を取得するチャンス。",
};

export default function AuctionPage() {
  const auctionListings = listings
    .filter((l) => l.tags.some((t) => t.includes("競売") || t.includes("公売") || t.includes("オークション")))
    .sort((a, b) => a.price - b.price);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">競売・公売物件</h1>
      <p className="mb-8 text-sm text-gray-500">
        裁判所競売・官公庁オークション・差押え物件（{auctionListings.length}件）
      </p>

      {auctionListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {auctionListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">
          現在、競売・公売物件はありません。順次追加中です。
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
