"use client";

/** 完了トースト(§4.6)。表示/非表示は呼び出し側の state で制御する。 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-6 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="bg-surface-2 border border-gold-soft rounded-full px-5 py-3 text-sm font-semibold text-ink shadow-lg">
        {message}
      </div>
    </div>
  );
}
