"use client";

import { t } from "@/lib/i18n";
import { useDialogFocus } from "@/lib/ui/useDialogFocus";

/**
 * 確認ダイアログ(§4.6)。危険操作は2段階(説明→最終確認)で使う。
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  actionLabel: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onAction: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  // フックを開閉で条件分岐させないため、開いている間だけ内側をマウントする
  if (!props.open) return null;
  return <ConfirmDialogInner {...props} />;
}

function ConfirmDialogInner({
  title,
  body,
  actionLabel,
  danger = false,
  busy = false,
  onCancel,
  onAction,
}: ConfirmDialogProps) {
  const dialogRef = useDialogFocus(onCancel);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm bg-surface-2 rounded-3xl border border-hairline shadow-lg p-5 flex flex-col gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-ink-2 leading-relaxed">{body}</p>
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={onAction}
            disabled={busy}
            className={`w-full h-12 text-base disabled:opacity-50 ${
              danger
                ? "rounded-2xl bg-zone-red text-white font-semibold active:opacity-80"
                : "rounded-full bg-linear-to-b from-primary to-primary-deep text-primary-ink font-bold shadow-lg ring-1 ring-gold-soft active:translate-y-0.5 active:shadow-md"
            }`}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full h-12 rounded-full bg-surface-3 text-ink-2 text-base active:opacity-80 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
