import { zoneDefs, zoneTextHex } from "@/lib/config";
import type { Zone } from "@/lib/engine/types";

/**
 * ゾーン表示ヘルパー。Tailwind が静的解析できるよう完全なクラス名で列挙する。
 * 白面上の「文字」はコントラスト検証済みの *-text 色、ゲージ等の「図形」は fill 色。
 * 色は必ずラベル文言と併記すること(色覚多様性対応 §7)。
 */

export const zoneClasses: Record<
  Zone,
  { text: string; bg: string; border: string }
> = {
  green: {
    text: "text-zone-green-text",
    bg: "bg-zone-green",
    border: "border-zone-green-text",
  },
  yellow: {
    text: "text-zone-yellow-text",
    bg: "bg-zone-yellow",
    border: "border-zone-yellow-text",
  },
  orange: {
    text: "text-zone-orange-text",
    bg: "bg-zone-orange",
    border: "border-zone-orange-text",
  },
  red: {
    text: "text-zone-red-text",
    bg: "bg-zone-red",
    border: "border-zone-red-text",
  },
};

/** ゲージ・バー等の図形用 fill 色 */
export function zoneHex(zone: Zone): string {
  return zoneDefs.find((d) => d.zone === zone)!.hex;
}

/** 白面上の文字用色(シェアカードCanvas等) */
export function zoneTextHexOf(zone: Zone): string {
  return zoneTextHex[zone];
}
