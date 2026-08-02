import { common } from "./ja/common";
import { home } from "./ja/home";
import { measure } from "./ja/measure";
import { result } from "./ja/result";
import { history } from "./ja/history";
import { onboarding } from "./ja/onboarding";
import { settings } from "./ja/settings";
import { share } from "./ja/share";
import { boost } from "./ja/boost";
import { relax } from "./ja/relax";
import { training } from "./ja/training";

/**
 * i18n(§7 SHOULD)。MVPは日本語のみだが、文言はすべて辞書に分離する。
 * キーの重複を避けるため必ず "領域." プレフィックスを付けること。
 */
export const ja = {
  ...common,
  ...home,
  ...measure,
  ...result,
  ...history,
  ...onboarding,
  ...settings,
  ...share,
  ...boost,
  ...relax,
  ...training,
} as const;

export type MsgKey = keyof typeof ja;

/** 例: t("calibration.progress", { day: 3, total: 7 }) */
export function t(
  key: MsgKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = ja[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
