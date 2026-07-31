"use client";

import { Suspense } from "react";
import { ResultContent } from "@/components/result/ResultContent";

/**
 * 結果画面(§4.4)。/result/?sid=<id>&new=1[&confirmed=1][&best=1]
 * useSearchParams を使うコンポーネントは静的エクスポートの要件で
 * 必ず <Suspense> でラップする。
 */
export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
