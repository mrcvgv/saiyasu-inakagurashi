"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/cheap-land", label: "格安土地" },
  { href: "/akiya", label: "空き家" },
  { href: "/cheap-rent", label: "格安賃貸" },
  { href: "/auction", label: "競売・公売" },
  { href: "/search", label: "検索" },
  { href: "/guide", label: "移住ガイド" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-green-700">
          掘り出し物件ラボ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-5 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-green-700">
              {link.label}
            </Link>
          ))}
          <Link
            href="/consult"
            className="rounded bg-green-700 px-3 py-1 text-white hover:bg-green-800"
          >
            無料相談
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="メニューを開く"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-700 hover:text-green-700"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/consult"
              className="rounded bg-green-700 px-3 py-2 text-center text-sm text-white hover:bg-green-800"
              onClick={() => setIsOpen(false)}
            >
              無料相談
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
