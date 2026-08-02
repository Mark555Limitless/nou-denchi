"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { asset } from "@/lib/ui/asset";

/**
 * BOOST!!/RELAX ゲームバナー(§4.4 結果画面)。
 * 2026-07-31 ユーザー指示[1]: ユーザー支給の完成バナー画像
 * (BOOST05.png / RELAX01.png → public/games/*.webp に最適化)へ差し替え。
 * 見出し・キャプション・「ゲームをプレイ」ボタンは画像内に焼き込み済みのため、
 * 画像は装飾(alt=""・aria-hidden)とし、Link の aria-label で日本語の完全な説明を提供する。
 * スコアの高低に関わらず常時表示する(条件分岐禁止)。
 */

function GameBanner({
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

export function GameBanners() {
  return (
    <div className="flex flex-col gap-3">
      <GameBanner
        href="/boost/"
        ariaLabel={t("result.boost.aria")}
        imgSrc={asset("/games/banner-boost.webp")}
      />
      <GameBanner
        href="/relax/"
        ariaLabel={t("result.relax.aria")}
        imgSrc={asset("/games/banner-relax.webp")}
      />
      {/* トレオタ(追加トレーニング)第3バナー(2026-08-02 ユーザー指示[6]) */}
      <GameBanner
        href="/training/"
        ariaLabel={t("training.banner.aria")}
        imgSrc={asset("/games/banner-treota.webp")}
      />
    </div>
  );
}
