import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-bold text-green-700">最安田舎暮らし</h3>
            <p className="mt-2 text-sm text-gray-600">
              全国の0円〜1000万円の田舎物件を安く買えるポータルサイト
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">メニュー</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/search" className="text-gray-600 hover:text-green-700">
                  物件検索
                </Link>
              </li>
              <li>
                <Link href="/listings" className="text-gray-600 hover:text-green-700">
                  物件一覧
                </Link>
              </li>
              <li>
                <Link href="/cheap" className="text-gray-600 hover:text-green-700">
                  激安物件
                </Link>
              </li>
              <li>
                <Link href="/subsidy" className="text-gray-600 hover:text-green-700">
                  移住補助金
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">注意事項</h4>
            <p className="mt-2 text-sm text-gray-600">
              掲載情報は各自治体・空き家バンクの公開情報に基づいています。
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
