"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OnboardingSlides } from "@/components/onboarding/OnboardingSlides";
import {
  ProfileFields,
  type ProfileFieldsValue,
} from "@/components/onboarding/ProfileFields";
import { getProfile, saveProfile } from "@/lib/db/repo";
import { t } from "@/lib/i18n";

type Step = "slides" | "form" | "done";

/** 金のオーナメント(見出しの飾り罫・装飾専用)。 */
function GoldOrnament() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-2">
      <span className="block h-px w-12 bg-linear-to-r from-transparent to-gold-soft" />
      <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
      <span className="block h-px w-12 bg-linear-to-l from-transparent to-gold-soft" />
    </div>
  );
}

/**
 * オンボーディング(§4.1)。初回のみ表示(プロフィール既存なら / へ)。
 * 3枚スライド → 任意入力フォーム → 完了(測定への導線)。下部ナビは自動非表示。
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("slides");
  const [fields, setFields] = useState<ProfileFieldsValue>({
    ageBand: "",
  });
  const [saving, setSaving] = useState(false);

  // 初回のみ: 既にプロフィールがあればホームへ(IndexedDBはマウント後にのみ触る)
  useEffect(() => {
    let cancelled = false;
    getProfile().then((p) => {
      if (!cancelled && p) router.replace("/");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const complete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile({
        ageBand: fields.ageBand === "" ? undefined : fields.ageBand,
      });
      setStep("done");
    } finally {
      setSaving(false);
    }
  };

  if (step === "slides") {
    return (
      <main className="flex-1 flex flex-col">
        <OnboardingSlides onFinish={() => setStep("form")} />
      </main>
    );
  }

  if (step === "form") {
    return (
      <main className="flex-1 flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{t("onboarding.form.title")}</h1>
          <GoldOrnament />
          <p className="text-sm text-ink-mute leading-relaxed">
            {t("onboarding.form.lead")}
          </p>
        </div>
        <div className="bg-surface-2 rounded-3xl border border-hairline shadow-md p-5">
          <ProfileFields value={fields} onChange={setFields} />
        </div>
        <div className="mt-auto">
          <button
            type="button"
            onClick={complete}
            disabled={saving}
            className="w-full h-12 rounded-full bg-linear-to-b from-primary to-primary-deep text-primary-ink font-bold text-base shadow-lg ring-1 ring-gold-soft active:translate-y-0.5 active:shadow-md disabled:opacity-50"
          >
            {t("onboarding.form.submit")}
          </button>
        </div>
      </main>
    );
  }

  // step === "done"
  return (
    <main className="relative flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 text-center overflow-hidden">
      {/* 背景の淡い光彩(青と金・装飾) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -right-20 -top-12 h-64 w-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(42,120,214,0.10) 0%, rgba(42,120,214,0) 70%)",
          }}
        />
        <div
          className="absolute -left-24 bottom-1/4 h-64 w-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(184,145,47,0.09) 0%, rgba(184,145,47,0) 70%)",
          }}
        />
      </div>
      {/* 2人が歓迎してくれる(装飾画像・背景がほぼ純白のため白面に直置きして抜き出し感を出す) */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-8 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(42,120,214,0.10) 0%, rgba(42,120,214,0) 70%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/duo-hero.webp"
          alt=""
          aria-hidden
          width={800}
          height={597}
          className="relative w-64 h-auto"
        />
      </div>
      <h1 className="relative text-2xl font-bold">
        {t("onboarding.done.title")}
      </h1>
      <GoldOrnament />
      <p className="relative text-sm text-ink-2 leading-relaxed">
        {t("onboarding.done.body")}
      </p>
      <div className="relative w-full flex flex-col gap-2 mt-4">
        <Link
          href="/measure/"
          className="w-full h-12 rounded-full bg-linear-to-b from-primary to-primary-deep text-primary-ink font-bold text-base flex items-center justify-center gap-2 shadow-lg ring-1 ring-gold-soft active:translate-y-0.5 active:shadow-md"
        >
          {t("onboarding.done.cta")}
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/"
          className="w-full h-11 rounded-full text-sm text-ink-mute flex items-center justify-center active:opacity-80"
        >
          {t("onboarding.done.later")}
        </Link>
      </div>
    </main>
  );
}
