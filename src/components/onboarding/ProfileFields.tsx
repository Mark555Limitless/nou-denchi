"use client";

import type { AgeBand } from "@/lib/engine/types";
import { t, type MsgKey } from "@/lib/i18n";

/** フォーム編集用の値(""=未選択)。オンボーディングと設定画面で共用。 */
export interface ProfileFieldsValue {
  ageBand: AgeBand | "";
}

const AGE_OPTIONS: readonly { value: AgeBand | ""; labelKey: MsgKey }[] = [
  { value: "", labelKey: "onboarding.age.none" },
  { value: "10s", labelKey: "onboarding.age.10s" },
  { value: "20s", labelKey: "onboarding.age.20s" },
  { value: "30s", labelKey: "onboarding.age.30s" },
  { value: "40s", labelKey: "onboarding.age.40s" },
  { value: "50s", labelKey: "onboarding.age.50s" },
  { value: "60s+", labelKey: "onboarding.age.60s+" },
] as const;

/**
 * プロフィール入力フィールド(§4.1 / §4.6 共用)。年代セレクトのみ・任意。
 */
export function ProfileFields({
  value,
  onChange,
}: {
  value: ProfileFieldsValue;
  onChange: (next: ProfileFieldsValue) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 年代 */}
      <div>
        <label htmlFor="profile-age-band" className="block text-sm text-ink-2 mb-1.5">
          {t("onboarding.age.label")}
        </label>
        <select
          id="profile-age-band"
          value={value.ageBand}
          onChange={(e) =>
            onChange({ ...value, ageBand: e.target.value as AgeBand | "" })
          }
          className="w-full h-11 rounded-xl bg-white/70 backdrop-blur-sm border border-white/80 px-3 text-base text-ink shadow-sm"
          style={{ colorScheme: "light" }}
        >
          {AGE_OPTIONS.map((o) => (
            <option key={o.labelKey} value={o.value}>
              {t(o.labelKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
