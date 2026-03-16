import Link from "next/link";
import { Listing } from "@/types/listing";
import { formatPrice, formatArea } from "@/lib/format";

type Props = {
  listing: Listing;
};

export default function ListingCard({ listing }: Props) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {listing.imageUrl && listing.imageUrl !== "/images/placeholder.jpg" && !listing.imageUrl.includes("print.gif") && !listing.imageUrl.includes("/icon") ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-sm text-gray-400">No Image</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {listing.title}
          </h3>
          <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-sm font-bold text-green-800">
            {formatPrice(listing.price)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {listing.prefecture} {listing.city}
        </p>
        <div className="mt-2 flex gap-3 text-xs text-gray-500">
          {listing.landArea && <span>土地 {formatArea(listing.landArea)}</span>}
          {listing.buildingArea && (
            <span>建物 {listing.buildingArea}㎡</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {listing.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
