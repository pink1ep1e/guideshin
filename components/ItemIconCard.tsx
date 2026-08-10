"use client";

import Link from "next/link";
import InventoryCard from "@/components/InventoryCard";
import ItemHoverPreview from "@/components/ItemHoverPreview";
import { rarityBg } from "@/lib/genshin";
import type { WeaponHoverMeta } from "@/lib/wiki-guide-data";

type ItemIconCardProps = {
  name: string;
  image: string;
  rarityStars: number;
  qty?: number | string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * Только иконка (таблицы). По умолчанию — карточка в стиле инвентаря.
   */
  compact?: boolean;
  /** Нейтральный фон / cover (враги / источники). */
  variant?: "rarity" | "neutral";
  /** Растянуть на ширину ячейки сетки. */
  fluid?: boolean;
  /** Короткий лор для hover-превью. */
  lore?: string | null;
  /** Статы оружия для hover (вместо лора). */
  weaponMeta?: WeaponHoverMeta | null;
  /** Показывать hover-превью. */
  preview?: boolean;
};

const COMPACT_SIZES = {
  sm: "h-14 w-14",
  md: "h-[72px] w-[72px]",
  lg: "h-[88px] w-[88px]",
} as const;

const CARD_WIDTHS = {
  sm: "w-[96px]",
  md: "w-[108px]",
  lg: "w-[116px]",
} as const;

/** Не показывать бейдж, если кол-во 0 / пусто. */
export function hasVisibleQty(qty?: number | string | null): boolean {
  if (qty === undefined || qty === null || qty === "") return false;
  if (typeof qty === "number") return qty !== 0 && Number.isFinite(qty);
  const raw = String(qty).trim().replace(/\s/g, "").replace(/^×/, "");
  if (!raw || raw === "0") return false;
  const n = Number(raw);
  if (Number.isFinite(n) && n === 0) return false;
  return true;
}

function formatQty(qty: number | string): string {
  if (typeof qty === "number") return qty.toLocaleString("ru-RU");
  const raw = String(qty).trim().replace(/^×/, "");
  const n = Number(raw.replace(/\s/g, ""));
  if (Number.isFinite(n)) return n.toLocaleString("ru-RU");
  return raw;
}

function QtyBadge({
  qty,
  compact,
}: {
  qty: number | string;
  compact?: boolean;
}) {
  return (
    <span
      className={
        compact
          ? "absolute bottom-1 right-1 z-20 rounded-full bg-[#189b8e] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white shadow-sm"
          : "absolute right-1.5 top-1.5 z-20 rounded-full bg-[#189b8e] px-2 py-0.5 text-[11px] font-extrabold leading-none text-white shadow-sm"
      }
    >
      ×{formatQty(qty)}
    </span>
  );
}

export default function ItemIconCard({
  name,
  image,
  rarityStars,
  qty,
  href,
  size = "md",
  className = "",
  compact = false,
  variant = "rarity",
  fluid = false,
  lore,
  weaponMeta,
  preview = false,
}: ItemIconCardProps) {
  const showQty = hasVisibleQty(qty);
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars || 1)));
  const isNeutral = variant === "neutral";
  const fit = isNeutral ? "cover" : "contain";

  // Компактная иконка — только для таблиц
  if (compact) {
    const box = (
      <div
        className={`relative overflow-hidden rounded-[8px] bg-cover bg-center shadow-sm ring-1 ring-black/20 ${COMPACT_SIZES[size]} ${className} ${
          isNeutral ? "bg-[#cfc8bf]" : ""
        }`}
        style={isNeutral ? undefined : { backgroundImage: `url(${rarityBg(stars)})` }}
        title={name}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-contain p-0.5" />
        ) : (
          <span className="flex h-full items-center justify-center px-1 text-center text-[9px] font-bold leading-tight text-muted-foreground">
            Нет иконки
          </span>
        )}
        {showQty && qty !== undefined && qty !== null && qty !== "" ? (
          <QtyBadge qty={qty} compact />
        ) : null}
      </div>
    );

    const linked = href ? (
      <Link href={href} className="inline-block transition hover:opacity-95">
        {box}
      </Link>
    ) : (
      box
    );

    if (!preview) return linked;

    return (
      <ItemHoverPreview
        name={name}
        image={image}
        lore={lore}
        weaponMeta={weaponMeta}
        rarityStars={stars}
        fit={fit}
        className="inline-block"
      >
        {linked}
      </ItemHoverPreview>
    );
  }

  const widthClass = fluid ? "w-full" : CARD_WIDTHS[size];
  const card = (
    <InventoryCard
      name={name}
      image={image}
      href={href ?? undefined}
      rarityStars={stars}
      fit={fit}
      layout="item"
      fluid={fluid}
      widthClass={widthClass}
      className={className}
      neutral={isNeutral}
      overlay={
        showQty && qty !== undefined && qty !== null && qty !== "" ? (
          <QtyBadge qty={qty} />
        ) : null
      }
    />
  );

  if (!preview) {
    return fluid ? card : <div className="inline-block h-full shrink-0">{card}</div>;
  }

  return (
    <ItemHoverPreview
      name={name}
      image={image}
      lore={lore}
      weaponMeta={weaponMeta}
      rarityStars={stars}
      fit={fit}
      className={fluid ? "block h-full w-full" : "inline-block h-full shrink-0"}
    >
      {card}
    </ItemHoverPreview>
  );
}
