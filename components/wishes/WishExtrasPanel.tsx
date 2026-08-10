"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Download,
  GitCompare,
  RefreshCw,
  Share2,
  Target,
} from "lucide-react";
import type { GachaBannerKey } from "@/lib/wishes";
import { BANNER_LABELS, DASHBOARD_BANNERS } from "@/lib/wishes";
import {
  costToHardPity,
  getBannerGoals,
  getSavedAuthUrl,
  setBannerGoal,
  setSavedAuthUrl,
  type BannerGoal,
} from "@/lib/wish-cabinet-extras";

type StatLike = {
  key: GachaBannerKey;
  label: string;
  pity5: number;
  pity5Max: number;
  remaining5: number;
  softPityAt: number;
  last5Star: string | null;
  total: number;
  rate5: number;
};

type AccountLike = { id: string; label: string; server: string };

type CompareSnap = {
  label: string;
  total: number;
  rate5: number;
  avgPity5: number | null;
  characterPity: string;
  weaponPity: string;
};

type Props = {
  accountId: string;
  accountLabel: string;
  stats: StatLike[];
  overview: {
    total: number;
    primogems: number;
    rate5: number;
    avgPity5: number | null;
  };
  accounts: AccountLike[];
  onRefreshUrl: (url: string) => Promise<void>;
  busy?: boolean;
};

export default function WishExtrasPanel({
  accountId,
  accountLabel,
  stats,
  overview,
  accounts,
  onRefreshUrl,
  busy,
}: Props) {
  const [goals, setGoals] = useState<BannerGoal[]>([]);
  const [goalDraft, setGoalDraft] = useState<Record<string, string>>({});
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string>("");
  const [compare, setCompare] = useState<CompareSnap | null>(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const shareRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setGoals(getBannerGoals(accountId));
    setSavedUrl(getSavedAuthUrl(accountId));
    const drafts: Record<string, string> = {};
    for (const g of getBannerGoals(accountId)) {
      drafts[g.banner] = g.targetName;
    }
    setGoalDraft(drafts);
  }, [accountId]);

  const alerts = useMemo(() => {
    const list: string[] = [];
    for (const s of stats) {
      if (s.pity5 >= s.softPityAt) {
        list.push(
          `${s.label}: софт гарант (сейчас ${s.pity5}/${s.pity5Max})`,
        );
      } else if (s.remaining5 <= 10 && s.total > 0) {
        list.push(
          `${s.label}: до жёсткого гаранта ${s.remaining5} круток`,
        );
      }
    }
    return list;
  }, [stats]);

  const saveGoal = useCallback(
    (banner: GachaBannerKey) => {
      const name = (goalDraft[banner] || "").trim();
      setBannerGoal(
        accountId,
        name ? { banner, targetName: name } : null,
        banner,
      );
      setGoals(getBannerGoals(accountId));
    },
    [accountId, goalDraft],
  );

  const handleRefresh = useCallback(async () => {
    if (!savedUrl) return;
    await onRefreshUrl(savedUrl);
  }, [onRefreshUrl, savedUrl]);

  const handleExport = useCallback(() => {
    window.location.href = `/api/wishes/export?accountId=${encodeURIComponent(accountId)}`;
  }, [accountId]);

  const runCompare = useCallback(async () => {
    if (!compareId || compareId === accountId) return;
    setCompareBusy(true);
    try {
      const res = await fetch(`/api/wishes?accountId=${encodeURIComponent(compareId)}`);
      const json = (await res.json()) as {
        account?: { label: string };
        overview?: { total: number; rate5: number; avgPity5: number | null };
        stats?: StatLike[];
      };
      if (!res.ok || !json.overview || !json.stats) return;
      const byKey = new Map(json.stats.map((s) => [s.key, s]));
      const ch = byKey.get("character");
      const wp = byKey.get("weapon");
      setCompare({
        label: json.account?.label || "Аккаунт",
        total: json.overview.total,
        rate5: json.overview.rate5,
        avgPity5: json.overview.avgPity5,
        characterPity: ch
          ? `${ch.pity5}/${ch.pity5Max}`
          : "—",
        weaponPity: wp ? `${wp.pity5}/${wp.pity5Max}` : "—",
      });
    } finally {
      setCompareBusy(false);
    }
  }, [accountId, compareId]);

  const drawShare = useCallback(() => {
    const canvas = shareRef.current;
    if (!canvas) return;
    const w = 1080;
    const h = 1350;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#0b3d38");
    grad.addColorStop(0.5, "#147f74");
    grad.addColorStop(1, "#189b8e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(900, 180, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.fillText("GUIDESHIN", 72, 110);
    ctx.font = "600 64px system-ui, sans-serif";
    ctx.fillText("Счётчик молитв", 72, 190);
    ctx.font = "400 36px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(accountLabel, 72, 250);

    const cardY = 320;
    const cardH = 180;
    const rows = [
      ["Всего молитв", overview.total.toLocaleString("ru-RU")],
      ["Примогемы", overview.primogems.toLocaleString("ru-RU")],
      ["Шанс 5★", `${overview.rate5.toFixed(2)}%`],
      [
        "Средний гарант",
        overview.avgPity5 == null ? "—" : overview.avgPity5.toFixed(1),
      ],
    ];
    rows.forEach((row, i) => {
      const y = cardY + i * (cardH + 24);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(ctx, 72, y, w - 144, cardH, 28);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "600 32px system-ui, sans-serif";
      ctx.fillText(row[0], 110, y + 70);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 64px system-ui, sans-serif";
      ctx.fillText(row[1], 110, y + 140);
    });

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillText("guideshin.ru/wishes", 72, h - 60);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `guideshin-${accountLabel.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }, [accountLabel, overview]);

  const currentChar = stats.find((s) => s.key === "character");

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-950">Алерты по гаранту</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900/90">
                {alerts.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
        <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
          До гаранта
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Сколько круток, примогемов и пачек до жёсткого гаранта 5★
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const cost = costToHardPity(s.remaining5);
            const soft =
              s.pity5 >= s.softPityAt
                ? "софт гарант"
                : `софт с ${s.softPityAt}`;
            return (
              <div
                key={s.key}
                className="rounded-2xl border border-black/[0.05] bg-[#f7faf9] px-4 py-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 font-genshin text-2xl text-foreground">
                  {s.pity5}
                  <span className="text-base text-muted-foreground">
                    /{s.pity5Max}
                  </span>
                </p>
                <p className="mt-2 text-sm text-foreground/75">
                  Ещё <strong>{cost.pulls}</strong> ·{" "}
                  <strong>{cost.primogems.toLocaleString("ru-RU")}</strong>{" "}
                  примо · <strong>{cost.packs}</strong> пачек
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{soft}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-[#189b8e]" />
          <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
            План на баннер
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Укажите цель — будем показывать прогресс к гаранту рядом с именем
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {DASHBOARD_BANNERS.map((key) => {
            const s = stats.find((x) => x.key === key);
            const goal = goals.find((g) => g.banner === key);
            return (
              <div
                key={key}
                className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4"
              >
                <p className="text-sm font-bold text-foreground">
                  {BANNER_LABELS[key]}
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={goalDraft[key] || ""}
                    onChange={(e) =>
                      setGoalDraft((d) => ({ ...d, [key]: e.target.value }))
                    }
                    placeholder="Например: Райдэн"
                    className="min-w-0 flex-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189b8e]/25"
                  />
                  <button
                    type="button"
                    onClick={() => saveGoal(key)}
                    className="rounded-xl bg-[#189b8e] px-3 py-2 text-sm font-bold text-white"
                  >
                    ОК
                  </button>
                </div>
                {goal && s ? (
                  <p className="mt-2 text-sm text-foreground/70">
                    Цель: <strong>{goal.targetName}</strong> · сейчас{" "}
                    {s.pity5}/{s.pity5Max} · до гаранта {s.remaining5}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#189b8e]" />
            <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
              Обновить историю
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Сохраните ссылку с authkey в браузере — потом обновление в один
            клик (ключ не уходит на сервер до импорта).
          </p>
          <input
            value={savedUrl || ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              setSavedUrl(v || null);
              setSavedAuthUrl(accountId, v || null);
            }}
            placeholder="https://…authkey=…"
            className="mt-4 w-full rounded-2xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#189b8e]/25"
          />
          <button
            type="button"
            disabled={busy || !savedUrl}
            onClick={() => void handleRefresh()}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#189b8e] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить сейчас
          </button>
        </div>

        <div className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={drawShare}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#189b8e] px-5 py-3 text-sm font-bold text-white"
            >
              <Share2 className="h-4 w-4" />
              Скачать карточку
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#189b8e] px-5 py-3 text-sm font-bold text-[#189b8e]"
            >
              <Download className="h-4 w-4" />
              Экспорт UIGF
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            PNG для сторис и JSON для paimon.moe / других трекеров.
            {currentChar
              ? ` Сейчас на персонажах ${currentChar.pity5}/${currentChar.pity5Max}.`
              : null}
          </p>
          <canvas ref={shareRef} className="hidden" />
        </div>
      </section>

      {accounts.length > 1 && (
        <section className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-[#189b8e]" />
            <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
              Сравнение аккаунтов
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
              className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
            >
              <option value="">Выберите второй аккаунт</option>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
            </select>
            <button
              type="button"
              disabled={!compareId || compareBusy}
              onClick={() => void runCompare()}
              className="rounded-2xl bg-[#189b8e] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Сравнить
            </button>
          </div>
          {compare && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <CompareCard
                title={accountLabel}
                total={overview.total}
                rate5={overview.rate5}
                avgPity5={overview.avgPity5}
                characterPity={
                  stats.find((s) => s.key === "character")
                    ? `${stats.find((s) => s.key === "character")!.pity5}/${stats.find((s) => s.key === "character")!.pity5Max}`
                    : "—"
                }
                weaponPity={
                  stats.find((s) => s.key === "weapon")
                    ? `${stats.find((s) => s.key === "weapon")!.pity5}/${stats.find((s) => s.key === "weapon")!.pity5Max}`
                    : "—"
                }
              />
              <CompareCard
                title={compare.label}
                total={compare.total}
                rate5={compare.rate5}
                avgPity5={compare.avgPity5}
                characterPity={compare.characterPity}
                weaponPity={compare.weaponPity}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CompareCard({
  title,
  total,
  rate5,
  avgPity5,
  characterPity,
  weaponPity,
}: {
  title: string;
  total: number;
  rate5: number;
  avgPity5: number | null;
  characterPity: string;
  weaponPity: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[#f7faf9] p-4">
      <p className="font-bold text-foreground">{title}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-foreground/75">
        <li>Молитв: {total.toLocaleString("ru-RU")}</li>
        <li>Шанс 5★: {rate5.toFixed(2)}%</li>
        <li>
          Средний гарант:{" "}
          {avgPity5 == null ? "—" : avgPity5.toFixed(1)}
        </li>
        <li>Персонажи: {characterPity}</li>
        <li>Оружие: {weaponPity}</li>
      </ul>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Вызывать из импорта URL, чтобы сохранить ключ для «Обновить». */
export function rememberAuthUrl(accountId: string, url: string) {
  setSavedAuthUrl(accountId, url);
}
