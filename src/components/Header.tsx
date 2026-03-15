import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-green-700">
          最安田舎暮らし
        </Link>
        <nav className="hidden gap-5 text-sm sm:flex">
          <Link href="/cheap-land" className="hover:text-green-700">
            格安土地
          </Link>
          <Link href="/akiya" className="hover:text-green-700">
            空き家
          </Link>
          <Link href="/cheap-rent" className="hover:text-green-700">
            格安賃貸
          </Link>
          <Link href="/search" className="hover:text-green-700">
            検索
          </Link>
          <Link href="/guide" className="hover:text-green-700">
            移住ガイド
          </Link>
          <Link
            href="/consult"
            className="rounded bg-green-700 px-3 py-1 text-white hover:bg-green-800"
          >
            無料相談
          </Link>
        </nav>
      </div>
    </header>
  );
}
