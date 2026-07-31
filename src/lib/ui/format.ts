/**
 * 測定日時の表示("2026年7月31日6時26分" 形式)。
 * 1日に何十回も測定する前提のため、%は常に完全な日時と紐づけて示す。
 */
export function timeLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日${d.getHours()}時${String(d.getMinutes()).padStart(2, "0")}分`;
}
