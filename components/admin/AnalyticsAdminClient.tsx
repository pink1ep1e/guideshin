"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Globe2,
  Loader2,
  MapPin,
  MousePointerClick,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import {
  ENTITY_TYPE_LABEL,
  EVENT_TYPE_LABEL,
} from "@/lib/analytics";

type RangeKey = "1d" | "7d" | "30d" | "90d";

type AnalyticsPayload = {
  range: string;
  since: string;
  summary: {
    pageviews: number;
    telegramClicks: number;
    uniqueVisitors: number;
    sessions: number;
  };
  topPaths: { path: string; count: number }[];
  topGuides: {
    entityType: string | null;
    entitySlug: string | null;
    entityName: string | null;
    count: number;
  }[];
  byCountry: {
    country: string | null;
    countryCode: string | null;
    count: number;
  }[];
  byDay: { day: string; views: number; visitors: number }[];
  telegramByPlacement: { placement: string; clicks: number }[];
  recent: Array<{
    id: string;
    type: string;
    path: string;
    title: string | null;
    entityType: string | null;
    entitySlug: string | null;
    entityName: string | null;
    ip: string | null;
    country: string | null;
    countryCode: string | null;
    city: string | null;
    region: string | null;
    referrer: string | null;
    language: string | null;
    screen: string | null;
    userAgent: string | null;
    meta: unknown;
    visitorId: string;
    sessionId: string;
    createdAt: string;
  }>;
};

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "1d", label: "24 часа" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

const PLACEMENT_LABEL: Record<string, string> = {
  navbar: "Шапка",
  sidebar: "Сайдбар",
  footer: "Подвал",
  unknown: "Другое",
};

function formatNum(n: number) {
  return n.toLocaleString("ru-RU");
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function guideHref(type: string | null, slug: string | null) {
  if (!type || !slug) return null;
  const map: Record<string, string> = {
    character: "/wiki/characters/",
    weapon: "/wiki/weapons/",
    artifact: "/wiki/artifacts/",
    material: "/wiki/materials/",
  };
  return map[type] ? `${map[type]}${slug}` : null;
}

function BarList({
  items,
  labelOf,
}: {
  items: { label: string; count: number; href?: string | null }[];
  labelOf?: (item: { label: string; count: number }) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-2.5">
      {items.length === 0 && (
        <li className="text-sm font-medium text-muted-foreground">Пока нет данных</li>
      )}
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate font-semibold text-foreground hover:text-[#189b8e]"
              >
                {labelOf ? labelOf(item) : item.label}
              </a>
            ) : (
              <span className="min-w-0 truncate font-semibold text-foreground">
                {labelOf ? labelOf(item) : item.label}
              </span>
            )}
            <span className="shrink-0 tabular-nums font-bold text-[#189b8e]">
              {formatNum(item.count)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#0b1f44]/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#189b8e] to-[#67d5cc]"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsAdminClient() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Ошибка загрузки");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Нет связи с сервером");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                range === r.value
                  ? "bg-[#189b8e] text-white"
                  : "bg-white text-foreground/70 ring-1 ring-black/[0.06] hover:text-[#189b8e]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load(range)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-bold text-foreground/80 transition hover:text-[#189b8e] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Обновить
        </button>
      </div>

      {error && (
        <p className="rounded-[14px] bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Просмотры",
            value: summary?.pageviews ?? 0,
            icon: Eye,
            tone: "bg-[#189b8e]/12 text-[#189b8e]",
          },
          {
            label: "Посетители",
            value: summary?.uniqueVisitors ?? 0,
            icon: Users,
            tone: "bg-[#1a5f8f]/12 text-[#1a5f8f]",
          },
          {
            label: "Сессии",
            value: summary?.sessions ?? 0,
            icon: MousePointerClick,
            tone: "bg-[#6b4ea0]/12 text-[#6b4ea0]",
          },
          {
            label: "Клики Telegram",
            value: summary?.telegramClicks ?? 0,
            icon: Send,
            tone: "bg-[#229ED9]/15 text-[#1b8bc0]",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {card.label}
                </p>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                {loading && !data ? "…" : formatNum(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft sm:p-5">
          <p className="mb-4 text-sm font-bold text-foreground">Топ гайдов</p>
          <BarList
            items={(data?.topGuides || []).map((g) => ({
              label: `${g.entityType}:${g.entitySlug}`,
              count: g.count,
              href: guideHref(g.entityType, g.entitySlug),
            }))}
            labelOf={(item) => {
              const g = data?.topGuides.find(
                (x) => `${x.entityType}:${x.entitySlug}` === item.label,
              );
              const type = g?.entityType
                ? ENTITY_TYPE_LABEL[g.entityType] || g.entityType
                : "";
              return `${g?.entityName || g?.entitySlug || "—"} · ${type}`;
            }}
          />
        </section>

        <section className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft sm:p-5">
          <p className="mb-4 text-sm font-bold text-foreground">Топ страниц</p>
          <BarList
            items={(data?.topPaths || []).map((p) => ({
              label: p.path,
              count: p.count,
              href: p.path,
            }))}
          />
        </section>

        <section className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-[#189b8e]" />
            <p className="text-sm font-bold text-foreground">Страны</p>
          </div>
          <BarList
            items={(data?.byCountry || []).map((c) => ({
              label: c.countryCode || "??",
              count: c.count,
            }))}
            labelOf={(item) => {
              const c = data?.byCountry.find((x) => (x.countryCode || "??") === item.label);
              return `${c?.country || "Неизвестно"}${c?.countryCode ? ` (${c.countryCode})` : ""}`;
            }}
          />
        </section>

        <section className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-[#229ED9]" />
            <p className="text-sm font-bold text-foreground">Telegram по местам</p>
          </div>
          <BarList
            items={(data?.telegramByPlacement || []).map((t) => ({
              label: t.placement,
              count: t.clicks,
            }))}
            labelOf={(item) => PLACEMENT_LABEL[item.label] || item.label}
          />
        </section>
      </div>

      {data?.byDay && data.byDay.length > 0 && (
        <section className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft sm:p-5">
          <p className="mb-4 text-sm font-bold text-foreground">По дням</p>
          <div className="flex h-36 items-end gap-1.5 sm:gap-2">
            {(() => {
              const max = Math.max(1, ...data.byDay.map((d) => d.views));
              return data.byDay.map((d) => {
                const h = Math.max(4, Math.round((d.views / max) * 100));
                const label = new Date(d.day).toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                });
                return (
                  <div key={String(d.day)} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                      {d.views}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#189b8e] to-[#67d5cc]"
                      style={{ height: `${h}%` }}
                      title={`${label}: ${d.views} просмотров, ${d.visitors} посетителей`}
                    />
                    <span className="truncate text-[9px] font-semibold text-muted-foreground">
                      {label}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white/90 shadow-soft">
        <div className="border-b border-black/[0.05] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#189b8e]" />
            <p className="text-sm font-bold text-foreground">Последние события</p>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            IP, страна, путь, устройство и время захода
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#189b8e]/8 text-xs uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Время</th>
                <th className="px-4 py-3 font-bold">Событие</th>
                <th className="px-4 py-3 font-bold">Страница</th>
                <th className="px-4 py-3 font-bold">Гео / IP</th>
                <th className="px-4 py-3 font-bold">Устройство</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {(data?.recent || []).map((ev) => {
                const meta =
                  ev.meta && typeof ev.meta === "object"
                    ? (ev.meta as Record<string, unknown>)
                    : null;
                const placement =
                  typeof meta?.placement === "string" ? meta.placement : null;
                return (
                  <tr key={ev.id} className="bg-white/40 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                      {formatWhen(ev.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#0b1f44]/[0.05] px-2 py-1 text-[11px] font-bold text-foreground">
                        {EVENT_TYPE_LABEL[ev.type] || ev.type}
                      </span>
                      {placement ? (
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                          {PLACEMENT_LABEL[placement] || placement}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {ev.entityName || ev.title || ev.path}
                      </p>
                      <p className="text-xs text-muted-foreground">{ev.path}</p>
                      {ev.referrer ? (
                        <p className="mt-0.5 max-w-[280px] truncate text-[11px] text-muted-foreground">
                          с: {ev.referrer}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {[ev.city, ev.region, ev.country].filter(Boolean).join(", ") ||
                          ev.countryCode ||
                          "—"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {ev.ip || "IP скрыт"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-foreground">
                        {ev.screen || "—"} · {ev.language || "—"}
                      </p>
                      <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-muted-foreground" title={ev.userAgent || ""}>
                        {ev.userAgent || "—"}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {ev.visitorId.slice(0, 14)}…
                      </p>
                    </td>
                  </tr>
                );
              })}
              {!loading && (data?.recent?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Событий пока нет — откройте сайт как посетитель, чтобы появились данные.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
