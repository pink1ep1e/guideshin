"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clover,
  Flame,
  Gem,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { WishAchievements } from "@/lib/wish-luck";

type BannerPity = {
  pity5: number;
  pity5Max: number;
  remaining5: number;
  softPityAt: number;
  guaranteed5?: boolean;
};

type Props = {
  achievements: WishAchievements | null;
  loading?: boolean;
  characterBanner?: BannerPity | null;
};

const SCENARIOS = [
  {
    id: "usual",
    label: "Как обычно",
    hint: "дейлики + события",
    pullsIn6Weeks: 45,
  },
  {
    id: "abyss",
    label: "Бездна 36★",
    hint: "+ исследование",
    pullsIn6Weeks: 62,
  },
  {
    id: "pass",
    label: "Луна + БП",
    hint: "платный профиль",
    pullsIn6Weeks: 95,
  },
] as const;

function fmt(n: number) {
  return Math.round(n).toLocaleString("ru-RU");
}

export default function WishAchievementsPanel({
  achievements,
  loading,
  characterBanner,
}: Props) {
  const [goalName, setGoalName] = useState("");
  const [scenario, setScenario] =
    useState<(typeof SCENARIOS)[number]["id"]>("usual");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("guideshin-wish-goal-v1");
      if (raw) setGoalName(raw);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (goalName.trim()) {
        localStorage.setItem("guideshin-wish-goal-v1", goalName.trim());
      }
    } catch {
      /* ignore */
    }
  }, [goalName]);

  const activeScenario = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];

  const forecast = useMemo(() => {
    const pity = characterBanner?.pity5 ?? 0;
    const max = characterBanner?.pity5Max ?? 90;
    const remaining = characterBanner?.remaining5 ?? Math.max(0, max - pity);
    const softAt = characterBanner?.softPityAt ?? 74;
    const projected = pity + activeScenario.pullsIn6Weeks;
    const toSoft = Math.max(0, softAt - pity);
    const enoughSoft = activeScenario.pullsIn6Weeks >= toSoft;
    const enoughHard = activeScenario.pullsIn6Weeks >= remaining;
    return {
      pity,
      max,
      remaining,
      projected: Math.min(max, projected),
      enoughSoft,
      enoughHard,
      pullsIn6Weeks: activeScenario.pullsIn6Weeks,
    };
  }, [activeScenario, characterBanner]);

  if (loading && !achievements) {
    return (
      <section
        data-tour="tour-luck"
        className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8"
      >
        <div className="h-8 w-40 animate-pulse rounded-lg bg-black/[0.06]" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-36 animate-pulse rounded-2xl bg-black/[0.04]" />
          <div className="h-36 animate-pulse rounded-2xl bg-black/[0.04]" />
          <div className="h-36 animate-pulse rounded-2xl bg-black/[0.04]" />
        </div>
      </section>
    );
  }

  if (!achievements) return null;

  const recent = achievements.streaks.recent.slice(-5);
  const pads = Math.max(0, 5 - recent.length);
  const dots: Array<"win" | "loss" | "guarantee" | "empty"> = [
    ...Array.from({ length: pads }, () => "empty" as const),
    ...recent,
  ];

  const badges = [
    achievements.luckBadge
      ? { label: "Удача 50:50", ok: true }
      : { label: "Ещё копим удачу", ok: false },
    achievements.topPercent != null && achievements.topPercent <= 25
      ? { label: `Топ ${achievements.topPercent}%`, ok: true }
      : { label: "Ранг растёт", ok: false },
    achievements.activePlayer
      ? { label: "Активный игрок", ok: true }
      : { label: "Новичок кабинета", ok: false },
    achievements.streaks.bestWins >= 3
      ? { label: `Серия ×${achievements.streaks.bestWins}`, ok: true }
      : { label: "Первая серия впереди", ok: false },
  ];

  return (
    <div className="space-y-6" data-tour="tour-luck">
      <section className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
            Достижения
          </h2>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-black/[0.05] px-3.5 py-2 text-sm font-bold text-foreground/75 transition hover:bg-black/[0.08]"
          >
            Все достижения
            <ChevronDown
              className={`h-4 w-4 transition ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-black/[0.05] bg-[#f7faf9] p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              50:50
            </p>
            <p className="mt-1 text-sm text-foreground/65">Выиграно</p>
            <p className="mt-2 font-genshin text-4xl text-[#189b8e]">
              {achievements.fiftyTotal > 0
                ? `${Math.round(achievements.fiftyWinRate)}%`
                : "—"}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#189b8e]/12 px-2.5 py-1 text-xs font-bold text-[#147f74]">
              <Clover className="h-3.5 w-3.5" />
              {achievements.luckBadge ? "Удача" : "Копим"}
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </article>

          <article className="rounded-2xl border border-black/[0.05] bg-[#f7faf9] p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Общий ранг
            </p>
            <p className="mt-2 font-genshin text-4xl text-foreground">
              {achievements.rank != null
                ? fmt(achievements.rank)
                : "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {achievements.sampleSize >= 2
                ? `из ${fmt(achievements.sampleSize)} на Guideshin`
                : "мало данных сообщества"}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#7c5cff]/12 px-2.5 py-1 text-xs font-bold text-[#5b3fd6]">
              <Trophy className="h-3.5 w-3.5" />
              {achievements.topPercent != null
                ? `Топ ${achievements.topPercent}%`
                : "Ранг"}
              <Gem className="h-3.5 w-3.5" />
            </div>
          </article>

          <article className="rounded-2xl border border-black/[0.05] bg-[#f7faf9] p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Молитв всего
            </p>
            <p className="mt-2 font-genshin text-4xl text-foreground">
              {fmt(achievements.totalPulls)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">С начала игры</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#189b8e]/12 px-2.5 py-1 text-xs font-bold text-[#147f74]">
              <Flame className="h-3.5 w-3.5" />
              {achievements.activePlayer ? "Активный игрок" : "В разгоне"}
            </div>
          </article>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-black/[0.05] bg-[#f7faf9] px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground">Серия побед 50:50</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Текущая серия выигрышей 50:50 подряд
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {dots.map((d, i) => (
                <span
                  key={`${d}-${i}`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                    d === "win"
                      ? "bg-[#189b8e] text-white"
                      : d === "loss"
                        ? "bg-red-100 text-red-600"
                        : d === "guarantee"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-black/[0.06] text-transparent"
                  }`}
                >
                  {d === "win" ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : d === "loss" ? (
                    "×"
                  ) : d === "guarantee" ? (
                    "G"
                  ) : (
                    "·"
                  )}
                </span>
              ))}
              {achievements.streaks.currentWins > 0 ? (
                <span className="text-sm font-bold text-[#189b8e]">
                  сейчас ×{achievements.streaks.currentWins}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 border-t border-black/[0.06] pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <Flame className="h-6 w-6 text-[#e67e22]" />
            <div>
              <p className="font-genshin text-3xl text-foreground">
                {achievements.streaks.bestWins}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Лучшая серия
              </p>
            </div>
          </div>
        </div>

        {showAll ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {badges.map((b) => (
              <div
                key={b.label}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  b.ok
                    ? "border-[#189b8e]/25 bg-[#189b8e]/8 text-[#147f74]"
                    : "border-black/[0.05] bg-black/[0.02] text-muted-foreground"
                }`}
              >
                {b.ok ? "✓ " : "○ "}
                {b.label}
              </div>
            ))}
            <p className="sm:col-span-2 text-sm text-foreground/65">
              {achievements.verdict}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-black/[0.06] bg-gradient-to-br from-[#eef8f6] via-white to-[#f7f5ef] p-6 sm:p-8">
        <div className="mb-1 flex items-center gap-2">
          <Target className="h-5 w-5 text-[#189b8e]" />
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#189b8e]">
            Account Lab
          </p>
        </div>
        <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
          Прогноз к цели
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-foreground/70">
          Не только «сколько уже есть», а сколько круток будет к баннеру — и
          хватит ли на софт / жёсткий гарант.
        </p>

        <label className="mt-5 block text-sm font-bold">Цель на баннер</label>
        <input
          value={goalName}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder="Например, Арлекино"
          className="mt-1.5 w-full max-w-md rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenario(s.id)}
              className={`rounded-2xl px-3.5 py-2 text-sm font-bold transition ${
                scenario === s.id
                  ? "bg-[#189b8e] text-white"
                  : "bg-white text-foreground/70 ring-1 ring-black/[0.06] hover:bg-black/[0.03]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {activeScenario.hint} · ~{activeScenario.pullsIn6Weeks} круток за 6
          недель
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.05] bg-white/90 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Сейчас
            </p>
            <p className="mt-1 font-genshin text-2xl text-foreground">
              {forecast.pity}/{forecast.max}
            </p>
            <p className="text-sm text-muted-foreground">
              до гаранта {forecast.remaining}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.05] bg-white/90 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Прогноз к баннеру
            </p>
            <p className="mt-1 font-genshin text-2xl text-foreground">
              ~{forecast.projected}/{forecast.max}
            </p>
            <p className="text-sm text-muted-foreground">
              +{forecast.pullsIn6Weeks} круток
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.05] bg-white/90 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Оценка
            </p>
            <p className="mt-1 font-genshin text-xl text-[#189b8e]">
              {forecast.enoughHard
                ? "Хватит на гарант"
                : forecast.enoughSoft
                  ? "Дойдёте до софта"
                  : "Нужно ещё копить"}
            </p>
            <p className="text-sm text-muted-foreground">
              {goalName.trim()
                ? `Цель: ${goalName.trim()}`
                : "Укажите персонажа выше"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-[#189b8e]/35 bg-white/70 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#189b8e]" />
            <div>
              <p className="font-bold text-foreground">
                Умные рекомендации — следующий шаг
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                Из Account Lab: если до цели не хватает круток, кабинет подскажет
                альтернативу — кого выгоднее крутить под ваш состав и уже
                имеющееся оружие. Пока зафиксируйте цель и сценарий игры выше.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
