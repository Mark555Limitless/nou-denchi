"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { displayPercent, zoneOf } from "@/lib/engine/scoring";
import { timeLabel } from "@/lib/ui/format";
import { zoneClasses } from "@/lib/ui/zone";
import { getHomeState, type HomeState } from "@/lib/service/measurement";
import { BatteryGauge } from "@/components/home/BatteryGauge";
import { ProvisionalModal } from "@/components/home/ProvisionalModal";
import { asset } from "@/lib/ui/asset";

/** ホーム画面(§4.2): 今日の判断力%を脳バッテリー残量メタファーで表示する。 */

/** アクアテーマの装飾: 右上の半透明ホログラム脳(Start画面11 準拠)。 */
function AquaDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("/art/holo-brain.webp")}
        alt=""
        className="absolute -right-8 -top-6 w-44 opacity-70"
      />
    </div>
  );
}

function HomeHeader() {
  return (
    <header
      className="relative flex flex-col items-center pb-1 pt-7 text-center"
      // iOSノッチ/Dynamic Island を避ける。env() 非対応環境では pt-7 のまま(2026-08-08)
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.75rem)" }}
    >
      {/* ロゴ&キャッチコピー(白背景を透過キーした版。水面背景に直接載る) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("/brand/logo-alpha.png")}
        alt={`${t("app.name")} — ${t("app.tagline")}`}
        width={900}
        height={672}
        className="mx-auto h-[138px] w-auto"
        style={{ filter: "drop-shadow(0 2px 6px rgba(255,255,255,0.8))" }}
      />
    </header>
  );
}

export default function Home() {
  const router = useRouter();
  const [home, setHome] = useState<HomeState | null>(null);
  const [showProvisional, setShowProvisional] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // IndexedDB アクセスは必ず useEffect 内(ビルド時プリレンダー対策)
    getHomeState().then((state) => {
      if (cancelled) return;
      if (!state.profile) {
        router.replace("/onboarding/");
        return;
      }
      setHome(state);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ロード中(またはオンボーディングへのリダイレクト待ち)はスケルトン
  if (!home) {
    return (
      <div
        className="relative flex flex-1 flex-col overflow-hidden px-5 pb-6"
        aria-busy="true"
      >
        <AquaDecor />
        <HomeHeader />
        <p role="status" className="sr-only">
          {t("home.loading")}
        </p>
        <section className="relative flex flex-1 flex-col items-center justify-center gap-5 py-4">
          <div className="aspect-square w-[70vw] max-w-[300px] animate-pulse rounded-full bg-surface-3" />
          <div className="h-4 w-44 animate-pulse rounded bg-surface-3" />
        </section>
        <div className="relative h-14 w-full animate-pulse rounded-full bg-surface-3" />
      </div>
    );
  }

  const { latestSession: latest } = home;
  const rawPercent = latest?.percent ?? 0;
  const display = latest ? displayPercent(rawPercent) : undefined;
  const zone = latest ? zoneOf(rawPercent) : undefined;
  const provisional = latest?.baselineType === "provisional";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-5 pb-9">
      <AquaDecor />
      <HomeHeader />

      <section className="relative flex flex-1 flex-col items-center justify-center gap-4 py-4">
        {latest && (
          <p className="text-sm text-ink-2">
            {t("percent.label", { time: timeLabel(latest.startedAt) })}
          </p>
        )}

        <BatteryGauge
          value={display?.value}
          rawPercent={rawPercent}
          zone={zone}
          overCap={display?.overCap}
          provisional={provisional}
          onProvisionalTap={() => setShowProvisional(true)}
        />

        {/* ゾーンラベル+メッセージ(色チップに必ず文言を併記) */}
        {zone && (
          <div className="flex items-center justify-center gap-2.5">
            <span
              className={`shrink-0 rounded-full border border-[#c6cdd8] bg-white/85 px-4 py-1 text-sm font-bold shadow-sm backdrop-blur-sm ${zoneClasses[zone].text}`}
            >
              {t(`zone.${zone}.label`)}
            </span>
            <span className="text-sm font-medium text-ink">
              {t(`zone.${zone}.message`)}
            </span>
          </div>
        )}

      </section>

      {/* 測定済みでも再測定できるよう常時表示。
          ボタンは NBP が Start画面11 の「測定する」を文字なしで再現した
          濃青水滴ピル画像(public/art/button-measure.webp)+白文字オーバーレイ */}
      <Link
        href="/measure/"
        className="relative block w-full select-none active:translate-y-0.5"
        style={{ filter: "drop-shadow(0 8px 18px rgba(44,93,168,0.35))" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("/art/button-measure.webp")}
          alt=""
          aria-hidden
          width={848}
          height={160}
          className="h-auto w-full"
        />
        <span
          className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white"
          style={{ textShadow: "0 1px 3px rgba(20,45,90,0.55)" }}
        >
          {t("common.measure")}
        </span>
      </Link>

      <ProvisionalModal
        open={showProvisional}
        onClose={() => setShowProvisional(false)}
      />
    </div>
  );
}
