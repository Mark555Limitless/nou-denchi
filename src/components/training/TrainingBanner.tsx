"use client";

import Link from "next/link";

/**
 * トレオタ選択メニューの横長バナー(GameBanners と同じ表示形式)。
 * テキストはバナー画像に焼き込み済みのため、画像は装飾(alt=""・aria-hidden)とし、
 * Link の aria-label で日本語の完全な説明を提供する。
 * 画像が未配置でも Link 全体のタップ判定と aria-label は機能する。
 */
export function TrainingBanner({
  href,
  ariaLabel,
  imgSrc,
}: {
  href: string;
  ariaLabel: string;
  imgSrc: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="block overflow-hidden rounded-3xl shadow-md active:scale-[0.99] transition-transform"
    >
      {/* バナー原寸 2064×512(約4:1)。テキスト込みの完成デザイン */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt=""
        aria-hidden
        width={1200}
        height={298}
        className="h-auto w-full"
      />
    </Link>
  );
}
