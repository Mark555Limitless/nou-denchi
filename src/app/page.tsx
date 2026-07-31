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

/** リッチテーマの背景装飾: 淡い青と金の光のグラデーション(mock-rich-home 準拠)。 */
function RichBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* ヘッダーのロゴ画像(白背景焼き込み)と重ならないよう、装飾はロゴ領域より下に置く */}
      <div
        className="absolute -right-24 top-48 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(42,120,214,0.10) 0%, rgba(42,120,214,0) 70%)",
        }}
      />
      <div
        className="absolute -left-24 top-1/3 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,145,47,0.09) 0%, rgba(184,145,47,0) 70%)",
        }}
      />
      <div
        className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(93,163,239,0.10) 0%, rgba(93,163,239,0) 70%)",
        }}
      />
    </div>
  );
}

function HomeHeader() {
  return (
    <header className="relative flex flex-col items-center pb-2 pt-6 text-center">
      {/* ロゴ&キャッチコピー(Nano Banana Pro で背景を除去した抽出版・純白背景) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("/brand/logo-clean.png")}
        alt={`${t("app.name")} — ${t("app.tagline")}`}
        width={900}
        height={655}
        className="mx-auto h-36 w-auto"
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
        <RichBackdrop />
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

  const { todaySession: today } = home;
  const rawPercent = today?.percent ?? 0;
  const display = today ? displayPercent(rawPercent) : undefined;
  const zone = today ? zoneOf(rawPercent) : undefined;
  const provisional = today?.baselineType === "provisional";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-5 pb-6">
      <RichBackdrop />
      <HomeHeader />

      <section className="relative flex flex-1 flex-col items-center justify-center gap-4 py-4">
        {today && (
          <p className="text-sm text-ink-2">
            {t("percent.label", { time: timeLabel(today.startedAt) })}
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
              className={`shrink-0 rounded-full border bg-surface-2 px-3.5 py-1 text-sm font-bold shadow-sm ${zoneClasses[zone].text} ${zoneClasses[zone].border}`}
            >
              {t(`zone.${zone}.label`)}
            </span>
            <span className="text-sm text-ink-2">
              {t(`zone.${zone}.message`)}
            </span>
          </div>
        )}

        {today?.baselineType === "personalTimeBand" && (
          <p className="text-center text-xs text-ink-mute">
            {t("percent.timeBandNote")}
          </p>
        )}
        {today?.baselineType === "personal" && (
          <p className="text-center text-xs text-ink-mute">
            {t("percent.globalNote")}
          </p>
        )}
      </section>

      {/* 測定済みでも再測定できるよう常時表示(漆黒地に白文字) */}
      <Link
        href="/measure/"
        className="relative flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-b from-primary to-primary-deep py-4 text-center text-lg font-bold text-primary-ink shadow-lg ring-1 ring-gold-soft active:translate-y-0.5 active:shadow-md"
      >
        {t("common.measure")}
        <span aria-hidden>→</span>
      </Link>

      <ProvisionalModal
        open={showProvisional}
        onClose={() => setShowProvisional(false)}
      />
    </div>
  );
}
