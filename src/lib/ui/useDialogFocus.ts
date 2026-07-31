"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]";

/**
 * ダイアログのフォーカス管理(§7 アクセシビリティ)。
 * 開いたら最初のフォーカス可能要素へ移動し、Tab をダイアログ内に閉じ込め、
 * Escape で閉じ、閉じたら元の要素へフォーカスを戻す。
 * 返り値の ref をダイアログのコンテナ要素に付けること。
 */
export function useDialogFocus<T extends HTMLElement = HTMLDivElement>(
  onClose?: () => void,
) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = el.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (i) => !i.hasAttribute("disabled") && i.tabIndex !== -1,
      );
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstItem || active === el)) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, []);

  return ref;
}
