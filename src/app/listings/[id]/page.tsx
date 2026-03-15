import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allListings as listings } from "@/data/listings-loader";
import { formatPrice, formatArea, formatDate } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import SectionTitle from "@/components/SectionTitle";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = listings.find((l) => l.id === id);
  if (!listing) return { title: "物件が見つかりません" };
  return {
    title: `${listing.title} — ${formatPrice(listing.price)}`,
    description: listing.description || `${listing.prefecture}${listing.city}の格安物件`,
  };
}

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = listings.find((l) => l.id === id);

  if (!listing) notFound();

  const related = listings
    .filter(
      (l) => l.id !== listing.id && l.prefecture === listing.prefecture
    )
    .slice(0, 2);

  return (
    <main>
      {/* パンくず */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-green-700">
          トップ
        </Link>
        {" > "}
        <Link href="/listings" className="hover:text-green-700">
          物件一覧
        </Link>
        {" > "}
        <span className="text-gray-700">{listing.title}</span>
      </nav>

      <article>
        {/* メイン情報 */}
        <div className="mb-6 rounded-lg border border-gray-200 overflow-hidden">
          <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
            画像プレースホルダー
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {formatPrice(listing.price)}
          </p>
          <p className="mt-1 text-gray-600">
            {listing.prefecture} {listing.city}
            {listing.address && ` ${listing.address}`}
          </p>

          {/* タグ */}
          <div className="mt-3 flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 物件詳細テーブル */}
        <section className="mb-8">
          <SectionTitle>物件情報</SectionTitle>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <th className="w-32 py-3 text-left font-medium text-gray-500">
                  価格
                </th>
                <td className="py-3">{formatPrice(listing.price)}</td>
              </tr>
              <tr>
                <th className="py-3 text-left font-medium text-gray-500">
                  所在地
                </th>
                <td className="py-3">
                  {listing.prefecture} {listing.city}
                </td>
              </tr>
              {listing.landArea && (
                <tr>
                  <th className="py-3 text-left font-medium text-gray-500">
                    土地面積
                  </th>
                  <td className="py-3">{formatArea(listing.landArea)}</td>
                </tr>
              )}
              {listing.buildingArea && (
                <tr>
                  <th className="py-3 text-left font-medium text-gray-500">
                    建物面積
                  </th>
                  <td className="py-3">{formatArea(listing.buildingArea)}</td>
                </tr>
              )}
              {listing.builtYear && (
                <tr>
                  <th className="py-3 text-left font-medium text-gray-500">
                    築年
                  </th>
                  <td className="py-3">{listing.builtYear}年</td>
                </tr>
              )}
              <tr>
                <th className="py-3 text-left font-medium text-gray-500">
                  情報元
                </th>
                <td className="py-3">
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline"
                  >
                    {listing.sourceName}
                  </a>
                </td>
              </tr>
              <tr>
                <th className="py-3 text-left font-medium text-gray-500">
                  更新日
                </th>
                <td className="py-3">{formatDate(listing.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 説明 */}
        {listing.description && (
          <section className="mb-8">
            <SectionTitle>物件説明</SectionTitle>
            <p className="leading-relaxed text-gray-700">
              {listing.description}
            </p>
          </section>
        )}

        {/* 注意事項 */}
        <section className="mb-8 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <h3 className="font-semibold text-yellow-800">ご注意</h3>
          <p className="mt-1 text-sm text-yellow-700">
            掲載情報は各自治体・空き家バンクの公開情報に基づいています。
            最新の情報・詳細条件は必ず元サイトでご確認ください。
            物件の状態や取引条件は変更される場合があります。
          </p>
        </section>

        {/* 関連物件 */}
        {related.length > 0 && (
          <section>
            <SectionTitle>同じ地域の物件</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <ListingCard key={r.id} listing={r} />
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
