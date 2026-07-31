"use client";

import { usePathname } from "next/navigation";

/**
 * ページコンテンツの共通フレーム。
 * 下部ナビの高さぶんの余白(pb-20)は、ナビを表示しない測定中・
 * オンボーディングでは外す(PVTの全画面タップ判定を妨げないため)。
 */
export function ContentFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive =
    pathname.startsWith("/measure") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/boost") ||
    pathname.startsWith("/relax");
  return (
    <div
      className={`mx-auto w-full flex-1 flex flex-col ${
        immersive ? "" : "pb-20"
      }`}
      style={{ maxWidth: "var(--app-max-w)" }}
    >
      {children}
    </div>
  );
}
