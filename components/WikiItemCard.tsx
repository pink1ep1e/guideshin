"use client";

import Link from "next/link";
import ItemHoverPreview from "@/components/ItemHoverPreview";
import { rarityBg } from "@/lib/genshin";

type WikiItemCardProps = {
  name: string;
  image: string;
  href?: string;
  rarityStars: number;
  /** object-contain for materials/weapons, cover for artifacts */
  fit?: "cover" | "contain";
  badge?: string;
  note?: string;
  lore?: string | null;
  /** Растянуть на ширину ячейки сетки (каталоги). */
  fluid?: boolean;
  preview?: boolean;
};

/** Единая карточка в стиле персонажей: оружие / артефакты / материалы. */
export default function WikiItemCard({
  name,
  image,
  href,
  rarityStars,
  fit = "cover",
  badge,
  note,
  lore,
  fluid = false,
  preview = true,
}: WikiItemCardProps) {
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars)));

  const inner = (
    <>
      <div
        className="relative aspect-square w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {badge && (
          <span className="absolute left-1.5 top-1.5 z-20 max-w-[75%] truncate rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
            {badge}
          </span>
        )}
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
      </div>

      <div className="relative z-10 -mt-4 flex min-h-[3.75em] flex-col items-center px-1.5 pb-2 pt-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/stars/Quality_star_${stars}.svg`}
          alt=""
          className="relative z-10 mb-1 h-3.5 w-auto drop-shadow"
        />
        <p className="font-genshin line-clamp-2 w-full overflow-hidden text-center text-[13px] leading-snug tracking-wide text-[#1e1e1e]">
          {name}
        </p>
        {note ? (
          <p className="mt-0.5 line-clamp-1 text-[10px] font-bold text-[#189b8e]" title={note}>
            {note}
          </p>
        ) : null}
      </div>
    </>
  );

  const shell =
    "group relative flex h-full flex-col overflow-hidden rounded-[16px] bg-card shadow-panel ring-1 ring-black/[0.06] transition duration-300 hover:ring-[#189b8e]/35 hover:shadow-[0_10px_24px_-12px_rgba(11,31,68,0.28)]";

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
      rarityStars={stars}
      fit={fit}
      className={fluid ? "h-full w-full" : "inline-block h-full shrink-0"}
    >
      {card}
    </ItemHoverPreview>
  );
}
