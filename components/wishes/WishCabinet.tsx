"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { BannerPityStats } from "@/lib/wishes";
import { BANNER_LABELS, bannerKeyFromGachaType } from "@/lib/wishes";
import WishImportWizard from "@/components/wishes/WishImportWizard";

type WishDashboard = {
  account: { id: string; label: string; uid: string | null };
  total: number;
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

  return (
    <div className="pb-10">
      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
                Личный кабинет
              </p>
              <h1 className="font-genshin text-3xl tracking-wide text-foreground sm:text-4xl">
                Счётчик молитв
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {userName ? `Привет, ${userName}` : "Ваша история и pity"} — импорт с PC в
                два клика и облачное хранение.
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
        </div>
      </section>

      <section className="container-page mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {loading ? (
            <div className="glass-panel p-6 text-sm text-muted-foreground">Загрузка…</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {(data?.stats ?? []).map((stat) => (
                  <div key={stat.key} className="glass-panel p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                      {stat.label}
                    </p>
                    <p className="mt-3 font-genshin text-4xl text-foreground">{stat.pity5}</p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      pity до 5★ · 4★: {stat.pity4}
                    </p>
                    <p className="mt-3 text-xs font-medium text-foreground/70">
                      Всего: {stat.total}
                      {stat.last5Star ? (
                        <>
                          {" · последний: "}
                          {stat.last5StarHref ? (
                            <Link
                              href={stat.last5StarHref}
                              className="font-bold text-[#189b8e] hover:underline"
                            >
                              {stat.last5Star}
                            </Link>
                          ) : (
                            stat.last5Star
                          )}
                        </>
                      ) : null}
                    </p>
                  </div>
                ))}
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
                    Всего: {data?.total ?? 0}
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
                        <div>
                          <p className="font-bold text-foreground">
                            <span
                              className={
                                pull.rankType === "5"
                                  ? "text-amber-600"
                                  : pull.rankType === "4"
                                    ? "text-violet-600"
                                    : ""
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
                            className="text-xs font-bold text-[#189b8e] hover:underline"
                          >
                            Открыть гайд →
                          </Link>
                        ) : pull.itemType === "Character" ||
                          /character|персонаж/i.test(pull.itemType) ? (
                          <Link
                            href="/wiki/characters"
                            className="text-xs font-bold text-muted-foreground hover:text-[#189b8e] hover:underline"
                          >
                            Каталог →
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

        <div className="space-y-5">
          <WishImportWizard
            busy={busy}
            error={error}
            message={message}
            onImportUrl={importUrl}
            onImportJson={importJson}
            onClearFeedback={clearFeedback}
          />

          <div className="glass-panel p-5">
            <p className="text-sm font-bold text-foreground">Почему это удобнее</p>
            <ul className="mt-2 space-y-2 text-sm font-medium text-muted-foreground">
              <li>· Одна команда в PowerShell — ссылка сразу в буфере</li>
              <li>· Импорт кнопкой «из буфера», без ручного копирования URL</li>
              <li>· История в облаке + перенос JSON с paimon.moe</li>
              <li>· Pity по баннерам сразу после импорта</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
