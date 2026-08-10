"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { rarityBg } from "@/lib/genshin";

export type InventoryCardProps = {
  name: string;
  image: string;
  rarityStars: number;
  href?: string;
  /** cover — портреты/артефакты; contain — оружие/материалы */
  fit?: "cover" | "contain";
  /**
   * character — звезда справа сверху (как в инвентаре персонажей);
   * item — ряд звёзд над шильдиком (как у оружия).
   */
  layout?: "character" | "item";
  elementIcon?: string | null;
  elementGlow?: string;
  /** Доп. оверлей слева сверху (поверх элемента, если нужен). */
  topLeft?: ReactNode;
  /** Доп. оверлей справа сверху (вместо/рядом со звездой персонажа). */
  topRight?: ReactNode;
  /** Бейджи внутри портрета (qty и т.п.). */
  overlay?: ReactNode;
  note?: string;
  fluid?: boolean;
  /** Фиксированная ширина, если не fluid. */
  widthClass?: string;
  className?: string;
  /** Нейтральный фон без редкости (враги / источники). */
  neutral?: boolean;
  emptyLabel?: string;
  /** Компактнее шильдик (сетки желаний). */
  dense?: boolean;
};

const SHELL =
  "group relative flex h-full flex-col overflow-hidden rounded-[8px] bg-[#d4cfc8] shadow-[0_2px_6px_rgba(0,0,0,0.18)] ring-1 ring-black/20 transition duration-200 hover:ring-[#5ad4e6]/70 hover:shadow-[0_0_0_2px_rgba(90,212,230,0.55),0_4px_14px_rgba(0,0,0,0.22)]";

/**
 * Карточка инвентаря в стиле Genshin: портрет на фоне редкости +
 * светлый шильдик с названием (вместо «Ур. N»).
 */
export default function InventoryCard({
  name,
  image,
  rarityStars,
  href,
  fit = "cover",
  layout = "item",
  elementIcon,
  elementGlow = "rgba(24,155,142,0.45)",
  topLeft,
  topRight,
  overlay,
  note,
  fluid = false,
  widthClass = "w-[108px]",
  className = "",
  neutral = false,
  emptyLabel = "Нет иконки",
  dense = false,
}: InventoryCardProps) {
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars || 1)));
  const isCharacter = layout === "character";

  const inner = (
    <>
      <div
        className={`relative aspect-[5/6] w-full overflow-hidden bg-cover bg-center ${
          neutral ? "bg-[#cfc8bf]" : ""
        }`}
        style={neutral ? undefined : { backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className={
              fit === "contain"
                ? "absolute left-1/2 top-[46%] z-0 h-[108%] w-[108%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
                : "relative z-0 h-full w-full object-cover object-top"
            }
          />
        ) : (
          <span className="relative z-0 flex h-full items-center justify-center px-2 text-center text-[10px] font-bold text-black/45">
            {emptyLabel}
          </span>
        )}

        {!neutral && !isCharacter ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/images/stars/Quality_star_${stars}.svg`}
            alt=""
            className="pointer-events-none absolute bottom-1 left-1/2 z-20 h-3 w-auto -translate-x-1/2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] sm:h-3.5"
          />
        ) : null}

        {isCharacter && !neutral && !topRight ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/stars/Quality_star_1.svg"
            alt=""
            className="pointer-events-none absolute right-1 top-1 z-20 h-3.5 w-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
            title={`${stars}★`}
          />
        ) : null}

        {elementIcon ? (
          <span className="absolute left-1 top-1 z-20 flex h-6 w-6 items-center justify-center sm:h-7 sm:w-7">
            <span
              aria-hidden
              className="absolute inset-[-1px] rounded-full bg-black/25 blur-[1px]"
            />
            <span
              aria-hidden
              className="absolute inset-[-2px] rounded-full blur-[7px]"
              style={{ backgroundColor: elementGlow, opacity: 0.65 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={elementIcon}
              alt=""
              className="relative h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]"
              style={{
                filter:
                  "drop-shadow(0 0 1.5px rgba(0,0,0,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
              }}
            />
          </span>
        ) : null}

        {topLeft}
        {topRight}
        {overlay}
      </div>

      <div
        className={`flex shrink-0 items-center justify-center border-t border-black/10 bg-[#ece8e3] px-1 ${
          dense ? "min-h-[1.55rem] py-0.5" : "min-h-[1.85rem] py-1"
        }`}
      >
        <p
          className={`font-genshin line-clamp-2 w-full text-center font-semibold leading-snug tracking-wide text-[#2f2f2f] [overflow-wrap:anywhere] ${
            dense ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-[12px]"
          }`}
          title={name}
        >
          {name}
        </p>
      </div>

      {note ? (
        <p
          className="line-clamp-1 border-t border-black/5 bg-[#e4dfd8] px-1.5 py-0.5 text-center text-[10px] font-bold text-[#189b8e]"
          title={note}
        >
          {note}
        </p>
      ) : null}
    </>
  );

  const shell = `${SHELL} ${fluid ? "w-full" : `${widthClass} shrink-0`} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${shell} block`}>
        {inner}
      </Link>
    );
  }

  return <div className={shell}>{inner}</div>;
}
