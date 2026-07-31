import { t } from "@/lib/i18n";

/** 免責事項(§1.4 MUST)。オンボーディングと設定画面で使用。 */
export function Disclaimer({ detail = false }: { detail?: boolean }) {
  return (
    <div className="text-xs text-ink-mute leading-relaxed">
      <p className="font-semibold text-ink-2">{t("app.disclaimer")}</p>
      {detail && <p className="mt-1">{t("app.disclaimer.detail")}</p>}
    </div>
  );
}
