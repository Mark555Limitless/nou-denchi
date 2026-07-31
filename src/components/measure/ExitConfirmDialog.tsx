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
      <div className="w-full max-w-sm bg-surface-2 rounded-3xl border border-hairline shadow-lg p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">
          {t("measure.exitConfirm.title")}
        </h2>
        <p className="text-sm text-ink-2">{t("measure.exitConfirm.body")}</p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3 rounded-full bg-linear-to-b from-primary to-primary-deep text-primary-ink font-bold shadow-lg ring-1 ring-gold-soft"
          >
            {t("measure.exitConfirm.continue")}
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="w-full py-3 rounded-full bg-surface-2 border border-hairline shadow-md text-ink-mute"
          >
            {t("measure.exitConfirm.quit")}
          </button>
        </div>
      </div>
    </div>
  );
}
