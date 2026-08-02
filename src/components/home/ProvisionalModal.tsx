"use client";

import { t } from "@/lib/i18n";
import { useDialogFocus } from "@/lib/ui/useDialogFocus";

/** 「推定」バッジの説明モーダル(§4.2)。暫定ベースラインの意味を説明する。 */
export function ProvisionalModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // フックを開閉で条件分岐させないため、開いている間だけ内側をマウントする
  if (!open) return null;
  return <ProvisionalModalInner onClose={onClose} />;
}

function ProvisionalModalInner({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogFocus(onClose);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("home.provisionalTitle")}
    >
      {/* 背景タップで閉じる */}
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glass backdrop-blur-lg">
        <h2 className="text-base font-bold text-ink">
          {t("home.provisionalTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          {t("percent.provisional.explain")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full border border-white/80 bg-white/70 py-3 font-bold text-ink backdrop-blur-sm active:opacity-80"
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
