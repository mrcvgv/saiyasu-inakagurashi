import { Listing } from "@/types/listing";

export type SortKey = "newest" | "price-asc" | "price-desc" | "land-desc" | "building-desc";

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const sorted = [...listings];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "land-desc":
      return sorted.sort((a, b) => (b.landArea || 0) - (a.landArea || 0));
    case "building-desc":
      return sorted.sort((a, b) => (b.buildingArea || 0) - (a.buildingArea || 0));
    case "newest":
    default:
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export function filterContracted(listings: Listing[], hide: boolean): Listing[] {
  if (!hide) return listings;
  return listings.filter((l) => l.status !== "contracted");
}
