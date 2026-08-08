"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
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
  fetchAllWishesFromAuthUrl,
  pityChipTone,
} from "@/lib/wishes";
import WishImportWizard from "@/components/wishes/WishImportWizard";
import { WishPityAreaChart, WishRateCompare } from "@/components/wishes/WishCharts";
import { AnimatedNumber } from "@/components/wishes/WishMotion";

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

const bannerAccent: Record<GachaBannerKey, string> = {
  character: "#189b8e",
  weapon: "#c99212",
  permanent: "#5b7cfa",
  chronicled: "#9b6bff",
  novice: "#888",
};

function fmtPct(n: number, d = 2) {
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
}

function Primogem({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/primogem.png"
      alt=""
      width={20}
      height={20}
      className={`inline-block ${className}`}
    />
  );
}

export default function WishCabinet({ userName }: { userName?: string | null }) {
  const [data, setData] = useState<WishDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const savePulls = useCallback(
    async (pulls: unknown) => {
      const res = await fetch("/api/wishes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "pulls", pulls }),
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
    },
    [load],
  );

  const importFromUrl = useCallback(
    async (url: string) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        // Клиентский fetch к Hoyoverse (как paimon.moe)
        const result = await fetchAllWishesFromAuthUrl(url);
        if (result.error) {
          const isNetwork = /связаться|VPN|сеть|Failed to fetch|NetworkError/i.test(
            result.error,
          );
          if (isNetwork) {
            // Fallback: сервер тянет историю сам
            const res = await fetch("/api/wishes/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "url", url }),
            });
            const json = (await res.json()) as {
              error?: string;
              inserted?: number;
              totalParsed?: number;
            };
            if (!res.ok) throw new Error(json.error || result.error);
            setMessage(
              `Готово: разобрано ${json.totalParsed}, добавлено новых ${json.inserted}`,
            );
            await load();
            return;
          }
          throw new Error(result.error);
        }
        const serializable = result.pulls.map((p) => ({
          id: p.hoyoId,
          gacha_type: p.gachaType,
          name: p.itemName,
          item_type: p.itemType,
          rank_type: p.rankType,
          time: p.wishTime.toISOString(),
        }));
        await savePulls(serializable);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка импорта");
      } finally {
        setBusy(false);
      }
    },
    [load, savePulls],
  );

  const importFromJson = useCallback(
    async (payload: unknown) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        const res = await fetch("/api/wishes/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "json", payload }),
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

  const hasPulls = (data?.total ?? 0) > 0;

  return (
    <div className="pb-14">
      <section className="container-page-wide pt-6 sm:pt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#189b8e]">
              {userName || "Кабинет"}
            </p>
            <h1 className="font-genshin text-3xl tracking-wide text-foreground sm:text-4xl">
              Счётчик молитв
            </h1>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-bold text-foreground/80 transition hover:bg-black/[0.03]"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center text-sm text-muted-foreground">
            Загружаем…
          </div>
        ) : !hasPulls ? (
          <div className="mx-auto max-w-2xl">
            <WishImportWizard
              busy={busy}
              error={error}
              message={message}
              onImportUrl={importFromUrl}
              onImportJson={importFromJson}
              onClearFeedback={clearFeedback}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <OverviewTile
                label="Всего молитв"
                value={data!.overview.total}
              />
              <OverviewTile
                label="Примогемы"
                value={data!.overview.primogems}
                primogem
              />
              <OverviewTile
                label="Шанс 5★"
                value={data!.overview.rate5}
                format={(n) => `${fmtPct(n)}%`}
                hint={`${data!.overview.count5} пятизвёздных`}
              />
              <OverviewTile
                label="Средний гарант 5★"
                value={data!.overview.avgPity5 ?? 0}
                format={(n) =>
                  data!.overview.avgPity5 == null ? "—" : fmtPct(n, 1)
                }
              />
            </motion.div>

            {/* Banner cards — paimon-style grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {DASHBOARD_BANNERS.map((key, i) => {
                const s = statsByKey.get(key);
                if (!s) return null;
                return (
                  <BannerCard key={key} stat={s} delay={i * 0.05} />
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-genshin text-xl text-foreground">
                      Гарант 5★ по времени
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Чем ниже точка — тем раньше выпал 5★
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ["all", ...DASHBOARD_BANNERS] as (GachaBannerKey | "all")[]
                    ).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setChartFilter(key)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
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
              </section>

              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
                <h2 className="mb-1 font-genshin text-xl text-foreground">
                  Ваши шансы
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">
                  Цвет — факт · серый — ожидание игры
                </p>
                <WishRateCompare
                  rate5={data?.overview.rate5 ?? 0}
                  rate4={data?.overview.rate4 ?? 0}
                />
              </section>
            </div>

            {/* 5★ history per banner */}
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h2 className="mb-4 font-genshin text-xl text-foreground">
                История 5★
              </h2>
              <div className="grid gap-5 lg:grid-cols-2">
                {DASHBOARD_BANNERS.map((key) => {
                  const s = statsByKey.get(key);
                  if (!s || s.fiveStars.length === 0) return null;
                  return (
                    <div key={key}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {BANNER_LABELS[key]}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {s.fiveStars.map((f, i) => {
                          const tone = pityChipTone(f.pity, s.pity5Max);
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
                            <span
                              key={`${f.name}-${f.time}-${i}`}
                              className={cls}
                            >
                              {body}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent + re-import */}
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-end justify-between">
                  <h2 className="font-genshin text-xl text-foreground">
                    Последние молитвы
                  </h2>
                  <p className="text-sm font-bold text-muted-foreground">
                    {(data?.total ?? 0).toLocaleString("ru-RU")} всего
                  </p>
                </div>
                <ul className="divide-y divide-black/[0.05]">
                  {data!.recent.map((pull) => (
                    <li
                      key={pull.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
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
                        <p className="text-xs text-muted-foreground">
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
                    </li>
                  ))}
                </ul>
              </section>

              <aside className="xl:sticky xl:top-24">
                <WishImportWizard
                  busy={busy}
                  error={error}
                  message={message}
                  onImportUrl={importFromUrl}
                  onImportJson={importFromJson}
                  onClearFeedback={clearFeedback}
                />
              </aside>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewTile({
  label,
  value,
  format,
  hint,
  primogem,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  primogem?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        {primogem ? <Primogem className="h-5 w-5" /> : null}
        <AnimatedNumber
          value={value}
          format={format ?? ((n) => Math.round(n).toLocaleString("ru-RU"))}
          className="font-genshin text-2xl tracking-wide text-foreground"
        />
      </div>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function BannerCard({ stat, delay }: { stat: Stat; delay: number }) {
  const accent = bannerAccent[stat.key];
  const progress = Math.min(1, stat.pity5 / stat.pity5Max);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-genshin text-lg text-foreground">{stat.label}</h3>
          <p className="text-[11px] text-muted-foreground">
            {BANNER_SHORT[stat.key]}
          </p>
        </div>
        <span
          className="rounded-lg px-2 py-1 text-[11px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {stat.total} молитв
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-bold text-muted-foreground">
            Гарант 5★
          </span>
          <span className="font-genshin text-2xl" style={{ color: accent }}>
            {stat.pity5}
            <span className="text-sm text-muted-foreground">
              /{stat.pity5Max}
            </span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: accent,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          До гаранта: <strong className="text-foreground">{stat.remaining5}</strong>
          {stat.pity5 >= stat.softPityAt ? (
            <span className="ml-2 font-bold text-amber-700">soft pity</span>
          ) : (
            <span className="ml-2">
              soft с {stat.softPityAt}
            </span>
          )}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-black/[0.03] px-2 py-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            Гарант 4★
          </p>
          <p className="font-genshin text-lg text-foreground">
            {stat.pity4}
            <span className="text-xs text-muted-foreground">/{stat.pity4Max}</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            осталось {stat.remaining4}
          </p>
        </div>
        <div className="rounded-xl bg-black/[0.03] px-2 py-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            Потрачено
          </p>
          <p className="flex items-center justify-center gap-1 font-genshin text-lg text-foreground">
            <Primogem className="h-4 w-4" />
            {stat.primogems.toLocaleString("ru-RU")}
          </p>
        </div>
      </div>

      {stat.last5Star ? (
        <p className="truncate text-xs text-muted-foreground">
          Последний 5★:{" "}
          {stat.last5StarHref ? (
            <Link
              href={stat.last5StarHref}
              className="font-bold text-[#189b8e] hover:underline"
            >
              {stat.last5Star}
            </Link>
          ) : (
            <span className="font-bold text-foreground">{stat.last5Star}</span>
          )}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Ещё не было 5★</p>
      )}
    </motion.article>
  );
}
