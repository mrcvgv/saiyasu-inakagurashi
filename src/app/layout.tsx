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
    default: "最安田舎暮らし — 0円〜1000万円の田舎物件ポータル",
    template: "%s | 最安田舎暮らし",
  },
  description:
    "全国の0円〜1000万円の田舎物件を安く買えるポータルサイト。空き家バンク・自治体情報を集約。移住補助金情報も。",
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
