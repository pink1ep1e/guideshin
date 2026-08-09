"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { CloudDownload, LogOut } from "lucide-react";
import type {
  BannerPityStats,
  GachaBannerKey,
  PityChartPoint,
  WishImportProgress,
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
import { friendlyWishImportError } from "@/lib/wish-errors";

type FiveStar = BannerPityStats["fiveStars"][number] & {
  guideHref?: string | null;
  image?: string | null;
};

type Stat = Omit<BannerPityStats, "fiveStars"> & {
  last5StarHref?: string | null;
  fiveStars: FiveStar[];
};

type LuckCompare = {
  sampleSize: number;
  communityAvgGarant: number;
  yourAvgGarant: number | null;
  luckierThanPercent: number | null;
  verdict: string;
};

type WishDashboard = {
  account: { id: string; label: string; uid: string | null };
  total: number;
  overview: WishOverview;
  pityChart: (PityChartPoint & {
    guideHref?: string | null;
    image?: string | null;
  })[];
  stats: Stat[];
  luck: LuckCompare | null;
  recent: {
    id: string;
    itemName: string;
    itemType: string;
    rankType: string;
    gachaType: string;
    wishTime: string;
    guideHref?: string | null;
    image?: string | null;
  }[];
};

const toneRing = {
  good: "ring-emerald-400/50 bg-emerald-50",
  mid: "ring-amber-400/50 bg-amber-50",
  bad: "ring-rose-400/45 bg-rose-50",
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
  const [progress, setProgress] = useState<WishImportProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<GachaBannerKey | "all">("all");
  const importRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishes");
      if (!res.ok) throw new Error("fail");
      setData((await res.json()) as WishDashboard);
    } catch {
      setError("Не удалось загрузить данные. Попробуйте обновить страницу.");
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
    setProgress(null);
  }, []);

  const scrollToImport = useCallback(() => {
    importRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const savePulls = useCallback(
    async (pulls: unknown) => {
      setProgress({
        phase: "saving",
        label: "Сохраняем молитвы в аккаунт…",
        step: 6,
        steps: 6,
        page: 0,
        totalPulled: Array.isArray(pulls) ? pulls.length : 0,
      });
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
      setProgress({
        phase: "connecting",
        label: "Подключаемся к Hoyoverse…",
        step: 0,
        steps: 6,
        page: 0,
        totalPulled: 0,
      });
      try {
        const result = await fetchAllWishesFromAuthUrl(url, setProgress);
        if (result.error) {
          const isNetwork =
            /связаться|VPN|сеть|Failed to fetch|NetworkError/i.test(
              result.error,
            );
          if (isNetwork) {
            setProgress({
              phase: "saving",
              label: "Сеть блокирует браузер — пробуем через сервер…",
              step: 6,
              steps: 6,
              page: 0,
              totalPulled: 0,
            });
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
        setError(friendlyWishImportError(e));
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [load, savePulls],
  );

  const importFromJson = useCallback(
    async (payload: unknown) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      setProgress({
        phase: "saving",
        label: "Разбираем JSON и сохраняем…",
        step: 6,
        steps: 6,
        page: 0,
        totalPulled: 0,
      });
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
        setError(friendlyWishImportError(e));
      } finally {
        setBusy(false);
        setProgress(null);
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={scrollToImport}
              className="inline-flex items-center gap-2 rounded-xl bg-[#189b8e] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#147f74]"
            >
              <CloudDownload className="h-4 w-4" />
              Счётчик молитв
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-bold text-foreground/80 transition hover:bg-black/[0.03]"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center text-sm text-muted-foreground">
            Загружаем…
          </div>
        ) : !hasPulls ? (
          <div ref={importRef} className="mx-auto max-w-xl">
            <WishImportWizard
              busy={busy}
              progress={progress}
              error={error}
              message={message}
              onImportUrl={importFromUrl}
              onImportJson={importFromJson}
              onClearFeedback={clearFeedback}
              compact
            />
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <OverviewTile label="Всего молитв" value={data!.overview.total} />
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {DASHBOARD_BANNERS.map((key, i) => {
                const s = statsByKey.get(key);
                if (!s) return null;
                return <BannerCard key={key} stat={s} delay={i * 0.05} />;
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-genshin text-xl text-foreground">
                      Гарант 5★ по месяцам
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Чем ниже точка — тем раньше выпал 5★ в этом месяце
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ["all", ...DASHBOARD_BANNERS] as (
                        | GachaBannerKey
                        | "all"
                      )[]
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
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                  График сравнивает ваш реальный процент 5★ и 4★ с базовыми
                  шансами игры (≈1,6% и ≈13%). Если цветной столбец выше серого —
                  вам выпадает чаще среднего; если ниже — реже. Это не «гарант»,
                  а общая удача по всей истории молитв.
                </p>
              </section>
            </div>

            {data?.luck && (
              <section className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-[#eef8f6] to-white p-5 sm:p-6">
                <h2 className="font-genshin text-xl text-foreground">
                  Сравнение удачи
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Насколько вы удачливее других игроков Guideshin (по среднему
                  гаранту 5★ — чем ниже, тем удачнее).
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <LuckTile
                    label="Вы удачливее чем"
                    value={
                      data.luck.luckierThanPercent == null
                        ? "—"
                        : `${data.luck.luckierThanPercent}%`
                    }
                    accent
                  />
                  <LuckTile
                    label="Ваш средний гарант"
                    value={
                      data.luck.yourAvgGarant == null
                        ? "—"
                        : String(data.luck.yourAvgGarant)
                    }
                  />
                  <LuckTile
                    label="Среднее сообщества"
                    value={String(data.luck.communityAvgGarant)}
                    hint={`${data.luck.sampleSize} аккаунтов`}
                  />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground/80">
                  {data.luck.verdict}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h2 className="mb-4 font-genshin text-xl text-foreground">
                История 5★
              </h2>
              <div className="space-y-6">
                {DASHBOARD_BANNERS.map((key) => {
                  const s = statsByKey.get(key);
                  if (!s || s.fiveStars.length === 0) return null;
                  return (
                    <div key={key}>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {BANNER_LABELS[key]}
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {s.fiveStars.map((f, i) => (
                          <FiveStarCard
                            key={`${f.name}-${f.time}-${i}`}
                            item={f}
                            max={s.pity5Max}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                      <div className="flex items-center gap-3">
                        {pull.image ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-black/[0.04]">
                            <Image
                              src={pull.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : null}
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
                            {
                              BANNER_LABELS[
                                bannerKeyFromGachaType(pull.gachaType)
                              ]
                            }{" "}
                            · {new Date(pull.wishTime).toLocaleString("ru-RU")}
                          </p>
                        </div>
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

              <aside ref={importRef} className="xl:sticky xl:top-24">
                <WishImportWizard
                  busy={busy}
                  progress={progress}
                  error={error}
                  message={message}
                  onImportUrl={importFromUrl}
                  onImportJson={importFromJson}
                  onClearFeedback={clearFeedback}
                  compact
                />
              </aside>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FiveStarCard({ item, max }: { item: FiveStar; max: number }) {
  const tone = pityChipTone(item.pity, max);
  const inner = (
    <>
      <div
        className={`relative aspect-square overflow-hidden rounded-xl ring-2 ${toneRing[tone]}`}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#dfecea] to-[#f4f7f6] font-genshin text-2xl text-[#189b8e]">
            5★
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white">
          {item.pity}
        </span>
      </div>
      <p className="mt-1.5 truncate text-center text-xs font-bold text-foreground">
        {item.name}
      </p>
      <p className="text-center text-[10px] text-muted-foreground">
        гарант {item.pity}
      </p>
    </>
  );

  if (item.guideHref) {
    return (
      <Link href={item.guideHref} className="block transition hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

function LuckTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-genshin text-2xl ${
          accent ? "text-[#189b8e]" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
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
  const bar = Math.min(1, stat.pity5 / stat.pity5Max);

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
            style={{ width: `${bar * 100}%`, backgroundColor: accent }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          До гаранта:{" "}
          <strong className="text-foreground">{stat.remaining5}</strong>
          {stat.pity5 >= stat.softPityAt ? (
            <span className="ml-2 font-bold text-amber-700">мягкий гарант</span>
          ) : (
            <span className="ml-2">мягкий с {stat.softPityAt}</span>
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
            <span className="text-xs text-muted-foreground">
              /{stat.pity4Max}
            </span>
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
