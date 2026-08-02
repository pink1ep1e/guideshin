import Link from "next/link";
import { rarityBg } from "@/lib/genshin";

type ItemIconCardProps = {
  name: string;
  image: string;
  rarityStars: number;
  qty?: number | string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * Только иконка (таблицы). По умолчанию — полная карточка
   * как на скринах 3–4: картинка + имя, при qty>0 бирюзовый ×N.
   */
  compact?: boolean;
  /** Нейтральный фон (враги / источники), скрин 4. */
  variant?: "rarity" | "neutral";
};

const COMPACT_SIZES = {
  sm: "h-14 w-14",
  md: "h-[72px] w-[72px]",
  lg: "h-[88px] w-[88px]",
} as const;

const CARD_WIDTHS = {
  sm: "w-[80px]",
  md: "w-[92px]",
  lg: "w-[100px]",
} as const;

const CARD_ICON_HEIGHTS = {
  sm: "h-[72px]",
  md: "h-[84px]",
  lg: "h-[92px]",
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
          ? "absolute bottom-1 right-1 z-10 rounded-full bg-[#189b8e] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white shadow-sm"
          : "absolute bottom-1.5 right-1.5 z-10 rounded-full bg-[#189b8e] px-2 py-0.5 text-[11px] font-extrabold leading-none text-white shadow-sm"
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
}: ItemIconCardProps) {
  const showQty = hasVisibleQty(qty);
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars || 1)));
  const isNeutral = variant === "neutral";

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

    if (href) {
      return (
        <Link href={href} className="inline-block transition hover:opacity-95">
          {box}
        </Link>
      );
    }
    return box;
  }

  // Полная карточка (скрин 3 с qty / скрин 4 без qty)
  const card = (
    <div
      className={`overflow-hidden rounded-[12px] bg-card shadow-panel ring-1 ring-black/[0.06] ${CARD_WIDTHS[size]} ${className}`}
      title={name}
    >
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-cover bg-center p-1.5 ${CARD_ICON_HEIGHTS[size]} ${
          isNeutral ? "bg-[#f3f0ea]" : ""
        }`}
        style={isNeutral ? undefined : { backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className={`h-full w-full ${isNeutral ? "object-cover" : "object-contain"}`}
          />
        ) : (
          <span className="px-1 text-center text-[10px] font-bold text-muted-foreground">
            Нет иконки
          </span>
        )}
        {showQty && qty !== undefined && qty !== null && qty !== "" ? (
          <QtyBadge qty={qty} />
        ) : null}
      </div>
      <p
        className={`font-genshin break-words px-1.5 py-1.5 text-center text-[12px] font-normal leading-snug tracking-wide text-[#1e1e1e] ${
          isNeutral ? "bg-[#f3f0ea]" : "bg-white"
        }`}
        title={name}
      >
        {name}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block shrink-0 transition hover:opacity-95">
        {card}
      </Link>
    );
  }
  return <div className="inline-block shrink-0">{card}</div>;
}
