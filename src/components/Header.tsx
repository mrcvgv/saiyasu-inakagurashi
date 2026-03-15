import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-green-700">
          最安田舎暮らし
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/search" className="hover:text-green-700">
            物件検索
          </Link>
          <Link href="/listings" className="hover:text-green-700">
            物件一覧
          </Link>
          <Link href="/cheap" className="hover:text-green-700">
            激安物件
          </Link>
          <Link href="/subsidy" className="hover:text-green-700">
            移住補助金
          </Link>
        </nav>
      </div>
    </header>
  );
}
