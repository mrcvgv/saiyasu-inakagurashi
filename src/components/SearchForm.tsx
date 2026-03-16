"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { prefectures } from "@/data/prefectures";

const PRICE_RANGES = [
  { label: "指定なし", min: "", max: "" },
  { label: "0円（無償）", min: "0", max: "0" },
  { label: "〜50万円", min: "", max: "500000" },
  { label: "50万〜100万円", min: "500000", max: "1000000" },
  { label: "100万〜300万円", min: "1000000", max: "3000000" },
  { label: "300万〜500万円", min: "3000000", max: "5000000" },
  { label: "500万〜1000万円", min: "5000000", max: "10000000" },
];

type Props = {
  defaultKeyword?: string;
  defaultPrefecture?: string;
  defaultPriceRange?: string;
};

export default function SearchForm({
  defaultKeyword = "",
  defaultPrefecture = "",
  defaultPriceRange = "指定なし",
}: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [prefecture, setPrefecture] = useState(defaultPrefecture);
  const [priceRange, setPriceRange] = useState(defaultPriceRange);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (prefecture) params.set("prefecture", prefecture);
    const range = PRICE_RANGES.find((r) => r.label === priceRange);
    if (range) {
      if (range.min) params.set("minPrice", range.min);
      if (range.max) params.set("maxPrice", range.max);
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          キーワード
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="古民家、海近、DIY…"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            都道府県
          </label>
          <select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            <option value="">すべて</option>
            {prefectures.map((p) => (
              <option key={p.slug} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            価格帯
          </label>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {PRICE_RANGES.map((r) => (
              <option key={r.label} value={r.label}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition"
      >
        検索する
      </button>
    </form>
  );
}
