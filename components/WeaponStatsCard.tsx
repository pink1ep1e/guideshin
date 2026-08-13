import { rarityBg } from "@/lib/genshin";
import type { WeaponGuideData } from "@/lib/wiki-guide-data";

type WeaponStatsCardProps = {
  name: string;
  image: string;
  weaponType: string;
  rarityStars: number;
  data: WeaponGuideData;
};

function StatRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-3 text-[13px] sm:grid-cols-[7rem_1fr] sm:text-[14px]">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function WeaponStatsCard({
  name,
  image,
  weaponType,
  rarityStars,
  data,
}: WeaponStatsCardProps) {
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars)));
  const atk =
    data.atkMin && data.atkMax
      ? `${data.atkMin}~${data.atkMax}`
      : data.atkMin || data.atkMax || "";
  const sub =
    data.subStatMin && data.subStatMax
      ? `${data.subStatMin}~${data.subStatMax}`
      : data.subStatMin || data.subStatMax || "";

  return (
    <section className="w-full rounded-[16px] bg-white/90 p-4 shadow-soft sm:p-5 dark:bg-[hsl(var(--card))] dark:shadow-none">
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div
          className="relative flex h-[108px] w-[108px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-cover bg-center shadow-sm sm:h-[120px] sm:w-[120px]"
          style={{ backgroundImage: `url(${rarityBg(stars)})` }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              className="absolute left-1/2 top-1/2 h-[128%] w-[128%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          ) : (
            <span className="px-2 text-center text-[10px] font-bold text-muted-foreground">
              Нет иконки
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-genshin text-lg tracking-wide text-foreground sm:text-xl">{name}</p>

          <div className="space-y-1">
            <div className="grid grid-cols-[minmax(5rem,auto)_1fr] items-center gap-x-3 text-[13px] sm:grid-cols-[7rem_1fr] sm:text-[14px]">
              <span className="font-medium text-muted-foreground">Редкость</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/stars/Quality_star_${stars}.svg`}
                alt={`${stars}★`}
                className="h-3.5 w-auto justify-self-start"
              />
            </div>
            <StatRow label="Тип" value={weaponType} />
            <StatRow label="Сила атаки" value={atk} />
            <StatRow
              label={data.subStatLabel || "Доп. характеристика"}
              value={sub}
            />
          </div>
        </div>
      </div>

      {data.passive ? (
        <div className="mt-4 border-t border-black/[0.06] pt-4 text-[14px] font-medium leading-relaxed text-foreground whitespace-pre-line sm:text-[15px]">
          {data.passive}
        </div>
      ) : null}
    </section>
  );
}
