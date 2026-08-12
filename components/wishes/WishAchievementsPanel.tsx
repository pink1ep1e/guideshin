"use client";

import type { CommunityLuck } from "@/lib/wish-luck";

type Props = {
  luck: CommunityLuck | null;
  loading?: boolean;
};

function fmtPct(n: number, d = 0) {
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
}

export default function WishAchievementsPanel({ luck, loading }: Props) {
  if (loading && !luck) {
    return (
      <section
        data-tour="tour-luck"
        className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8"
      >
        <div className="h-8 w-56 animate-pulse rounded-lg bg-black/[0.06]" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-black/[0.04]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!luck) return null;

  return (
    <section
      data-tour="tour-luck"
      className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8"
    >
      <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
        Удачливость среди игроков
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        Сравнение с другими аккаунтами Guideshin: шансы 5★/4★, выигранные 50:50
        и объём молитв.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LuckMetric
          label="Шанс 5★"
          yours={`${fmtPct(luck.your.rate5, 2)}%`}
          community={`${fmtPct(luck.community.avgRate5, 2)}%`}
          better={luck.betterThan.rate5}
        />
        <LuckMetric
          label="Шанс 4★"
          yours={`${fmtPct(luck.your.rate4, 2)}%`}
          community={`${fmtPct(luck.community.avgRate4, 2)}%`}
          better={luck.betterThan.rate4}
        />
        <LuckMetric
          label="50:50 выиграно"
          yours={
            luck.your.fifty.total
              ? `${luck.your.fifty.wins}/${luck.your.fifty.total} (${fmtPct(luck.your.fifty.winRate, 0)}%)`
              : "—"
          }
          community={
            luck.community.avgFiftyWinRate == null
              ? "—"
              : `${fmtPct(luck.community.avgFiftyWinRate, 0)}%`
          }
          better={luck.betterThan.fifty}
        />
        <LuckMetric
          label="Молитв"
          yours={luck.your.total.toLocaleString("ru-RU")}
          community={luck.community.avgTotal.toLocaleString("ru-RU")}
          better={luck.betterThan.total}
        />
      </div>

      <p className="mt-4 text-sm font-medium text-foreground/80">
        {luck.verdict}
        {luck.sampleSize >= 2 ? (
          <span className="text-muted-foreground">
            {" "}
            · выборка {luck.sampleSize} акк.
          </span>
        ) : null}
      </p>
    </section>
  );
}

function LuckMetric({
  label,
  yours,
  community,
  better,
}: {
  label: string;
  yours: string;
  community: string;
  better: number | null;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[#f7faf9] px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-genshin text-2xl text-foreground">{yours}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        сообщество: {community}
      </p>
      {better != null ? (
        <p className="mt-1.5 text-sm font-bold text-[#189b8e]">
          удачливее {better}% игроков
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">мало данных</p>
      )}
    </div>
  );
}
