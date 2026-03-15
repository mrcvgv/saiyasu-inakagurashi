import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h3 className="font-bold text-green-700">最安田舎暮らし</h3>
            <p className="mt-2 text-sm text-gray-600">
              全国の0円〜1000万円の田舎物件を安く買えるポータルサイト
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">物件を探す</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/cheap-land" className="text-gray-600 hover:text-green-700">格安土地</Link></li>
              <li><Link href="/akiya" className="text-gray-600 hover:text-green-700">空き家</Link></li>
              <li><Link href="/cheap-rent" className="text-gray-600 hover:text-green-700">格安賃貸</Link></li>
              <li><Link href="/business" className="text-gray-600 hover:text-green-700">事業用物件</Link></li>
              <li><Link href="/search" className="text-gray-600 hover:text-green-700">検索</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">情報</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/guide" className="text-gray-600 hover:text-green-700">移住ガイド</Link></li>
              <li><Link href="/subsidy" className="text-gray-600 hover:text-green-700">移住補助金</Link></li>
              <li><Link href="/consult" className="text-gray-600 hover:text-green-700">無料相談</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">注意事項</h4>
            <p className="mt-2 text-sm text-gray-600">
              掲載情報は各ポータル・自治体の公開情報に基づいています。
              最新情報は必ず元サイトでご確認ください。
            </p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; 2026 最安田舎暮らし
        </p>
      </div>
    </footer>
  );
}
