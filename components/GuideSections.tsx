"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import WikiItemCard from "@/components/WikiItemCard";
import {
  ELEMENT_SVG,
  ELEMENT_THEME,
  rarityBg,
  type ElementKey,
} from "@/lib/genshin";
import type { WeaponHoverMeta } from "@/lib/wiki-guide-data";

export type RelatedCharacter = {
  name: string;
  image: string;
  element?: string;
  rarityStars: number;
  href?: string;
  lore?: string | null;
};

export type RelatedWeapon = {
  name: string;
  image: string;
  rarityStars: number;
  href?: string;
  lore?: string | null;
  weaponMeta?: WeaponHoverMeta | null;
};

/** Карточка персонажа в гайдах — тот же стиль, что в каталоге. */
export function CharacterPortraitCard({ item }: { item: RelatedCharacter }) {
  const stars = Math.min(5, Math.max(1, Math.round(item.rarityStars || 4)));
  const elKey = (item.element || "").toUpperCase() as ElementKey;
  const elementIcon = elKey ? ELEMENT_SVG[elKey] : null;
  const theme = elKey ? ELEMENT_THEME[elKey] : null;
  const glow = theme?.glow ?? "rgba(24,155,142,0.45)";

  const inner = (
    <>
      <div
        className="relative aspect-square w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="relative z-0 h-full w-full object-cover object-top"
          />
        ) : (
          <span className="relative z-0 flex h-full items-center justify-center px-2 text-center text-[11px] font-bold text-muted-foreground">
            {item.name}
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/stars/Quality_star_${stars}.svg`}
          alt=""
          className="absolute bottom-1.5 left-1/2 z-20 h-3.5 w-auto -translate-x-1/2"
        />

        {elementIcon && (
          <span className="absolute left-1.5 top-1.5 z-20 flex h-6 w-6 items-center justify-center">
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
      </div>

      <div className="flex min-h-[2.1rem] shrink-0 items-center justify-center px-1.5 py-1">
        <p className="font-genshin line-clamp-2 w-full text-center text-[12px] leading-snug tracking-wide text-foreground [overflow-wrap:anywhere]">
          {item.name}
        </p>
      </div>
    </>
  );

  const shell =
    "group relative flex h-full w-[108px] shrink-0 flex-col overflow-hidden rounded-[16px] bg-card shadow-panel ring-1 ring-black/[0.06] transition duration-300 hover:ring-[#189b8e]/35 hover:shadow-[0_10px_24px_-12px_rgba(11,31,68,0.28)]";

  if (item.href) {
    return (
      <Link href={item.href} className={shell}>
        {inner}
      </Link>
    );
  }

  return <div className={shell}>{inner}</div>;
}

/** Плитка оружия — тот же стиль, что WikiItemCard. */
export function WeaponTileCard({ item }: { item: RelatedWeapon }) {
  return (
    <WikiItemCard
      name={item.name}
      image={item.image}
      href={item.href}
      rarityStars={item.rarityStars}
      fit="contain"
      lore={item.lore}
      weaponMeta={item.weaponMeta}
      preview
    />
  );
}

export function GuideSection({
  title,
  children,
  intro,
  large,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  /** Крупнее заголовок и текст (алхимия и т.п.) */
  large?: boolean;
}) {
  return (
    <section className="rounded-[20px] border border-black/[0.06] bg-white/90 p-5 shadow-soft sm:p-6">
      <h2
        className={`font-genshin tracking-wide text-foreground ${
          large ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <div
          className={`mt-2 text-muted-foreground ${
            large ? "text-[15px] leading-relaxed sm:text-base" : "text-sm leading-relaxed"
          }`}
        >
          {intro}
        </div>
      ) : null}
      <div className={intro ? "mt-4" : "mt-3"}>{children}</div>
    </section>
  );
}
