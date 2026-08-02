"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import {
  ProfileFields,
  type ProfileFieldsValue,
} from "@/components/onboarding/ProfileFields";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { Toast } from "@/components/settings/Toast";
import {
  getProfile,
  resetCalibration,
  updateProfile,
  wipeAllData,
} from "@/lib/db/repo";
import { t } from "@/lib/i18n";

const APP_VERSION = "0.1.0";

/** 危険操作の確認段階: 0=閉 / 1=説明 / 2=最終確認 */
type ConfirmStep = 0 | 1 | 2;

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
 * 設定画面(§4.6)。プロフィール変更・ベースライン説明/再計測・
 * データ全削除・免責事項・アプリ情報。外部リンクは置かない。
 */
export default function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fields, setFields] = useState<ProfileFieldsValue>({
    ageBand: "",
  });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [recalibStep, setRecalibStep] = useState<ConfirmStep>(0);
  const [wipeStep, setWipeStep] = useState<ConfirmStep>(0);

  // IndexedDB はマウント後にのみ触る。プロフィール無しならオンボーディングへ。
  useEffect(() => {
    let cancelled = false;
    getProfile().then((p) => {
      if (cancelled) return;
      if (!p) {
        router.replace("/onboarding/");
        return;
      }
      setFields({
        ageBand: p.ageBand ?? "",
      });
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // トーストの自動消滅
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const saveEdits = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({
        ageBand: fields.ageBand === "" ? undefined : fields.ageBand,
      });
      setToast(t("settings.profile.saved"));
    } finally {
      setSaving(false);
    }
  };

  const doRecalib = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await resetCalibration();
      setRecalibStep(0);
      setToast(t("settings.recalib.done"));
    } finally {
      setBusy(false);
    }
  };

  const doWipe = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await wipeAllData();
      router.replace("/onboarding/");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col gap-4 px-4 py-6">
      <div className="flex flex-col items-center gap-2 pb-1">
        <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        <GoldOrnament />
      </div>

      {!ready ? (
        <p className="text-sm text-ink-mute">{t("settings.loading")}</p>
      ) : (
        <>
          {/* プロフィール変更 */}
          <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5">
            <h2 className="font-bold text-ink mb-4">{t("settings.profile.title")}</h2>
            <ProfileFields value={fields} onChange={setFields} />
            {/* 保存: 水滴をまとった青いガラスのピル */}
            <button
              type="button"
              onClick={saveEdits}
              disabled={saving}
              className="relative overflow-hidden mt-5 w-full h-12 rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-primary-ink font-bold text-base shadow-lg shadow-primary/30 ring-1 ring-white/60 active:translate-y-0.5 active:shadow-md disabled:opacity-50"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
              />
              {t("settings.profile.save")}
            </button>
          </section>

          {/* ベースラインの説明(アコーディオン) */}
          <details className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass">
            <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-3 min-h-12 [&::-webkit-details-marker]:hidden">
              <h2 className="font-bold text-ink">{t("settings.baseline.title")}</h2>
              <span
                aria-hidden
                className="text-primary transition-transform group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <div className="px-5 pb-5 flex flex-col gap-2 text-sm text-ink-2 leading-relaxed">
              <p>{t("settings.baseline.p1")}</p>
              <p>{t("settings.baseline.p2")}</p>
              <p>{t("settings.baseline.p3")}</p>
              <p>{t("settings.baseline.p4")}</p>
            </div>
          </details>

          {/* ベースライン再計測 */}
          <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5">
            <h2 className="font-bold text-ink">{t("settings.recalib.title")}</h2>
            <p className="mt-1 text-sm text-ink-2 leading-relaxed">
              {t("settings.recalib.desc")}
            </p>
            {/* 再計測: アウトラインの白ガラスピル */}
            <button
              type="button"
              onClick={() => setRecalibStep(1)}
              className="mt-3 w-full h-12 rounded-full border-2 border-primary/70 bg-white/70 backdrop-blur-sm text-primary-deep font-bold text-base active:opacity-80"
            >
              {t("settings.recalib.button")}
            </button>
          </section>

          {/* データ全削除 */}
          <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5">
            <h2 className="font-bold text-ink">{t("settings.wipe.title")}</h2>
            <p className="mt-1 text-sm text-ink-2 leading-relaxed">
              {t("settings.wipe.desc")}
            </p>
            {/* 削除: 赤系はそのまま(ガラスの赤いピル) */}
            <button
              type="button"
              onClick={() => setWipeStep(1)}
              className="relative overflow-hidden mt-3 w-full h-12 rounded-full bg-zone-red text-white font-bold text-base shadow-lg shadow-zone-red/30 ring-1 ring-white/60 active:translate-y-0.5 active:shadow-md"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
              />
              {t("settings.wipe.button")}
            </button>
          </section>

          {/* 免責事項(受け入れ基準7) */}
          <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5">
            <h2 className="font-bold text-ink mb-2">{t("settings.disclaimer.title")}</h2>
            <Disclaimer detail />
          </section>

          {/* アプリ情報 */}
          <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5">
            <h2 className="font-bold text-ink mb-2">{t("settings.about.title")}</h2>
            <p className="text-sm text-ink-2">{t("app.name")}</p>
            <p className="text-sm text-ink-2">
              {t("settings.about.version", { version: APP_VERSION })}
            </p>
            <p className="mt-2 text-xs text-ink-2 leading-relaxed">
              {t("settings.about.privacy")}
            </p>
          </section>
        </>
      )}

      {/* ベースライン再計測: ①説明 → ②最終確認 */}
      <ConfirmDialog
        open={recalibStep === 1}
        title={t("settings.recalib.explain.title")}
        body={t("settings.recalib.explain.body")}
        actionLabel={t("common.next")}
        onCancel={() => setRecalibStep(0)}
        onAction={() => setRecalibStep(2)}
      />
      <ConfirmDialog
        open={recalibStep === 2}
        title={t("settings.recalib.confirm.title")}
        body={t("settings.recalib.confirm.body")}
        actionLabel={t("settings.recalib.confirm.action")}
        danger
        busy={busy}
        onCancel={() => setRecalibStep(0)}
        onAction={doRecalib}
      />

      {/* データ全削除: ①説明 → ②最終確認 */}
      <ConfirmDialog
        open={wipeStep === 1}
        title={t("settings.wipe.explain.title")}
        body={t("settings.wipe.explain.body")}
        actionLabel={t("common.next")}
        onCancel={() => setWipeStep(0)}
        onAction={() => setWipeStep(2)}
      />
      <ConfirmDialog
        open={wipeStep === 2}
        title={t("settings.wipe.confirm.title")}
        body={t("settings.wipe.confirm.body")}
        actionLabel={t("settings.wipe.confirm.action")}
        danger
        busy={busy}
        onCancel={() => setWipeStep(0)}
        onAction={doWipe}
      />

      <Toast message={toast} />
    </main>
  );
}
