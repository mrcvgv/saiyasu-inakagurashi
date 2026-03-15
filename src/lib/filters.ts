import { Listing } from "@/types/listing";

export type SearchParams = {
  keyword?: string;
  prefecture?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
};

export function filterListings(
  listings: Listing[],
  params: SearchParams
): Listing[] {
  return listings.filter((listing) => {
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      const searchable = [
        listing.title,
        listing.description,
        listing.prefecture,
        listing.city,
        ...listing.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(kw)) return false;
    }

    if (params.prefecture && listing.prefecture !== params.prefecture) {
      return false;
    }

    if (params.minPrice !== undefined && listing.price < params.minPrice) {
      return false;
    }

    if (params.maxPrice !== undefined && listing.price > params.maxPrice) {
      return false;
    }

    if (params.tags && params.tags.length > 0) {
      const hasTag = params.tags.some((tag) => listing.tags.includes(tag));
      if (!hasTag) return false;
    }

    return true;
  });
}

export function getUniquePrefectures(listings: Listing[]): string[] {
  return [...new Set(listings.map((l) => l.prefecture))].sort();
}
