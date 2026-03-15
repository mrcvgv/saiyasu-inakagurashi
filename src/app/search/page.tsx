import type { Metadata } from "next";
import { allListings as listings } from "@/data/listings-loader";
import { filterListings } from "@/lib/filters";
import ListingCard from "@/components/ListingCard";
import SearchForm from "@/components/SearchForm";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "物件検索",
  description:
    "価格帯・地域・キーワードで全国の格安田舎物件を検索。0円物件から100万円以下の物件まで。",
};

type Props = {
  searchParams: Promise<{
    keyword?: string;
    prefecture?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasSearch = params.keyword || params.prefecture || params.minPrice || params.maxPrice;

  const results = hasSearch
    ? filterListings(listings, {
        keyword: params.keyword,
        prefecture: params.prefecture,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      })
    : [];

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">物件検索</h1>

      <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <SearchForm
          defaultKeyword={params.keyword}
          defaultPrefecture={params.prefecture}
        />
      </div>

      {hasSearch && (
        <section>
          <SectionTitle>
            検索結果（{results.length}件）
          </SectionTitle>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              条件に一致する物件が見つかりませんでした。条件を変えてお試しください。
            </p>
          )}
        </section>
      )}
    </main>
  );
}
