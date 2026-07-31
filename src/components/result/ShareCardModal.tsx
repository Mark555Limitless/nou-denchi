"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { Zone } from "@/lib/engine/types";
import { generateShareCard } from "@/lib/share/shareCard";
import { timeLabel } from "@/lib/ui/format";
import { useDialogFocus } from "@/lib/ui/useDialogFocus";

interface Props {
  /** 表示%(displayPercent.value) */
  percent: number;
  overCap: boolean;
  zone: Zone;
  /** セッション日時(epoch ms) */
  dateMs: number;
  variant: "daily" | "day7";
  onClose: () => void;
}

/**
 * シェアカードのプレビュー+シェア/保存モーダル(§6.2)。
 * Web Share API(files対応)があれば navigator.share、
 * 非対応なら PNG ダウンロード+シェア文言のクリップボードコピー+トースト。
 */
export function ShareCardModal({
  percent,
  overCap,
  zone,
  dateMs,
  variant,
  onClose,
}: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const dialogRef = useDialogFocus(onClose);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    generateShareCard({
      percent,
      overCap,
      zone,
      date: new Date(dateMs),
      variant,
    })
      .then((b) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [percent, overCap, zone, dateMs, variant]);

  useEffect(
    () => () => {
      if (toastTimer.current !== undefined) {
        window.clearTimeout(toastTimer.current);
      }
    },
    [],
  );

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current !== undefined) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  const d = new Date(dateMs);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const fileName = `nou-denchi-${ymd}${variant === "day7" ? "-day7" : ""}.png`;
  const shareText =
    variant === "day7"
      ? `${t("share.day7.title")}\n${t("share.hashtags")}`
      : `${t("percent.label", { time: timeLabel(dateMs) })} ${percent}%\n${t("share.hashtags")}`;

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShare() {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    if (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], text: shareText });
      } catch {
        // ユーザーによるキャンセル等は無視
      }
      return;
    }
    // フォールバック: ダウンロード+文言コピー+トースト(§6.2)
    download();
    try {
      await navigator.clipboard.writeText(shareText);
      showToast(t("result.share.savedAndCopied"));
    } catch {
      showToast(t("result.share.saved"));
    }
  }

  function handleSave() {
    download();
    showToast(t("result.share.saved"));
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={t("result.share.modalTitle")}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-2 border border-hairline rounded-3xl shadow-lg p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">{t("result.share.modalTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-ink-mute px-3 py-2 -mr-2 min-h-[44px]"
          >
            {t("common.close")}
          </button>
        </div>
        <div className="rounded-xl overflow-hidden bg-surface border border-hairline aspect-[4/5] flex items-center justify-center">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={t("result.share.modalTitle")}
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-sm text-ink-mute px-4 text-center">
              {failed ? t("result.share.error") : t("result.share.generating")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={!blob}
            className="rounded-full bg-linear-to-b from-primary to-primary-deep text-primary-ink font-bold py-3.5 min-h-[44px] shadow-lg ring-1 ring-gold-soft disabled:opacity-40 active:opacity-80"
          >
            {t("result.share.share")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!url}
            className="rounded-full border-2 border-primary bg-surface-2 text-primary-deep font-bold py-3.5 min-h-[44px] shadow-sm disabled:opacity-40 active:opacity-80"
          >
            {t("result.share.save")}
          </button>
        </div>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface-3 border border-hairline rounded-full px-4 py-2 text-sm text-ink shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
