"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";

/**
 * 下部ナビ(すりガラス)。アイコンは Start画面11.png のフッターを再現した
 * 線画SVG(家・時計・歯車、濃紺)。測定中・オンボーディング・ゲーム中は
 * 没入のため非表示(§4.3)。
 */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
      <path
        fill="currentColor"
        d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
      />
    </svg>
  );
}

function SettingsIcon() {
  // アウトラインの歯車(修正指示05の形状: 線画ボディ+丸い歯8本+中空センター)
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    const x1 = +(12 + 7.1 * Math.cos(a)).toFixed(2);
    const y1 = +(12 + 7.1 * Math.sin(a)).toFixed(2);
    const x2 = +(12 + 9.7 * Math.cos(a)).toFixed(2);
    const y2 = +(12 + 9.7 * Math.sin(a)).toFixed(2);
    return { x1, y1, x2, y2, key: i };
  });
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
      <g stroke="currentColor" fill="none">
        <circle cx="12" cy="12" r="6.9" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="2.9" strokeWidth="1.8" />
        {teeth.map((tt) => (
          <line
            key={tt.key}
            x1={tt.x1}
            y1={tt.y1}
            x2={tt.x2}
            y2={tt.y2}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

const items = [
  { href: "/", key: "nav.home", Icon: HomeIcon },
  { href: "/history", key: "nav.history", Icon: HistoryIcon },
  { href: "/settings", key: "nav.settings", Icon: SettingsIcon },
] as const;

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
      className="fixed bottom-0 inset-x-0 border-t border-white/70 bg-white/55 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex" style={{ maxWidth: "var(--app-max-w)" }}>
        {items.map(({ href, key, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs ${
                active ? "font-bold text-ink" : "text-ink-2"
              }`}
            >
              <Icon />
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
