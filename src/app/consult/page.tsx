import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "無料相談 — 格安物件探しをお手伝い",
  description:
    "格安土地・空き家・低価格賃貸をお探しの方へ。ご希望の条件をお聞かせください。専門スタッフが無料でお探しします。",
};

export default function ConsultPage() {
  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold">無料相談</h1>
      <p className="mb-8 text-sm text-gray-500">
        格安物件探しをお手伝いします。ご希望の条件をお聞かせください。
      </p>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            お問い合わせフォーム
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                お名前
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                type="email"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                探している物件の種類
              </label>
              <select className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none">
                <option>格安土地</option>
                <option>空き家・古民家</option>
                <option>格安賃貸</option>
                <option>事業用物件</option>
                <option>その他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                希望エリア
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="長野県、千葉県など"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                予算
              </label>
              <select className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none">
                <option>0円（無償譲渡）</option>
                <option>100万円以下</option>
                <option>300万円以下</option>
                <option>500万円以下</option>
                <option>1000万円以下</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ご要望・ご質問
              </label>
              <textarea
                rows={4}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="DIYリノベがしたい、畑付きが良い、など"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-green-700 py-3 text-sm font-bold text-white transition hover:bg-green-800"
            >
              無料で相談する
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-400">
            ※ 送信後、担当者よりメールにてご連絡いたします。
          </p>
        </div>
      </div>
    </main>
  );
}
