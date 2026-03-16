import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "移住ガイド — 田舎暮らしの始め方",
  description:
    "地方移住・田舎暮らしの始め方を解説。補助金、空き家の買い方、生活費、注意点など。",
};

const GUIDES = [
  {
    title: "移住補助金まとめ",
    description: "全国の移住補助金・定住支援制度を都道府県別に紹介",
    href: "/subsidy",
  },
  {
    title: "空き家の買い方",
    description: "空き家バンクの使い方、購入手順、注意点を解説",
    href: "/akiya",
  },
  {
    title: "格安土地の注意点",
    description: "激安物件を買うときに確認すべきポイント",
    href: "/cheap-land",
  },
  {
    title: "固定資産税の目安",
    description: "田舎の不動産にかかる税金と維持費のシミュレーション",
    href: "#",
  },
  {
    title: "田舎暮らしの生活費",
    description: "地方移住後の生活費をリアルに試算",
    href: "#",
  },
  {
    title: "DIYリノベの始め方",
    description: "古民家再生・セルフリノベーションの基礎知識",
    href: "/akiya",
  },
];

export default function GuidePage() {
  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">移住ガイド</h1>
      <p className="mb-8 text-sm text-gray-500">
        田舎暮らし・地方移住を検討中の方に役立つ情報をまとめています
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <Link
            key={guide.title}
            href={guide.href}
            className="rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-gray-900">{guide.title}</h2>
            <p className="mt-2 text-sm text-gray-500">{guide.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">移住のご相談はこちら</h2>
        <p className="mt-2 text-blue-100">
          ご希望の条件をお聞かせください。無料でお探しします。
        </p>
        <Link
          href="/consult"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
        >
          無料相談はこちら
        </Link>
      </div>
    </main>
  );
}
