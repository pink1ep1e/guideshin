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
    <div className="grid grid-cols-[minmax(4.5rem,auto)_1fr] gap-x-2 text-[12px] sm:grid-cols-[6rem_1fr] sm:text-[13px]">
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
    <section className="max-w-2xl rounded-[16px] border border-black/[0.06] bg-white/90 p-3.5 shadow-soft sm:p-4">
      <div className="flex items-start gap-3 sm:gap-3.5">
        <div
          className="relative flex h-[108px] w-[108px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06] sm:h-[120px] sm:w-[120px]"
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

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-genshin text-base tracking-wide text-foreground sm:text-lg">{name}</p>

          <div className="space-y-0.5">
            <div className="grid grid-cols-[minmax(4.5rem,auto)_1fr] items-center gap-x-2 text-[12px] sm:grid-cols-[6rem_1fr] sm:text-[13px]">
              <span className="font-medium text-muted-foreground">Редкость</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/stars/Quality_star_${stars}.svg`}
                alt={`${stars}★`}
                className="h-3 w-auto justify-self-start"
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
        <div className="mt-3 border-t border-black/[0.06] pt-3 text-[13px] font-medium leading-relaxed text-foreground whitespace-pre-line">
          {data.passive}
        </div>
      ) : null}
    </section>
  );
}
