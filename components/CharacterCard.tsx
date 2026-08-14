"use client";

import Link from "next/link";
import StickerBadge from "@/components/StickerBadge";
import {
  ELEMENT_SVG,
  ELEMENT_THEME,
  RARITY_STARS,
  rarityBg,
  type ElementKey,
} from "@/lib/genshin";

export type CharacterCardData = {
  slug: string;
  name: string;
  image: string;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  element: string;
  region?: string | null;
  sticker?: string | null;
  shortDesc?: string | null;
};

export default function CharacterCard({ character }: { character: CharacterCardData }) {
  const stars = RARITY_STARS[character.rarity] ?? 4;
  const elKey = character.element.toUpperCase() as ElementKey;
  const elementIcon = ELEMENT_SVG[elKey];
  const theme = ELEMENT_THEME[elKey];
  const glow = theme?.glow ?? "rgba(24,155,142,0.45)";

  return (
    <Link
      href={`/wiki/characters/${character.slug}`}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[16px] bg-white shadow-soft transition duration-300 hover:shadow-[0_10px_24px_-12px_rgba(11,31,68,0.28)] dark:bg-[hsl(240_8%_22%)] dark:shadow-none dark:hover:shadow-none"
    >
      <div
        className="relative aspect-square w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={character.image}
          alt={character.name}
          className="relative z-0 h-full w-full object-cover object-top"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/35 via-black/10 to-transparent dark:from-black/20 dark:via-black/5" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/stars/Quality_star_${stars}.svg`}
          alt=""
          className="absolute bottom-1.5 left-1/2 z-20 h-3.5 w-auto -translate-x-1/2"
        />

        {elementIcon && (
          <span className="absolute left-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-[-2px] rounded-full blur-[8px]"
              style={{ backgroundColor: glow, opacity: 0.7 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={elementIcon}
              alt=""
              className="relative h-[22px] w-[22px]"
              style={{
                filter:
                  "drop-shadow(0 0 1.5px rgba(0,0,0,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
              }}
            />
          </span>
        )}

        {character.sticker && (
          <StickerBadge
            label={character.sticker}
            size="sm"
            variant="ribbon"
            className="absolute right-0 top-2 z-20"
          />
        )}
      </div>

      <div className="card-name-strip">
        <p className="font-genshin line-clamp-2 w-full text-center text-[12px] leading-snug tracking-wide text-foreground [overflow-wrap:anywhere]">
          {character.name}
        </p>
      </div>
    </Link>
  );
}
