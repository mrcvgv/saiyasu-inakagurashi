import type { Metadata } from "next";
import { subsidies } from "@/data/subsidies";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "移住補助金情報",
  description:
    "全国の自治体が提供する移住補助金・支援制度の情報をまとめて掲載。移住を検討中の方に。",
};

export default function SubsidyPage() {
  const grouped = subsidies.reduce<Record<string, typeof subsidies>>(
    (acc, s) => {
      if (!acc[s.prefecture]) acc[s.prefecture] = [];
      acc[s.prefecture].push(s);
      return acc;
    },
    {}
  );

  const prefectures = Object.keys(grouped).sort();

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">移住補助金情報</h1>
      <p className="mb-8 text-sm text-gray-500">
        各自治体が提供する移住支援制度・補助金の情報をまとめています
      </p>

      {prefectures.map((pref) => (
        <section key={pref} className="mb-10">
          <SectionTitle>{pref}</SectionTitle>
          <div className="space-y-4">
            {grouped[pref].map((subsidy) => (
              <div
                key={subsidy.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <h3 className="font-semibold text-gray-900">
                  {subsidy.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {subsidy.city}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  {subsidy.summary}
                </p>
                {subsidy.amount && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-green-700">
                      支給額: {subsidy.amount}
                    </span>
                  </p>
                )}
                {subsidy.conditions && (
                  <p className="mt-1 text-sm text-gray-500">
                    条件: {subsidy.conditions}
                  </p>
                )}
                <div className="mt-3">
                  <a
                    href={subsidy.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 hover:underline"
                  >
                    詳細を見る（外部サイト） →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h3 className="font-semibold text-blue-800">ご注意</h3>
        <p className="mt-1 text-sm text-blue-700">
          補助金情報は各自治体の公開情報に基づいています。
          申請条件・金額・受付期間は変更される場合がありますので、
          必ず各自治体の公式サイトで最新情報をご確認ください。
        </p>
      </div>
    </main>
  );
}
