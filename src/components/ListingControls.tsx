"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  basePath: string;
  totalCount: number;
  activeCount: number;
};

export default function ListingControls({ basePath, totalCount, activeCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") || "newest";
  const hideContracted = searchParams.get("hideContracted") === "1";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        {hideContracted ? activeCount : totalCount}件表示
        {hideContracted && totalCount > activeCount && (
          <span className="ml-1 text-gray-400">
            （成約済み{totalCount - activeCount}件を非表示）
          </span>
        )}
      </p>
      <div className="flex gap-3">
        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="newest">新着順</option>
          <option value="price-asc">価格が安い順</option>
          <option value="price-desc">価格が高い順</option>
          <option value="land-desc">土地が広い順</option>
          <option value="building-desc">建物が広い順</option>
        </select>

        {/* Hide contracted toggle */}
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={hideContracted}
            onChange={(e) => updateParams("hideContracted", e.target.checked ? "1" : "")}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          成約済みを除外
        </label>
      </div>
    </div>
  );
}
