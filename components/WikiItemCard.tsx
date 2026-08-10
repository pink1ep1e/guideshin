"use client";

import InventoryCard from "@/components/InventoryCard";
import ItemHoverPreview from "@/components/ItemHoverPreview";
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

/** Единая карточка в стиле инвентаря: оружие / артефакты / материалы. */
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

  const card = (
    <InventoryCard
      name={name}
      image={image}
      href={href}
      rarityStars={stars}
      fit={fit}
      layout="item"
      note={note}
      fluid={fluid}
    />
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
