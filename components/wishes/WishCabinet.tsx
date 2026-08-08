"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Gem, Sparkles, Star, TrendingUp } from "lucide-react";
import type { BannerPityStats, PityChartPoint, WishOverview } from "@/lib/wishes";
import { BANNER_LABELS, bannerKeyFromGachaType } from "@/lib/wishes";
import WishImportWizard from "@/components/wishes/WishImportWizard";
import WishBannerCard from "@/components/wishes/WishBannerCard";
import { WishPityAreaChart, WishRateBars } from "@/components/wishes/WishCharts";

type WishDashboard = {
  account: { id: string; label: string; uid: string | null };
  total: number;
  overview: WishOverview;
  pityChart: (PityChartPoint & { guideHref?: string | null })[];
  stats: (BannerPityStats & {
    last5StarHref?: string | null;
    fiveStars: (BannerPityStats["fiveStars"][number] & {
      guideHref?: string | null;
    })[];
  })[];
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

function fmtInt(n: number) {
  return n.toLocaleString("ru-RU");
}

function fmtPct(n: number) {
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export default function WishCabinet({ userName }: { userName?: string | null }) {
  const [data, setData] = useState<WishDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishes");
      if (!res.ok) throw new Error("fail");
      const json = (await res.json()) as WishDashboard;
      setData(json);
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

  const importUrl = useCallback(
    async (url: string) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
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

  const importJson = useCallback(
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

  const overview = data?.overview;

  return (
    <div className="pb-12">
      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
          <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#189b8e]/10 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
                Личный кабинет
              </p>
              <h1 className="font-genshin text-3xl tracking-wide text-foreground sm:text-5xl">
                Счётчик молитв
              </h1>
              <p className="mt-2 max-w-xl text-sm font-medium text-muted-foreground sm:text-base">
                {userName ? `${userName}, ` : ""}
                pity, шансы и история — с графиками и ссылками на гайды Guideshin.
              </p>
            </div>
            <button
              type="button"
              className="ui-btn-secondary"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Выйти
            </button>
          </div>

          {!loading && overview && (
            <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewTile
                icon={<Sparkles className="h-4 w-4" />}
                label="Молитв"
                value={fmtInt(overview.total)}
              />
              <OverviewTile
                icon={<Gem className="h-4 w-4" />}
                label="Примогемы"
                value={fmtInt(overview.primogems)}
              />
              <OverviewTile
                icon={<Star className="h-4 w-4 text-[#d4a017]" />}
                label="Шанс 5★"
                value={`${fmtPct(overview.rate5)}%`}
                hint={`${overview.count5} пятизвёздных`}
              />
              <OverviewTile
                icon={<TrendingUp className="h-4 w-4" />}
                label="Средний pity 5★"
                value={
                  overview.avgPity5 != null ? fmtPct(overview.avgPity5).replace(/,00$/, "") : "—"
                }
                hint="ниже — удачнее"
              />
            </div>
          )}
        </div>
      </section>

      <section className="container-page mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {loading ? (
            <div className="glass-panel p-8 text-sm text-muted-foreground">
              Загружаем кабинет…
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                {(data?.stats ?? []).map((stat) => (
                  <WishBannerCard key={stat.key} stat={stat} />
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
                <div className="glass-panel p-5 sm:p-6">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                        График
                      </p>
                      <h2 className="section-title text-[22px]">Pity 5★ по времени</h2>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {data?.pityChart.length ?? 0} точек
                    </p>
                  </div>
                  <WishPityAreaChart data={data?.pityChart ?? []} />
                </div>

                <div className="glass-panel p-5 sm:p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                    Шансы
                  </p>
                  <h2 className="section-title mb-2 text-[22px]">Доля редкости</h2>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Ожидание: ~1.6% для 5★ · ~13% для 4★
                  </p>
                  <WishRateBars
                    rate5={overview?.rate5 ?? 0}
                    rate4={overview?.rate4 ?? 0}
                  />
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-6">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                      История
                    </p>
                    <h2 className="section-title text-[22px]">Последние молитвы</h2>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">
                    {fmtInt(data?.total ?? 0)} всего
                  </p>
                </div>
                {(data?.recent.length ?? 0) === 0 ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    Пока пусто — импортируйте историю справа.
                  </p>
                ) : (
                  <ul className="divide-y divide-black/[0.06]">
                    {data!.recent.map((pull) => (
                      <li
                        key={pull.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">
                            <span
                              className={
                                pull.rankType === "5"
                                  ? "text-[#d4a017]"
                                  : pull.rankType === "4"
                                    ? "text-[#7c5cbf]"
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
                        {pull.guideHref ? (
                          <Link
                            href={pull.guideHref}
                            className="shrink-0 text-xs font-bold text-[#189b8e] hover:underline"
                          >
                            Открыть гайд →
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <WishImportWizard
            busy={busy}
            error={error}
            message={message}
            onImportUrl={importUrl}
            onImportJson={importJson}
            onClearFeedback={clearFeedback}
          />
        </div>
      </section>
    </div>
  );
}

function OverviewTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white/70 px-4 py-3 shadow-soft">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#189b8e]">
        {icon}
        {label}
      </div>
      <p className="font-genshin text-2xl tracking-wide text-foreground sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
