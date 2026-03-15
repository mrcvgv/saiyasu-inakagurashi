import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "掘り出し物件ラボ — 格安で土地・物件・賃貸を見つける研究所",
    template: "%s | 掘り出し物件ラボ",
  },
  description:
    "格安で土地・物件・賃貸を見つける研究所。0円〜1000万円の掘り出し物件を全国のポータルから横断検索。空き家バンク・移住補助金情報も。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
