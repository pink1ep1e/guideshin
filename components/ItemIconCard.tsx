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
};

const SIZES = {
  sm: "h-14 w-14",
  md: "h-[72px] w-[72px]",
  lg: "h-[88px] w-[88px]",
} as const;

export default function ItemIconCard({
  name,
  image,
  rarityStars,
  qty,
  href,
  size = "md",
  className = "",
}: ItemIconCardProps) {
  const box = (
    <div
      className={`relative overflow-hidden rounded-[10px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06] ${SIZES[size]} ${className}`}
      style={{ backgroundImage: `url(${rarityBg(rarityStars)})` }}
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
      {qty !== undefined && qty !== "" && (
        <span className="font-genshin absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-[13px] leading-none tracking-wide tabular-nums text-foreground">
          {typeof qty === "number" ? qty.toLocaleString("ru-RU") : qty}
        </span>
      )}
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
