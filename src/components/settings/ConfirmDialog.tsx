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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* 白ガラスのダイアログ */}
      <div className="w-full max-w-sm bg-white/85 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5 flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="text-sm text-ink-2 leading-relaxed">{body}</p>
        <div className="flex flex-col gap-2 mt-2">
          {/* 実行: 危険操作=ガラスの赤ピル / 通常=水滴の青ガラスピル */}
          <button
            type="button"
            onClick={onAction}
            disabled={busy}
            className={`relative overflow-hidden w-full h-12 rounded-full text-base disabled:opacity-50 ${
              danger
                ? "bg-zone-red text-white font-bold shadow-lg shadow-zone-red/30 ring-1 ring-white/60 active:translate-y-0.5 active:shadow-md"
                : "bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-primary-ink font-bold shadow-lg shadow-primary/30 ring-1 ring-white/60 active:translate-y-0.5 active:shadow-md"
            }`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
            />
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full h-12 rounded-full border border-hairline bg-white/70 text-ink-2 font-semibold text-base active:opacity-80 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
