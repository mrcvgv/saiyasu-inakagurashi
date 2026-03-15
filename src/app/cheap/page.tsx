import type { Metadata } from "next";
import Link from "next/link";
import { listings } from "@/data/listings";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "激安物件 — 0円〜1000万円",
  description:
    "0円（無償譲渡）〜1000万円以下の格安田舎物件を特集。空き家バンクの激安物件をまとめて掲載。",
};

export default function CheapPage() {
  const freeListings = listings.filter((l) => l.price === 0);
  const under50 = listings.filter((l) => l.price > 0 && l.price <= 500000);
  const under100 = listings.filter(
    (l) => l.price > 500000 && l.price <= 1000000
  );
  const under500 = listings.filter(
    (l) => l.price > 1000000 && l.price <= 5000000
  );
  const under1000 = listings.filter(
    (l) => l.price > 5000000 && l.price <= 10000000
  );

  const sections = [
    { title: "0円（無償譲渡）物件", items: freeListings },
    { title: "〜50万円の物件", items: under50 },
    { title: "50万〜100万円の物件", items: under100 },
    { title: "100万〜500万円の物件", items: under500 },
    { title: "500万〜1000万円の物件", items: under1000 },
  ];

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">激安物件特集</h1>
      <p className="mb-8 text-sm text-gray-500">
        0円〜1000万円以下の格安物件をまとめて掲載しています
      </p>

      {sections.map((section) => (
        <section key={section.title} className="mb-12">
          <SectionTitle>{section.title}</SectionTitle>
          {section.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              現在、この価格帯の物件はありません
            </p>
          )}
        </section>
      ))}

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
