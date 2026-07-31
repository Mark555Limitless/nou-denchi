"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";

const items = [
  { href: "/", key: "nav.home", icon: "⌂" },
  { href: "/history", key: "nav.history", icon: "◷" },
  { href: "/settings", key: "nav.settings", icon: "⚙" },
] as const;

/** 下部ナビ。測定中・オンボーディング・ゲーム中は没入のため非表示(§4.3)。 */
export function BottomNav() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/measure") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/boost") ||
    pathname.startsWith("/relax")
  ) {
    return null;
  }
  return (
    <nav
      className="fixed bottom-0 inset-x-0 border-t border-hairline bg-surface-2/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex" style={{ maxWidth: "var(--app-max-w)" }}>
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                active ? "text-ink" : "text-ink-mute"
              }`}
            >
              <span aria-hidden className="text-lg leading-none">
                {item.icon}
              </span>
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
