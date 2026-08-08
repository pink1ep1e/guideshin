"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Gem, LogOut, Sparkles, Star, TrendingUp } from "lucide-react";
import type {
  BannerPityStats,
  GachaBannerKey,
  PityChartPoint,
  WishOverview,
} from "@/lib/wishes";
import {
  BANNER_LABELS,
  BANNER_SHORT,
  DASHBOARD_BANNERS,
  bannerKeyFromGachaType,
  pityChipTone,
} from "@/lib/wishes";
import WishImportWizard from "@/components/wishes/WishImportWizard";
import { WishPityAreaChart, WishRateCompare } from "@/components/wishes/WishCharts";
import { AnimatedNumber, PityRing } from "@/components/wishes/WishMotion";

type FiveStar = BannerPityStats["fiveStars"][number] & {
  guideHref?: string | null;
};

type Stat = Omit<BannerPityStats, "fiveStars"> & {
  last5StarHref?: string | null;
  fiveStars: FiveStar[];
};

type WishDashboard = {
  account: { id: string; label: string; uid: string | null };
  total: number;
  overview: WishOverview;
  pityChart: (PityChartPoint & { guideHref?: string | null })[];
  stats: Stat[];
  recent: {
    id: string;
    itemName: string;
    itemType: string;
    rankType: string;
    gachaType: string;
    wishTime: string;
    guideHref?: string | null;
  }[];
};

const chipClass = {
  good: "bg-emerald-500/12 text-emerald-800 ring-emerald-500/25",
  mid: "bg-amber-500/12 text-amber-900 ring-amber-500/25",
  bad: "bg-rose-500/12 text-rose-800 ring-rose-500/25",
} as const;

function fmtPct(n: number, d = 2) {
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
}

export default function WishCabinet({ userName }: { userName?: string | null }) {
  const [data, setData] = useState<WishDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<GachaBannerKey>("character");
  const [chartFilter, setChartFilter] = useState<GachaBannerKey | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishes");
      if (!res.ok) throw new Error("fail");
      setData((await res.json()) as WishDashboard);
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clearFeedback = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const runImport = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        const res = await fetch("/api/wishes/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as {
          error?: string;
          inserted?: number;
          totalParsed?: number;
        };
        if (!res.ok) throw new Error(json.error || "Ошибка импорта");
        setMessage(
          `Готово: разобрано ${json.totalParsed}, добавлено новых ${json.inserted}`,
        );
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка импорта");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const statsByKey = useMemo(() => {
    const map = new Map<GachaBannerKey, Stat>();
    for (const s of data?.stats ?? []) map.set(s.key, s);
    return map;
  }, [data?.stats]);

  const active = statsByKey.get(banner);

  return (
    <div className="pb-14">
      {/* Hero */}
      <section className="container-page pt-7 sm:pt-9">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f766e] via-[#189b8e] to-[#67d5cc] p-6 text-white shadow-panel sm:p-9"
        >
          <div className="pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-black/10 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/75">
                Личный кабинет
              </p>
              <h1 className="mt-1 font-genshin text-4xl tracking-wide sm:text-5xl">
                Счётчик молитв
              </h1>
              <p className="mt-2 max-w-lg text-sm font-medium text-white/85 sm:text-base">
                {userName ? `${userName} · ` : ""}
                Персонажи, оружие, стандарт и хроники — pity, шансы и история в одном месте.
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/25"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>

          {!loading && data?.overview && (
            <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroMetric
                icon={<Sparkles className="h-4 w-4" />}
                label="Молитв"
                value={data.overview.total}
              />
              <HeroMetric
                icon={<Gem className="h-4 w-4" />}
                label="Примогемы"
                value={data.overview.primogems}
              />
              <HeroMetric
                icon={<Star className="h-4 w-4" />}
                label="Шанс 5★"
                value={data.overview.rate5}
                format={(n) => `${fmtPct(n)}%`}
                hint={`${data.overview.count5} пятизвёздных`}
              />
              <HeroMetric
                icon={<TrendingUp className="h-4 w-4" />}
                label="Средний pity"
                value={data.overview.avgPity5 ?? 0}
                format={(n) =>
                  data.overview.avgPity5 == null ? "—" : fmtPct(n, 1)
                }
                hint="чем ниже, тем удачнее"
              />
            </div>
          )}
        </motion.div>
      </section>

      <section className="container-page mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {loading ? (
            <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
              Собираем кабинет…
            </div>
          ) : (
            <>
              {/* Banner switcher + detail — one composition */}
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45 }}
                className="glass-panel overflow-hidden p-5 sm:p-7"
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                      Баннеры
                    </p>
                    <h2 className="section-title text-[26px]">Текущий pity</h2>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {DASHBOARD_BANNERS.map((key) => {
                    const s = statsByKey.get(key);
                    const activeTab = banner === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBanner(key)}
                        className={`rounded-2xl px-4 py-2.5 text-left transition ${
                          activeTab
                            ? "bg-[#189b8e] text-white shadow-soft"
                            : "bg-black/[0.04] text-foreground/80 hover:bg-black/[0.07]"
                        }`}
                      >
                        <span className="block text-sm font-bold">
                          {BANNER_LABELS[key]}
                        </span>
                        <span
                          className={`block text-[11px] font-medium ${
                            activeTab ? "text-white/80" : "text-muted-foreground"
                          }`}
                        >
                          {s?.total ?? 0} молитв · pity {s?.pity5 ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {active && (
                    <motion.div
                      key={active.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p className="mb-5 text-sm font-medium text-muted-foreground">
                        {BANNER_SHORT[active.key]}
                      </p>

                      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
                        <div className="flex flex-wrap justify-center gap-8 lg:justify-start">
                          <PityRing
                            value={active.pity5}
                            max={active.pity5Max}
                            label="5★ pity"
                            accent="#c99212"
                          />
                          <PityRing
                            value={active.pity4}
                            max={active.pity4Max}
                            label="4★ pity"
                            accent="#6b5b95"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <StatCell
                            label="Всего молитв"
                            value={String(active.total)}
                            sub={`≈ ${active.primogems.toLocaleString("ru-RU")} примо`}
                          />
                          <StatCell
                            label="Шанс 5★"
                            value={`${fmtPct(active.rate5)}%`}
                            sub={`${active.count5} шт · ожидание ~1.6%`}
                            accent="text-[#c99212]"
                          />
                          <StatCell
                            label="Шанс 4★"
                            value={`${fmtPct(active.rate4)}%`}
                            sub={`${active.count4} шт · ожидание ~13%`}
                            accent="text-[#6b5b95]"
                          />
                          <StatCell
                            label="Средний pity 5★"
                            value={
                              active.avgPity5 != null
                                ? fmtPct(active.avgPity5, 1)
                                : "—"
                            }
                            sub={
                              active.last5Star
                                ? `Последний: ${active.last5Star}`
                                : "Ещё не выпадал 5★"
                            }
                          />
                        </div>
                      </div>

                      {active.fiveStars.length > 0 && (
                        <div className="mt-6 border-t border-black/[0.05] pt-5">
                          <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                            История 5★ · цвет = удача pity
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {active.fiveStars.map((f, i) => {
                              const tone = pityChipTone(f.pity, active.pity5Max);
                              const cls = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${chipClass[tone]}`;
                              const body = (
                                <>
                                  <span>{f.name}</span>
                                  <span className="opacity-70">{f.pity}</span>
                                </>
                              );
                              return f.guideHref ? (
                                <Link
                                  key={`${f.name}-${f.time}-${i}`}
                                  href={f.guideHref}
                                  className={`${cls} transition hover:brightness-95`}
                                >
                                  {body}
                                </Link>
                              ) : (
                                <span key={`${f.name}-${f.time}-${i}`} className={cls}>
                                  {body}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.45 }}
                  className="glass-panel p-5 sm:p-7"
                >
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                        Аналитика
                      </p>
                      <h2 className="section-title text-[24px]">Pity 5★ во времени</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        ["all", ...DASHBOARD_BANNERS] as (GachaBannerKey | "all")[]
                      ).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setChartFilter(key)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                            chartFilter === key
                              ? "bg-[#189b8e] text-white"
                              : "bg-black/[0.05] text-foreground/70"
                          }`}
                        >
                          {key === "all" ? "Все" : BANNER_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <WishPityAreaChart
                    data={data?.pityChart ?? []}
                    banner={chartFilter}
                  />
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.45 }}
                  className="glass-panel p-5 sm:p-7"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                    Сравнение
                  </p>
                  <h2 className="section-title mb-1 text-[24px]">Ваши шансы</h2>
                  <p className="mb-3 text-xs font-medium text-muted-foreground">
                    Цветной столбец — факт · серый — ожидание игры
                  </p>
                  <WishRateCompare
                    rate5={data?.overview.rate5 ?? 0}
                    rate4={data?.overview.rate4 ?? 0}
                  />
                </motion.section>
              </div>

              {/* History */}
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
                className="glass-panel p-5 sm:p-7"
              >
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                      Лента
                    </p>
                    <h2 className="section-title text-[24px]">Последние молитвы</h2>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">
                    {(data?.total ?? 0).toLocaleString("ru-RU")} всего
                  </p>
                </div>
                {(data?.recent.length ?? 0) === 0 ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    История пуста — импортируйте молитвы справа.
                  </p>
                ) : (
                  <ul className="divide-y divide-black/[0.05]">
                    {data!.recent.map((pull, idx) => (
                      <motion.li
                        key={pull.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                        className="flex flex-wrap items-center justify-between gap-2 py-3.5"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            <span
                              className={
                                pull.rankType === "5"
                                  ? "text-[#c99212]"
                                  : pull.rankType === "4"
                                    ? "text-[#6b5b95]"
                                    : "text-muted-foreground"
                              }
                            >
                              {pull.rankType}★
                            </span>{" "}
                            {pull.itemName}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {BANNER_LABELS[bannerKeyFromGachaType(pull.gachaType)]} ·{" "}
                            {new Date(pull.wishTime).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        {pull.guideHref && (
                          <Link
                            href={pull.guideHref}
                            className="text-xs font-bold text-[#189b8e] hover:underline"
                          >
                            Гайд →
                          </Link>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.section>
            </>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <WishImportWizard
            busy={busy}
            error={error}
            message={message}
            onImportUrl={(url) => runImport({ mode: "url", url })}
            onImportJson={(payload) => runImport({ mode: "json", payload })}
            onClearFeedback={clearFeedback}
          />
        </aside>
      </section>
    </div>
  );
}

function HeroMetric({
  icon,
  label,
  value,
  format,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">
        {icon}
        {label}
      </div>
      <AnimatedNumber
        value={value}
        format={format ?? ((n) => Math.round(n).toLocaleString("ru-RU"))}
        className="font-genshin text-3xl tracking-wide text-white"
      />
      {hint ? (
        <p className="mt-0.5 text-[11px] font-medium text-white/70">{hint}</p>
      ) : null}
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-genshin text-2xl text-foreground ${accent ?? ""}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{sub}</p>
    </div>
  );
}
