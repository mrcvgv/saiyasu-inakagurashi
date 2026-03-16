import type { Metadata } from "next";
import { Suspense } from "react";
import { allListings as listings } from "@/data/listings-loader";
import ListingCard from "@/components/ListingCard";
import ListingControls from "@/components/ListingControls";
import { sortListings, filterContracted, type SortKey } from "@/lib/sort";

export const metadata: Metadata = {
  title: "物件一覧",
  description:
    "全国の格安田舎物件を一覧表示。0円〜低価格帯の空き家・古民家・農家住宅など。",
};

function ListingsContent({
  searchParams,
}: {
  searchParams: { sort?: string; hideContracted?: string };
}) {
  const sort = (searchParams.sort || "newest") as SortKey;
  const hideContracted = searchParams.hideContracted === "1";

  const activeListings = listings.filter((l) => l.status !== "contracted");
  const filtered = filterContracted(listings, hideContracted);
  const sorted = sortListings(filtered, sort);

  return (
    <>
      <ListingControls
        basePath="/listings"
        totalCount={listings.length}
        activeCount={activeListings.length}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sorted.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; hideContracted?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">物件一覧</h1>
      <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
        <ListingsContent searchParams={params} />
      </Suspense>
    </main>
  );
}
