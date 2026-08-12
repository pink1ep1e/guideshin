"use client";

import Link from "next/link";
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
   * Только иконка (таблицы). По умолчанию — карточка в стиле персонажей.
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
          : "absolute bottom-1.5 right-1.5 z-20 rounded-full bg-[#189b8e] px-2 py-0.5 text-[11px] font-extrabold leading-none text-white shadow-sm"
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
        className={`relative overflow-hidden rounded-[10px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06] ${COMPACT_SIZES[size]} ${className} ${
          isNeutral ? "bg-[#f3f0ea]" : ""
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

  // Карточка в стиле персонажей: квадрат + звёзды + фиксированная подпись
  const widthClass = fluid ? "w-full" : CARD_WIDTHS[size];
  const card = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-[16px] bg-card shadow-panel ring-1 ring-black/[0.06] transition duration-300 hover:ring-[#189b8e]/35 hover:shadow-[0_10px_24px_-12px_rgba(11,31,68,0.28)] ${widthClass} ${className}`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-cover bg-center ${
          isNeutral ? "bg-[#f3f0ea]" : ""
        }`}
        style={isNeutral ? undefined : { backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className={
              isNeutral
                ? "relative z-0 h-full w-full object-cover"
                : "absolute left-1/2 top-1/2 z-0 h-[118%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            }
          />
        ) : (
          <span className="relative z-0 flex h-full items-center justify-center px-2 text-center text-[10px] font-bold text-muted-foreground">
            Нет иконки
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
        {!isNeutral ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/images/stars/Quality_star_${stars}.svg`}
            alt=""
            className="absolute bottom-1.5 left-1/2 z-20 h-3.5 w-auto -translate-x-1/2"
          />
        ) : null}
        {showQty && qty !== undefined && qty !== null && qty !== "" ? (
          <QtyBadge qty={qty} />
        ) : null}
      </div>

      <div className="relative z-10 flex min-h-[2.75rem] shrink-0 items-center justify-center px-1.5 pb-2 pt-1.5">
        <p className="font-genshin line-clamp-2 w-full text-center text-[12px] leading-snug tracking-wide text-foreground [overflow-wrap:anywhere]">
          {name}
        </p>
      </div>
    </div>
  );

  const wrapped = preview ? (
    <ItemHoverPreview
      name={name}
      image={image}
      lore={lore}
      weaponMeta={weaponMeta}
      rarityStars={stars}
      fit={fit}
      className={fluid ? "block h-full w-full" : "inline-block h-full shrink-0"}
    >
      {href ? (
        <Link href={href} className="block h-full transition hover:opacity-95">
          {card}
        </Link>
      ) : (
        card
      )}
    </ItemHoverPreview>
  ) : href ? (
    <Link
      href={href}
      className={`block h-full transition hover:opacity-95 ${fluid ? "w-full" : "inline-block shrink-0"}`}
    >
      {card}
    </Link>
  ) : (
    <div className={fluid ? "h-full w-full" : "inline-block h-full shrink-0"}>{card}</div>
  );

  return wrapped;
}
