"use client";

import type { ReactNode } from "react";
import InventoryCard from "@/components/InventoryCard";
import WikiItemCard from "@/components/WikiItemCard";
import {
  ELEMENT_SVG,
  ELEMENT_THEME,
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

  return (
    <InventoryCard
      name={item.name}
      image={item.image}
      href={item.href}
      rarityStars={stars}
      layout="character"
      fit="cover"
      elementIcon={elementIcon}
      elementGlow={glow}
      emptyLabel={item.name}
    />
  );
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
