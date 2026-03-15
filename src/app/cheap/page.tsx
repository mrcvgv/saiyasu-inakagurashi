import type { Metadata } from "next";
import Link from "next/link";
import { listings } from "@/data/listings";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "激安物件 — 0円〜100万円",
  description:
    "0円（無償譲渡）〜100万円以下の超格安田舎物件を特集。空き家バンクの激安物件をまとめて掲載。",
};

export default function CheapPage() {
  const freeListings = listings.filter((l) => l.price === 0);
  const under50 = listings.filter((l) => l.price > 0 && l.price <= 500000);
  const under100 = listings.filter(
    (l) => l.price > 500000 && l.price <= 1000000
  );

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">激安物件特集</h1>
      <p className="mb-8 text-sm text-gray-500">
        0円〜100万円以下の超低価格物件をまとめて掲載しています
      </p>

      {/* 0円物件 */}
      <section className="mb-12">
        <SectionTitle>0円（無償譲渡）物件</SectionTitle>
        {freeListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {freeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">現在、0円物件はありません</p>
        )}
      </section>

      {/* 〜50万円 */}
      <section className="mb-12">
        <SectionTitle>〜50万円の物件</SectionTitle>
        {under50.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {under50.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            現在、この価格帯の物件はありません
          </p>
        )}
      </section>

      {/* 50万〜100万円 */}
      <section className="mb-12">
        <SectionTitle>50万〜100万円の物件</SectionTitle>
        {under100.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {under100.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            現在、この価格帯の物件はありません
          </p>
        )}
      </section>

      <div className="text-center">
        <Link
          href="/search"
          className="inline-block rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 transition"
        >
          条件を指定して検索する
        </Link>
      </div>
    </main>
  );
}
