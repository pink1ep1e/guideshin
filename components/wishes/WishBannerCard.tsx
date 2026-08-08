"use client";

import Link from "next/link";
import type { BannerPityStats } from "@/lib/wishes";
import { pityChipTone } from "@/lib/wishes";

type FiveStarRow = BannerPityStats["fiveStars"][number] & {
  guideHref?: string | null;
};

type Stat = Omit<BannerPityStats, "fiveStars"> & {
  last5StarHref?: string | null;
  fiveStars: FiveStarRow[];
};

function fmt(n: number, digits = 1) {
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function PityBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "gold" | "purple";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const bar =
    tone === "gold"
      ? "from-[#f0c14a] to-[#d4a017]"
      : "from-[#b39ddb] to-[#7c5cbf]";

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
        <span className="font-genshin text-2xl leading-none text-foreground">
          {value}
          <span className="ml-1 text-sm font-sans font-bold text-muted-foreground">
            / {max}
          </span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const chipClass = {
  good: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/20",
  mid: "bg-amber-500/15 text-amber-800 ring-amber-500/25",
  bad: "bg-rose-500/15 text-rose-800 ring-rose-500/20",
} as const;

export default function WishBannerCard({ stat }: { stat: Stat }) {
  return (
    <article className="glass-panel flex flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Баннер
          </p>
          <h3 className="font-genshin text-xl tracking-wide text-foreground">
            {stat.label}
          </h3>
        </div>
        <div className="rounded-2xl bg-[#189b8e]/10 px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#189b8e]/80">
            Всего
          </p>
          <p className="font-genshin text-xl text-foreground">{stat.total}</p>
        </div>
      </div>

      <div className="space-y-4">
        <PityBar
          label="5★ pity"
          value={stat.pity5}
          max={stat.pity5Max}
          tone="gold"
        />
        <PityBar
          label="4★ pity"
          value={stat.pity4}
          max={stat.pity4Max}
          tone="purple"
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-black/[0.03] px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">5★</p>
          <p className="text-lg font-bold text-[#d4a017]">{fmt(stat.rate5)}%</p>
          <p className="text-[11px] text-muted-foreground">{stat.count5} шт</p>
        </div>
        <div className="rounded-xl bg-black/[0.03] px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">4★</p>
          <p className="text-lg font-bold text-[#7c5cbf]">{fmt(stat.rate4)}%</p>
          <p className="text-[11px] text-muted-foreground">{stat.count4} шт</p>
        </div>
        <div className="rounded-xl bg-black/[0.03] px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Avg 5★</p>
          <p className="text-lg font-bold text-foreground">
            {stat.avgPity5 != null ? fmt(stat.avgPity5, 1) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">pity</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        ≈ {stat.primogems.toLocaleString("ru-RU")} примогемов
        {stat.last5Star ? (
          <>
            {" · "}
            {stat.last5StarHref ? (
              <Link href={stat.last5StarHref} className="font-bold text-[#189b8e] hover:underline">
                {stat.last5Star}
              </Link>
            ) : (
              <span className="font-bold text-foreground/80">{stat.last5Star}</span>
            )}
          </>
        ) : null}
      </p>

      {stat.fiveStars.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-black/[0.05] pt-4">
          {stat.fiveStars.slice(0, 12).map((f, i) => {
            const tone = pityChipTone(f.pity, stat.pity5Max);
            const inner = (
              <>
                <span className="truncate">{f.name}</span>
                <span className="opacity-70">{f.pity}</span>
              </>
            );
            const cls = `inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${chipClass[tone]}`;
            return f.guideHref ? (
              <Link key={`${f.name}-${f.time}-${i}`} href={f.guideHref} className={cls}>
                {inner}
              </Link>
            ) : (
              <span key={`${f.name}-${f.time}-${i}`} className={cls}>
                {inner}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}
