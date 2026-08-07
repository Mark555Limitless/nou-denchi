"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { Zone } from "@/lib/engine/types";
import { generateShareCard } from "@/lib/share/shareCard";
import { timeLabel } from "@/lib/ui/format";
import { isNativeApp } from "@/lib/ui/platform";
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
 *
 * 2026-08-08 iOSネイティブ(Capacitor)対応: WKWebView は <a download>(blob:)を
 * 処理できず何も起こらないため、ネイティブでは「保存」も共有シート経由にする
 * (シートの「画像を保存」で写真に保存できる)。保存を自前で完了させた訳では
 * ないので成功トーストは出さない。files 共有まで非対応の環境では「保存」を隠す。
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

  const native = isNativeApp();
  // files 付き Web Share の対応判定。カード生成前でも判定できるよう空ファイルで見る
  const canShareFiles = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    if (typeof navigator.canShare !== "function") return false;
    return navigator.canShare({
      files: [new File([], fileName, { type: "image/png" })],
    });
  }, [fileName]);

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /** 共有シートを開く。「保存」からはカード画像のみ(文言なし)を渡す */
  async function shareViaSheet(withText: boolean) {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      await navigator.share({
        files: [file],
        ...(withText ? { text: shareText } : {}),
      });
    } catch {
      // ユーザーによるキャンセル等は無視
    }
  }

  async function handleShare() {
    if (!blob) return;
    if (canShareFiles) {
      await shareViaSheet(true);
      return;
    }
    if (native) {
      // files 非対応のネイティブ環境: 文言のみ共有シートへ(ダウンロードは不可)
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ text: shareText });
        } catch {
          // キャンセル等は無視
        }
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
    if (native) {
      // WKWebView は <a download> を処理できない。共有シートの「画像を保存」に委ねる
      void shareViaSheet(false);
      return;
    }
    download();
    showToast(t("result.share.saved"));
  }

  // ネイティブで files 共有まで使えない場合、「保存」は成立しないので出さない
  const showSaveButton = !native || canShareFiles;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("result.share.modalTitle")}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/70 rounded-3xl shadow-glass p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">{t("result.share.modalTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-ink-2 px-3 py-2 -mr-2 min-h-[44px]"
          >
            {t("common.close")}
          </button>
        </div>
        <div className="rounded-xl overflow-hidden bg-white/60 border border-white/70 aspect-[4/5] flex items-center justify-center">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={t("result.share.modalTitle")}
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-sm text-ink-2 px-4 text-center">
              {failed ? t("result.share.error") : t("result.share.generating")}
            </p>
          )}
        </div>
        <div
          className={`grid gap-3 ${showSaveButton ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <button
            type="button"
            onClick={handleShare}
            disabled={!blob}
            className="relative overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-primary-ink font-bold py-3.5 min-h-[44px] shadow-lg shadow-primary/30 ring-1 ring-white/60 disabled:opacity-40 active:opacity-80"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
            />
            {t("result.share.share")}
          </button>
          {showSaveButton && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!url}
              className="rounded-full border-2 border-primary/70 bg-white/70 backdrop-blur-sm text-primary-deep font-bold py-3.5 min-h-[44px] shadow-sm disabled:opacity-40 active:opacity-80"
            >
              {t("result.share.save")}
            </button>
          )}
        </div>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/85 backdrop-blur-md border border-white/70 rounded-full px-4 py-2 text-sm text-ink shadow-glass"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
