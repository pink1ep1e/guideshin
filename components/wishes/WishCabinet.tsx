"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudDownload, LogOut, Plus, X } from "lucide-react";
import type {
  BannerPityStats,
  GachaBannerKey,
  WishImportProgress,
  WishOverview,
} from "@/lib/wishes";
import {
  BANNER_LABELS,
  BANNER_SHORT,
  DASHBOARD_BANNERS,
  bannerKeyFromGachaType,
  fetchAllWishesFromAuthUrl,
} from "@/lib/wishes";
import WishImportWizard from "@/components/wishes/WishImportWizard";
import { WishMonthlyPullChart, WishRateCompare } from "@/components/wishes/WishCharts";
import { AnimatedNumber } from "@/components/wishes/WishMotion";
import { friendlyWishImportError } from "@/lib/wish-errors";
import {
  ELEMENT_SVG,
  ELEMENT_THEME,
  RARITY_STARS,
  rarityBg,
  type ElementKey,
} from "@/lib/genshin";
import FancySelect from "@/components/ui/FancySelect";
import type { CommunityLuck, FiftyFiftyStats } from "@/lib/wish-luck";
import { SERVER_LABEL, WISH_SERVER_OPTIONS } from "@/lib/wish-servers";
import type { MonthlyPullPoint } from "@/lib/wishes";

type FiveStar = BannerPityStats["fiveStars"][number] & {
  guideHref?: string | null;
  image?: string | null;
  element?: string | null;
  rarity?: string | null;
};

type Stat = Omit<BannerPityStats, "fiveStars"> & {
  last5StarHref?: string | null;
  fiveStars: FiveStar[];
};

type GameAccount = {
  id: string;
  label: string;
  uid: string | null;
  server: string;
};

type ImportHistoryItem = {
  id: string;
  source: string;
  sourceLabel: string;
  label: string | null;
  pullCount: number;
  replacedPrevious: boolean;
  canRestore: boolean;
  createdAt: string;
};

type WishDashboard = {
  account: GameAccount;
  accounts: GameAccount[];
  total: number;
  overview: WishOverview;
  fifty: FiftyFiftyStats;
  monthlyChart: MonthlyPullPoint[];
  stats: Stat[];
  luck: CommunityLuck | null;
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
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<WishImportProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<GachaBannerKey | "all">("all");
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newServer, setNewServer] = useState("europe");
  const [imports, setImports] = useState<ImportHistoryItem[]>([]);
  const [undoId, setUndoId] = useState<string | null>(null);

  const loadImports = useCallback(async (id: string) => {
    try {
      const res = await fetch(
        `/api/wishes/imports?accountId=${encodeURIComponent(id)}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { imports: ImportHistoryItem[] };
      setImports(json.imports || []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(
    async (id?: string | null) => {
      setLoading(true);
      try {
        const q = id ? `?accountId=${encodeURIComponent(id)}` : "";
        const res = await fetch(`/api/wishes${q}`);
        if (!res.ok) throw new Error("fail");
        const json = (await res.json()) as WishDashboard;
        setData(json);
        setAccountId(json.account.id);
        void loadImports(json.account.id);
      } catch {
        setError("Не удалось загрузить данные. Попробуйте обновить страницу.");
      } finally {
        setLoading(false);
      }
    },
    [loadImports],
  );

  useEffect(() => {
    void load(accountId);
    // только первый mount / смена аккаунта через selectAccount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFeedback = useCallback(() => {
    setError(null);
    setMessage(null);
    setProgress(null);
  }, []);

  const selectAccount = useCallback(
    (id: string) => {
      setAccountId(id);
      void load(id);
    },
    [load],
  );

  const createAccount = useCallback(async () => {
    const res = await fetch("/api/wishes/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, server: newServer }),
    });
    const json = (await res.json()) as {
      error?: string;
      account?: GameAccount;
    };
    if (!res.ok || !json.account) {
      setError(json.error || "Не удалось создать аккаунт");
      return;
    }
    setAddOpen(false);
    setNewLabel("");
    setNewServer("europe");
    selectAccount(json.account.id);
  }, [newLabel, newServer, selectAccount]);

  const savePulls = useCallback(
    async (
      pulls: unknown,
      opts?: { replace?: boolean; source?: string },
    ) => {
      setProgress({
        phase: "saving",
        label: opts?.replace
          ? "Заменяем данные аккаунта…"
          : "Сохраняем молитвы в аккаунт…",
        step: 6,
        steps: 6,
        page: 0,
        totalPulled: Array.isArray(pulls) ? pulls.length : 0,
      });
      const res = await fetch("/api/wishes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "pulls",
          pulls,
          accountId,
          replace: opts?.replace === true,
          source: opts?.source || "pulls",
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        inserted?: number;
        totalParsed?: number;
        accountLabel?: string;
        replaced?: boolean;
      };
      if (!res.ok) throw new Error(json.error || "Ошибка импорта");
      setMessage(
        `${json.replaced ? "Данные заменены" : "Готово"} для «${json.accountLabel || data?.account.label}»: разобрано ${json.totalParsed}, сохранено ${json.inserted}`,
      );
      await load(accountId);
    },
    [accountId, data?.account.label, load],
  );

  const importFromPulls = useCallback(
    async (
      pulls: unknown[],
      opts: { replace?: boolean; source?: string },
    ) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        await savePulls(pulls, opts);
      } catch (e) {
        setError(friendlyWishImportError(e));
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [savePulls],
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
              body: JSON.stringify({ mode: "url", url, accountId }),
            });
            const json = (await res.json()) as {
              error?: string;
              inserted?: number;
              totalParsed?: number;
              accountLabel?: string;
            };
            if (!res.ok) throw new Error(json.error || result.error);
            setMessage(
              `Готово для «${json.accountLabel || data?.account.label}»: разобрано ${json.totalParsed}, добавлено ${json.inserted}`,
            );
            await load(accountId);
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
    [accountId, data?.account.label, load, savePulls],
  );

  const importFromJson = useCallback(
    async (
      payload: unknown,
      opts?: { replace?: boolean; source?: string },
    ) => {
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
          body: JSON.stringify({
            mode: "json",
            payload,
            accountId,
            replace: opts?.replace === true,
            source: opts?.source,
          }),
        });
        const json = (await res.json()) as {
          error?: string;
          inserted?: number;
          totalParsed?: number;
          accountLabel?: string;
          replaced?: boolean;
        };
        if (!res.ok) throw new Error(json.error || "Ошибка импорта");
        setMessage(
          `${json.replaced ? "Данные заменены" : "Готово"} для «${json.accountLabel || data?.account.label}»: разобрано ${json.totalParsed}, сохранено ${json.inserted}`,
        );
        await load(accountId);
      } catch (e) {
        setError(friendlyWishImportError(e));
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [accountId, data?.account.label, load],
  );

  const undoImport = useCallback(async () => {
    if (!undoId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/wishes/imports?id=${encodeURIComponent(undoId)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string; restored?: number };
      if (!res.ok) throw new Error(json.error || "Не удалось отменить");
      setMessage(
        json.restored
          ? `Импорт отменён, восстановлено ${json.restored} молитв`
          : "Импорт отменён",
      );
      setUndoId(null);
      await load(accountId);
    } catch (e) {
      setError(friendlyWishImportError(e));
      setUndoId(null);
    } finally {
      setBusy(false);
    }
  }, [accountId, load, undoId]);

  const statsByKey = useMemo(() => {
    const map = new Map<GachaBannerKey, Stat>();
    for (const s of data?.stats ?? []) map.set(s.key, s);
    return map;
  }, [data?.stats]);

  const hasPulls = (data?.total ?? 0) > 0;
  const activeAccount = data?.account;

  const wizard = (
    <WishImportWizard
      busy={busy}
      progress={progress}
      error={error}
      message={message}
      onImportUrl={importFromUrl}
      onImportJson={importFromJson}
      onImportPulls={importFromPulls}
      onProgressChange={setProgress}
      onClearFeedback={clearFeedback}
      compact
      targetAccountLabel={activeAccount?.label}
      targetAccountServer={
        activeAccount
          ? SERVER_LABEL[activeAccount.server] || activeAccount.server
          : null
      }
    />
  );

  return (
    <div className="pb-16 text-[15px] sm:text-base">
      <section className="container-page-wide pt-7 sm:pt-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#189b8e]">
              {userName || "Кабинет"}
            </p>
            <h1 className="font-genshin text-4xl tracking-wide text-foreground sm:text-[2.75rem]">
              Счётчик молитв
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#189b8e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#147f74]"
            >
              <CloudDownload className="h-4 w-4" />
              Авто-импорт
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-bold text-foreground/80 transition hover:bg-black/[0.03]"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>

        {/* Game accounts */}
        {!loading && data && (
          <div className="mb-6 flex flex-wrap items-stretch gap-2.5">
            {data.accounts.map((a) => {
              const active = a.id === data.account.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAccount(a.id)}
                  className={`min-h-[3.25rem] rounded-xl px-4 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[#189b8e] text-white shadow-soft"
                      : "bg-white text-foreground/80 ring-1 ring-black/[0.06] hover:bg-black/[0.03]"
                  }`}
                >
                  <span className="block font-bold leading-tight">{a.label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      active ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    {SERVER_LABEL[a.server] || a.server}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex min-h-[3.25rem] items-center gap-1.5 rounded-xl border border-dashed border-[#189b8e]/45 bg-white px-4 py-2.5 text-sm font-bold text-[#189b8e] transition hover:bg-[#189b8e]/5"
            >
              <Plus className="h-4 w-4" />
              Аккаунт
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-14 text-center text-base text-muted-foreground">
            Загружаем…
          </div>
        ) : !hasPulls ? (
          <div className="mx-auto max-w-2xl">{wizard}</div>
        ) : (
          <div className="space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
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
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-7">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-genshin text-2xl text-foreground">
                      Молитвы по месяцам
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Сколько круток сделано в каждом месяце
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
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
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
                <WishMonthlyPullChart
                  data={data?.monthlyChart ?? []}
                  banner={chartFilter}
                />
              </section>

              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-7">
                <h2 className="mb-1 font-genshin text-2xl text-foreground">
                  Ваши шансы
                </h2>
                <p className="mb-3 text-sm text-muted-foreground">
                  Серый — ожидание игры · цвет — ваш факт
                </p>
                <WishRateCompare
                  rate5={data?.overview.rate5 ?? 0}
                  rate4={data?.overview.rate4 ?? 0}
                />
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                  Сравнивает ваш процент 5★ и 4★ с базовыми шансами игры (≈1,6%
                  и ≈13%). Выше серого столбца — чаще среднего, ниже — реже.
                </p>
              </section>
            </div>

            {/* Luck vs community */}
            {data?.luck && (
              <section className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-[#eef8f6] to-white p-5 sm:p-7">
                <h2 className="font-genshin text-2xl text-foreground">
                  Удачливость среди игроков
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Сравнение с другими аккаунтами Guideshin: шансы 5★/4★,
                  выигранные 50:50 и объём молитв.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <LuckMetric
                    label="Шанс 5★"
                    yours={`${fmtPct(data.luck.your.rate5)}%`}
                    community={`${fmtPct(data.luck.community.avgRate5)}%`}
                    better={data.luck.betterThan.rate5}
                  />
                  <LuckMetric
                    label="Шанс 4★"
                    yours={`${fmtPct(data.luck.your.rate4)}%`}
                    community={`${fmtPct(data.luck.community.avgRate4)}%`}
                    better={data.luck.betterThan.rate4}
                  />
                  <LuckMetric
                    label="50:50 выиграно"
                    yours={
                      data.luck.your.fifty.total
                        ? `${data.luck.your.fifty.wins}/${data.luck.your.fifty.total} (${fmtPct(data.luck.your.fifty.winRate, 0)}%)`
                        : "—"
                    }
                    community={
                      data.luck.community.avgFiftyWinRate == null
                        ? "—"
                        : `${fmtPct(data.luck.community.avgFiftyWinRate, 0)}%`
                    }
                    better={data.luck.betterThan.fifty}
                  />
                  <LuckMetric
                    label="Молитв"
                    yours={data.luck.your.total.toLocaleString("ru-RU")}
                    community={data.luck.community.avgTotal.toLocaleString(
                      "ru-RU",
                    )}
                    better={data.luck.betterThan.total}
                  />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground/80">
                  {data.luck.verdict}
                  {data.luck.sampleSize >= 2 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · выборка {data.luck.sampleSize} акк.
                    </span>
                  ) : null}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-7">
              <h2 className="mb-4 font-genshin text-2xl text-foreground">
                История 5★
              </h2>
              <div className="space-y-6">
                {DASHBOARD_BANNERS.map((key) => {
                  const s = statsByKey.get(key);
                  if (!s || s.fiveStars.length === 0) return null;
                  return (
                    <div key={key}>
                      <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {BANNER_LABELS[key]}
                      </p>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-2.5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                        {s.fiveStars.map((f, i) => (
                          <FiveStarCard
                            key={`${f.name}-${f.time}-${i}`}
                            item={f}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="font-genshin text-2xl text-foreground">
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
                    className="flex flex-wrap items-center justify-between gap-2 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      {pull.image ? (
                        <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-black/[0.04]">
                          <Image
                            src={pull.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="44px"
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
                        <p className="text-sm text-muted-foreground">
                          {BANNER_LABELS[bannerKeyFromGachaType(pull.gachaType)]}{" "}
                          · {new Date(pull.wishTime).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    {pull.guideHref && (
                      <Link
                        href={pull.guideHref}
                        className="text-sm font-bold text-[#189b8e] hover:underline"
                      >
                        Гайд →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {imports.length > 0 && (
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-7">
                <h2 className="mb-1 font-genshin text-2xl text-foreground">
                  История импортов
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Можно отменить импорт и вернуть данные до него (если был
                  снимок).
                </p>
                <ul className="divide-y divide-black/[0.05]">
                  {imports.map((batch) => (
                    <li
                      key={batch.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                    >
                      <div>
                        <p className="font-bold text-foreground">
                          {batch.sourceLabel}
                          {batch.replacedPrevious ? (
                            <span className="ml-2 text-xs font-semibold text-[#c99212]">
                              с заменой
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(batch.createdAt).toLocaleString("ru-RU")} ·{" "}
                          {batch.pullCount.toLocaleString("ru-RU")} молитв
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setUndoId(batch.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        Отменить
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </section>

      {/* Auto-import dialog */}
      <AnimatePresence>
        {importOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setImportOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => setImportOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-2 text-foreground/70 shadow-sm ring-1 ring-black/[0.06]"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
              {wizard}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add account dialog */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-panel sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-genshin text-2xl text-foreground">
                Новый аккаунт Genshin
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ник и сервер игрового профиля — молитвы будут отдельно.
              </p>
              <label className="mt-5 block text-sm font-bold">Ник</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Например, Traveler EU"
                className="mt-1.5 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
              />
              <div className="mt-4">
                <FancySelect
                  label="Сервер"
                  value={newServer}
                  onChange={setNewServer}
                  options={[...WISH_SERVER_OPTIONS]}
                  placeholder="Выберите сервер"
                />
              </div>
              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="flex-1 rounded-xl border border-black/[0.08] py-3 text-sm font-bold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => void createAccount()}
                  className="flex-1 rounded-xl bg-[#189b8e] py-3 text-sm font-bold text-white"
                >
                  Добавить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo import confirm */}
      <AnimatePresence>
        {undoId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setUndoId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-genshin text-2xl text-foreground">
                Отменить импорт?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                Молитвы этого импорта будут удалены. Если импорт заменял данные,
                восстановим снимок до него.
              </p>
              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setUndoId(null)}
                  className="flex-1 rounded-xl border border-black/[0.08] py-3 text-sm font-bold disabled:opacity-50"
                >
                  Нет
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void undoImport()}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Отменить импорт
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FiveStarCard({ item }: { item: FiveStar }) {
  const stars = item.rarity
    ? (RARITY_STARS[item.rarity] ?? 5)
    : 5;
  const elKey = (item.element || "").toUpperCase() as ElementKey;
  const elementIcon = ELEMENT_SVG[elKey];
  const theme = ELEMENT_THEME[elKey];
  const glow = theme?.glow ?? "rgba(24,155,142,0.45)";
  const isWeapon = /weapon|оруж/i.test(item.itemType);

  const inner = (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-[12px] bg-card shadow-panel ring-1 ring-black/[0.06] transition duration-300 hover:ring-[#189b8e]/35 hover:shadow-[0_10px_24px_-12px_rgba(11,31,68,0.28)]">
      <div
        className="relative aspect-square w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${rarityBg(stars)})` }}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="relative z-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-genshin text-lg text-white/80">
            5★
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-9 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/stars/Quality_star_${stars}.svg`}
          alt=""
          className="absolute bottom-1 left-1/2 z-20 h-2.5 w-auto -translate-x-1/2"
        />

        {!isWeapon && elementIcon && (
          <span className="absolute left-1 top-1 z-20 flex h-5 w-5 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-[-2px] rounded-full blur-[6px]"
              style={{ backgroundColor: glow, opacity: 0.7 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={elementIcon}
              alt=""
              className="relative h-[16px] w-[16px]"
              style={{
                filter:
                  "drop-shadow(0 0 1.5px rgba(0,0,0,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
              }}
            />
          </span>
        )}

        <span className="absolute right-1 top-1 z-20 rounded-md bg-black/70 px-1 py-0.5 text-[10px] font-bold text-white">
          {/weapon|оруж/i.test(item.itemType)
            ? `R${item.constellation ?? 1}`
            : `C${item.constellation ?? 0}`}
        </span>
        <span className="absolute bottom-1 right-1 z-20 rounded-md bg-black/55 px-1 py-0.5 text-[9px] font-bold text-white/90">
          {item.pity}
        </span>
      </div>

      <div className="flex min-h-[1.75rem] shrink-0 items-center justify-center px-1 py-0.5">
        <p className="font-genshin line-clamp-2 w-full text-center text-[10px] leading-snug tracking-wide text-[#1e1e1e] [overflow-wrap:anywhere] sm:text-[11px]">
          {item.name}
        </p>
      </div>
    </div>
  );

  if (item.guideHref) {
    return (
      <Link href={item.guideHref} className="block">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
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
    <div className="rounded-xl border border-black/[0.05] bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-genshin text-xl text-foreground">{yours}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        сообщество: {community}
      </p>
      {better != null ? (
        <p className="mt-1 text-xs font-bold text-[#189b8e]">
          удачливее {better}% игроков
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">мало данных</p>
      )}
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
          <span className="font-bold text-foreground">{stat.last5Star}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Ещё не было 5★</p>
      )}
    </motion.article>
  );
}
