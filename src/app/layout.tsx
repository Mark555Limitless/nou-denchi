import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ContentFrame } from "@/components/ContentFrame";
import { SWRegister } from "@/components/pwa/SWRegister";
import { t } from "@/lib/i18n";
import { asset } from "@/lib/ui/asset";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t("app.name"),
  description: `${t("app.tagline")} — 1〜2分の認知テストで「今の判断力」を全盛期比で測定するセルフコンディション管理アプリ`,
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: t("app.name"),
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 全画面共通の水面背景(アクア・ガラステーマ)。
            上に薄い白ベールを重ねて文字の可読性を確保する */}
        <div aria-hidden className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${asset("/art/water-bg.webp")})` }}
          />
          <div className="absolute inset-0 bg-white/25" />
        </div>
        <ContentFrame>{children}</ContentFrame>
        <BottomNav />
        <SWRegister />
      </body>
    </html>
  );
}
