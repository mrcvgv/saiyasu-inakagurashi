import type { Metadata } from "next";
import Link from "next/link";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";

export const metadata: Metadata = {
  title: "空き家 — 古民家再生・セルフリノベ向け物件",
  description:
    "全国の空き家・古民家をまとめて掲載。DIYリノベーション向けの物件を探せます。",
};

export default function AkiyaPage() {
  const akiyaListings = listings
    .filter((l) => l.isOldHouse || l.tags.some((t) => t.includes("古民家") || t.includes("空き家")))
    .sort((a, b) => a.price - b.price);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">空き家・古民家</h1>
      <p className="mb-8 text-sm text-gray-500">
        古民家再生・セルフリノベーション向けの物件（{akiyaListings.length}件）
      </p>

      {akiyaListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {akiyaListings.map((listing) => (
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
