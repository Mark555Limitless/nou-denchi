import type { TimeBand } from "./types";

/** 朝(4-11時)/昼(11-17時)/夜(17-24時)/深夜(0-4時) (§3.3(c)) */
export function timeBandOf(date: Date): TimeBand {
  const h = date.getHours();
  if (h >= 4 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17) return "evening";
  return "night";
}

