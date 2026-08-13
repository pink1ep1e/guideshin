"use client";

import Link from "next/link";
import ItemHoverPreview from "@/components/ItemHoverPreview";
import { rarityBg } from "@/lib/genshin";
import type { WeaponHoverMeta } from "@/lib/wiki-guide-data";

type WikiItemCardProps = {
  name: string;
  image: string;
  href?: string;
  rarityStars: number;
  /** object-contain for materials/weapons, cover for artifacts */
  fit?: "cover" | "contain";
  note?: string;
  lore?: string | null;
  weaponMeta?: WeaponHoverMeta | null;
  /** Растянуть на ширину ячейки сетки (каталоги). */
  fluid?: boolean;
  /** Hover-превью (материалы / оружие). */
  preview?: boolean;
};

/** Единая карточка в стиле персонажей: оружие / артефакты / материалы. */
export default function WikiItemCard({
  name,
  image,
  href,
  rarityStars,
  fit = "cover",
  note,
  lore,
  weaponMeta,
  fluid = false,
  preview = false,
}: WikiItemCardProps) {
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars)));

  const inner = (
    <>
      <div
        className="relative aspect-square w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className={
              fit === "contain"
                ? "absolute left-1/2 top-1/2 z-0 h-[118%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                : "relative z-0 h-full w-full object-cover object-top"
            }
          />
        ) : (
          <span className="relative z-0 flex h-full items-center justify-center px-2 text-center text-[10px] font-bold text-muted-foreground">
            Нет иконки
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/35 via-black/10 to-transparent dark:from-black/20 dark:via-black/5" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/stars/Quality_star_${stars}.svg`}
          alt=""
          className="absolute bottom-1.5 left-1/2 z-20 h-3.5 w-auto -translate-x-1/2"
        />
      </div>

      <div className="card-name-strip min-h-[2.75rem] pb-2 pt-1.5">
        <p className="font-genshin line-clamp-2 w-full text-center text-[12px] leading-snug tracking-wide text-foreground [overflow-wrap:anywhere]">
          {name}
        </p>
      </div>
      {note ? (
        <p className="mb-1.5 line-clamp-1 px-1.5 text-[10px] font-bold text-[#189b8e]" title={note}>
          {note}
        </p>
      ) : null}
    </>
  );

  const shell =
    "group relative flex h-full flex-col overflow-hidden rounded-[16px] bg-card shadow-panel transition duration-300 hover:shadow-[0_10px_24px_-12px_rgba(11,31,68,0.28)] dark:shadow-none dark:hover:shadow-none";

  const card = href ? (
    <Link
      href={href}
      className={`${shell} block ${fluid ? "w-full" : "w-[108px] shrink-0"}`}
    >
      {inner}
    </Link>
  ) : (
    <div className={`${shell} ${fluid ? "w-full" : "w-[108px] shrink-0"}`}>{inner}</div>
  );

  if (!preview) return card;

  return (
    <ItemHoverPreview
      name={name}
      image={image}
      lore={lore}
      weaponMeta={weaponMeta}
      rarityStars={stars}
      fit={fit}
      className={fluid ? "h-full w-full" : "inline-block h-full shrink-0"}
    >
      {card}
    </ItemHoverPreview>
  );
}
