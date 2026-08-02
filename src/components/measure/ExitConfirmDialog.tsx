"use client";

import { t } from "@/lib/i18n";
import { useDialogFocus } from "@/lib/ui/useDialogFocus";

/** 測定中断の確認ダイアログ(§4.3)。中断時は何も保存しない。 */

interface ExitConfirmDialogProps {
  onContinue: () => void;
  onQuit: () => void;
}

export function ExitConfirmDialog({
  onContinue,
  onQuit,
}: ExitConfirmDialogProps) {
  const dialogRef = useDialogFocus(onContinue);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="alertdialog"
      aria-modal="true"
      aria-label={t("measure.exitConfirm.title")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-6"
    >
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">
          {t("measure.exitConfirm.title")}
        </h2>
        <p className="text-sm text-ink-2">{t("measure.exitConfirm.body")}</p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onContinue}
            className="relative overflow-hidden w-full py-3 rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-primary-ink font-bold shadow-lg shadow-primary/30 ring-1 ring-white/60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
            />
            {t("measure.exitConfirm.continue")}
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="w-full py-3 rounded-full border-2 border-primary/70 bg-white/70 backdrop-blur-sm text-primary-deep font-bold"
          >
            {t("measure.exitConfirm.quit")}
          </button>
        </div>
      </div>
    </div>
  );
}
