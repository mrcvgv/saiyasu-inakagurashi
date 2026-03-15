"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const PRICE_RANGES = [
  { label: "指定なし", min: "", max: "" },
  { label: "0円（無償）", min: "0", max: "0" },
  { label: "〜50万円", min: "", max: "500000" },
  { label: "50万〜100万円", min: "500000", max: "1000000" },
  { label: "100万〜300万円", min: "1000000", max: "3000000" },
  { label: "300万円〜", min: "3000000", max: "" },
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
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
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
