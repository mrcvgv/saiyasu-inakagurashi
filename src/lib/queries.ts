import { supabase } from "./supabase";

export async function getListings(options?: {
  prefecture?: string;
  maxPrice?: number;
  minPrice?: number;
  listingType?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (options?.prefecture) {
    query = query.eq("prefecture_name", options.prefecture);
  }
  if (options?.minPrice !== undefined) {
    query = query.gte("price", options.minPrice);
  }
  if (options?.maxPrice !== undefined) {
    query = query.lte("price", options.maxPrice);
  }
  if (options?.listingType) {
    query = query.eq("listing_type", options.listingType);
  }
  if (options?.keyword) {
    query = query.or(
      `title.ilike.%${options.keyword}%,description.ilike.%${options.keyword}%,city.ilike.%${options.keyword}%`
    );
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getListings error:", error);
    return [];
  }
  return data || [];
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getListingCount() {
  const { count, error } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) return 0;
  return count || 0;
}

export async function getSubsidies(prefectureCode?: string) {
  let query = supabase
    .from("subsidies")
    .select("*")
    .eq("is_active", true)
    .order("prefecture_code");

  if (prefectureCode) {
    query = query.eq("prefecture_code", prefectureCode);
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function getPrefectures() {
  const { data, error } = await supabase
    .from("prefectures")
    .select("*")
    .order("code");

  if (error) return [];
  return data || [];
}
