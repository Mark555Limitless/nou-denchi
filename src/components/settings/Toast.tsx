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
      {/* 白ガラスのトースト */}
      <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-full px-5 py-3 text-sm font-semibold text-ink shadow-glass">
        {message}
      </div>
    </div>
  );
}
