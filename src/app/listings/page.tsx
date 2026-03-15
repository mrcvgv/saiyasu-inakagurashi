import type { Metadata } from "next";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "物件一覧",
  description:
    "全国の格安田舎物件を一覧表示。0円〜低価格帯の空き家・古民家・農家住宅など。",
};

export default function ListingsPage() {
  const sorted = [...listings].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">物件一覧</h1>
      <p className="mb-6 text-sm text-gray-500">
        全{sorted.length}件の物件を新着順に表示しています
      </p>

      <SectionTitle>すべての物件</SectionTitle>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sorted.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </main>
  );
}
