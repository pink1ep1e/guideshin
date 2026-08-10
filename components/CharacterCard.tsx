"use client";

import InventoryCard from "@/components/InventoryCard";
import StickerBadge from "@/components/StickerBadge";
import {
  ELEMENT_SVG,
  ELEMENT_THEME,
  RARITY_STARS,
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
    <InventoryCard
      name={character.name}
      image={character.image}
      href={`/wiki/characters/${character.slug}`}
      rarityStars={stars}
      layout="character"
      fit="cover"
      fluid
      elementIcon={elementIcon}
      elementGlow={glow}
      overlay={
        character.sticker ? (
          <StickerBadge
            label={character.sticker}
            size="sm"
            variant="ribbon"
            className="absolute right-0 top-7 z-20"
          />
        ) : null
      }
    />
  );
}
