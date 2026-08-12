"use client";

import { Check, Minus, Shield } from "lucide-react";
import type { CommunityLuck, WishAchievements } from "@/lib/wish-luck";

type Props = {
  luck: CommunityLuck | null;
  achievements: WishAchievements | null;
  loading?: boolean;
};

function fmtPct(n: number, d = 0) {
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
}

export default function WishAchievementsPanel({
  luck,
  achievements,
  loading,
}: Props) {
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
              className="h-32 animate-pulse rounded-2xl bg-white/80"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!luck) return null;

  const streaks = achievements?.streaks;
  const recent = (streaks?.recent ?? []).slice(-8);

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

      {streaks ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="rounded-2xl border border-black/[0.05] bg-white px-5 py-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Серия побед 50:50
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Последние исходы на ивенте персонажей
                </p>
              </div>
              <div className="text-right">
                <p className="font-genshin text-2xl leading-none text-[#189b8e]">
                  ×{streaks.currentWins}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  сейчас
                </p>
              </div>
            </div>

            {recent.length > 0 ? (
              <>
                <ol className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
                  {recent.map((d, i) => {
                    const label =
                      d === "win"
                        ? "Победа"
                        : d === "loss"
                          ? "Проигрыш"
                          : "Гарант";
                    return (
                      <li
                        key={`${d}-${i}`}
                        title={label}
                        className={`flex h-11 min-w-[2.75rem] flex-1 flex-col items-center justify-center rounded-xl border text-[10px] font-bold uppercase tracking-wide ${
                          d === "win"
                            ? "border-[#189b8e]/25 bg-[#189b8e]/10 text-[#147f74]"
                            : d === "loss"
                              ? "border-red-200 bg-red-50 text-red-600"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {d === "win" ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                        ) : d === "loss" ? (
                          <Minus className="h-3.5 w-3.5" strokeWidth={2.75} />
                        ) : (
                          <Shield className="h-3.5 w-3.5" strokeWidth={2.75} />
                        )}
                        <span className="mt-0.5 hidden sm:inline">
                          {d === "win" ? "W" : d === "loss" ? "L" : "G"}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2.5 text-xs text-muted-foreground">
                  <span className="text-[#147f74]">W</span> — победа 50:50 ·{" "}
                  <span className="text-red-600">L</span> — проигрыш ·{" "}
                  <span className="text-amber-700">G</span> — гарант
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Пока нет зафиксированных 50:50 — появятся после ивент-5★
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Лучшая серия
            </p>
            <p className="mt-2 font-genshin text-4xl leading-none text-foreground">
              ×{streaks.bestWins}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              побед 50:50 подряд
            </p>
          </div>
        </div>
      ) : null}

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
    <div className="rounded-2xl border border-black/[0.05] bg-white px-5 py-4">
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
