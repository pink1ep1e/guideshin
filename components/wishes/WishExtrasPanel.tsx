"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Bell,
  Crosshair,
  Dices,
  GitCompare,
  Share2,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import type { GachaBannerKey } from "@/lib/wishes";
import FancySelect from "@/components/ui/FancySelect";
import { SERVER_LABEL, WISH_SERVER_OPTIONS } from "@/lib/wish-servers";

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

type FiveStarShot = {
  name: string;
  image?: string | null;
  time: string;
  itemType: string;
  banner?: string;
};

type AccountLike = { id: string; label: string; server: string };

type CompareSnap = {
  label: string;
  total: number;
  rate5: number;
  avgPity5: number | null;
  characterPity: number;
  characterMax: number;
  weaponPity: number;
  weaponMax: number;
};

type Props = {
  accountId: string;
  accountLabel: string;
  stats: StatLike[];
  overview: {
    total: number;
    primogems: number;
    rate5: number;
    rate4: number;
    count5: number;
    avgPity5: number | null;
  };
  recentFiveStars: FiveStarShot[];
  accounts: AccountLike[];
};

export default function WishExtrasPanel({
  accountId,
  accountLabel,
  stats,
  overview,
  recentFiveStars,
  accounts,
}: Props) {
  const [compareId, setCompareId] = useState<string>("");
  const [compare, setCompare] = useState<CompareSnap | null>(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const shareRef = useRef<HTMLCanvasElement>(null);

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

  const compareOptions = useMemo(
    () =>
      accounts
        .filter((a) => a.id !== accountId)
        .map((a) => {
          const serverOpt = WISH_SERVER_OPTIONS.find((s) => s.value === a.server);
          return {
            value: a.id,
            label: `${a.label} · ${SERVER_LABEL[a.server] || a.server}`,
            icon: serverOpt?.icon,
          };
        }),
    [accountId, accounts],
  );

  const runCompare = useCallback(async () => {
    if (!compareId || compareId === accountId) return;
    setCompareBusy(true);
    try {
      const res = await fetch(
        `/api/wishes?accountId=${encodeURIComponent(compareId)}`,
      );
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
        characterPity: ch?.pity5 ?? 0,
        characterMax: ch?.pity5Max ?? 90,
        weaponPity: wp?.pity5 ?? 0,
        weaponMax: wp?.pity5Max ?? 80,
      });
    } finally {
      setCompareBusy(false);
    }
  }, [accountId, compareId]);

  const selfCompare = useMemo(() => {
    const ch = stats.find((s) => s.key === "character");
    const wp = stats.find((s) => s.key === "weapon");
    return {
      label: accountLabel,
      total: overview.total,
      rate5: overview.rate5,
      avgPity5: overview.avgPity5,
      characterPity: ch?.pity5 ?? 0,
      characterMax: ch?.pity5Max ?? 90,
      weaponPity: wp?.pity5 ?? 0,
      weaponMax: wp?.pity5Max ?? 80,
    } satisfies CompareSnap;
  }, [accountLabel, overview, stats]);

  const drawShare = useCallback(async () => {
    const canvas = shareRef.current;
    if (!canvas || shareBusy) return;
    setShareBusy(true);
    try {
      const w = 1080;
      const h = 1620;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#062e2a");
      grad.addColorStop(0.45, "#0f5c54");
      grad.addColorStop(1, "#1aad9f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // soft orbs
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.arc(920, 160, 260, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(120, 1480, 200, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 34px system-ui, sans-serif";
      ctx.fillText("GUIDESHIN", 72, 88);
      ctx.font = "600 58px system-ui, sans-serif";
      ctx.fillText("Счётчик молитв", 72, 160);
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.font = "500 30px system-ui, sans-serif";
      ctx.fillText(accountLabel, 72, 210);

      const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
      const recent = [...recentFiveStars]
        .filter((f) => new Date(f.time).getTime() >= sixMonthsAgo)
        .sort(
          (a, b) =>
            new Date(b.time).getTime() - new Date(a.time).getTime(),
        )
        .slice(0, 8);

      // Stats grid 2x3
      const pityLines = stats.slice(0, 4).map((s) => ({
        label: s.label,
        value: `${s.pity5}/${s.pity5Max}`,
      }));
      const tiles = [
        {
          label: "Всего молитв",
          value: overview.total.toLocaleString("ru-RU"),
        },
        {
          label: "Примогемы",
          value: overview.primogems.toLocaleString("ru-RU"),
        },
        { label: "Шанс 5★", value: `${overview.rate5.toFixed(2)}%` },
        { label: "Шанс 4★", value: `${overview.rate4.toFixed(2)}%` },
        {
          label: "Средний гарант",
          value:
            overview.avgPity5 == null ? "—" : overview.avgPity5.toFixed(1),
        },
        {
          label: "Всего 5★",
          value: String(overview.count5),
        },
      ];

      const tileW = (w - 72 * 2 - 24) / 2;
      const tileH = 118;
      tiles.forEach((tile, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 72 + col * (tileW + 24);
        const y = 260 + row * (tileH + 18);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        roundRect(ctx, x, y, tileW, tileH, 22);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "600 24px system-ui, sans-serif";
        ctx.fillText(tile.label, x + 28, y + 42);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 44px system-ui, sans-serif";
        ctx.fillText(tile.value, x + 28, y + 92);
      });

      // Banner pity row
      let pityY = 260 + 3 * (tileH + 18) + 28;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 28px system-ui, sans-serif";
      ctx.fillText("Гарант по баннерам", 72, pityY);
      pityY += 24;
      for (const line of pityLines) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        roundRect(ctx, 72, pityY, w - 144, 64, 16);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "600 24px system-ui, sans-serif";
        ctx.fillText(line.label, 100, pityY + 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 28px system-ui, sans-serif";
        const tw = ctx.measureText(line.value).width;
        ctx.fillText(line.value, w - 100 - tw, pityY + 40);
        pityY += 76;
      }

      // Recent 5★ portraits
      pityY += 12;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 28px system-ui, sans-serif";
      ctx.fillText("5★ за 6 месяцев", 72, pityY);
      pityY += 28;

      const slot = 112;
      const gap = 14;
      const imgs = await Promise.all(
        recent.map((f) => (f.image ? loadImage(f.image) : Promise.resolve(null))),
      );

      recent.forEach((f, i) => {
        const x = 72 + i * (slot + gap);
        if (x + slot > w - 72) return;
        const isWeapon = /weapon|оруж/i.test(f.itemType);
        ctx.fillStyle = isWeapon
          ? "rgba(201,146,18,0.28)"
          : "rgba(255,255,255,0.14)";
        roundRect(ctx, x, pityY, slot, slot, 18);
        ctx.fill();
        const img = imgs[i];
        if (img) {
          ctx.save();
          roundRect(ctx, x, pityY, slot, slot, 18);
          ctx.clip();
          ctx.drawImage(img, x, pityY, slot, slot);
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.font = "700 28px system-ui, sans-serif";
          ctx.fillText("5★", x + 34, pityY + 64);
        }
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "600 16px system-ui, sans-serif";
        const short =
          f.name.length > 11 ? `${f.name.slice(0, 10)}…` : f.name;
        const nw = ctx.measureText(short).width;
        ctx.fillText(short, x + (slot - nw) / 2, pityY + slot + 26);
      });

      if (recent.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = "500 24px system-ui, sans-serif";
        ctx.fillText("Пока нет 5★ за этот период", 72, pityY + 48);
      }

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "500 26px system-ui, sans-serif";
      ctx.fillText("guideshin.ru/wishes", 72, h - 56);

      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `guideshin-${accountLabel.replace(/\s+/g, "-")}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
          }
          resolve();
        }, "image/png");
      });
    } finally {
      setShareBusy(false);
    }
  }, [accountLabel, overview, recentFiveStars, shareBusy, stats]);

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

      <section
        data-tour="tour-share"
        className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
              Карточка для сторис
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Статистика, гаранты и 5★ за полгода — одним PNG
            </p>
          </div>
          <button
            type="button"
            disabled={shareBusy}
            onClick={() => void drawShare()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#189b8e] px-5 py-3 text-base font-bold text-white transition hover:bg-[#147f74] disabled:opacity-60"
          >
            <Share2 className="h-5 w-5" />
            {shareBusy ? "Собираем…" : "Скачать карточку"}
          </button>
        </div>
        <canvas ref={shareRef} className="hidden" />
      </section>

      {accounts.length > 1 && (
        <section
          data-tour="tour-compare"
          className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8"
        >
          <div className="mb-4 flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-[#189b8e]" />
            <h2 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
              Сравнение аккаунтов
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <FancySelect
                label="Второй аккаунт"
                value={compareId}
                onChange={(id) => {
                  setCompareId(id);
                  setCompare(null);
                }}
                options={compareOptions}
                placeholder="Выберите второй аккаунт"
                className="[&_button]:min-h-[52px] [&_button]:rounded-2xl [&_button]:px-4 [&_button]:py-3 [&_button]:text-base"
              />
            </div>
            <button
              type="button"
              disabled={!compareId || compareBusy}
              onClick={() => void runCompare()}
              className="min-h-[52px] rounded-2xl bg-[#189b8e] px-6 py-3 text-base font-bold text-white disabled:opacity-50"
            >
              {compareBusy ? "Сравниваем…" : "Сравнить"}
            </button>
          </div>
          {compare && (
            <CompareArena left={selfCompare} right={compare} />
          )}
        </section>
      )}
    </div>
  );
}

function CompareArena({
  left,
  right,
}: {
  left: CompareSnap;
  right: CompareSnap;
}) {
  const rows: CompareRow[] = [
    {
      key: "total",
      label: "Молитв",
      icon: Dices,
      left: left.total,
      right: right.total,
      format: (n) =>
        n == null ? "—" : Math.round(n).toLocaleString("ru-RU"),
      higherWins: true,
      tip: "Больше молитв — больше статистики, но не обязательно больше удачи.",
    },
    {
      key: "rate5",
      label: "Шанс 5★",
      icon: Sparkles,
      left: left.rate5,
      right: right.rate5,
      format: (n) => (n == null ? "—" : `${n.toFixed(2)}%`),
      higherWins: true,
      tip: "Доля пятизвёздных среди всех молитв. База игры ≈1,6%.",
    },
    {
      key: "avg",
      label: "Средний гарант",
      icon: Crosshair,
      left: left.avgPity5,
      right: right.avgPity5,
      format: (n) => (n == null ? "—" : n.toFixed(1)),
      higherWins: false,
      tip: "Среднее число круток между 5★. Меньше — обычно везло раньше.",
    },
    {
      key: "char",
      label: "Персонажи",
      icon: Trophy,
      left: left.characterPity,
      right: right.characterPity,
      max: Math.max(left.characterMax, right.characterMax, 90),
      format: (n, side) =>
        `${Math.round(n ?? 0)}/${side === "left" ? left.characterMax : right.characterMax}`,
      higherWins: null,
      tip: "Текущий счётчик до жёсткого гаранта на баннере персонажей.",
      showBar: true,
    },
    {
      key: "weapon",
      label: "Оружие",
      icon: Swords,
      left: left.weaponPity,
      right: right.weaponPity,
      max: Math.max(left.weaponMax, right.weaponMax, 80),
      format: (n, side) =>
        `${Math.round(n ?? 0)}/${side === "left" ? left.weaponMax : right.weaponMax}`,
      higherWins: null,
      tip: "Текущий счётчик до жёсткого гаранта на баннере оружия.",
      showBar: true,
    },
  ];

  return (
    <div className="mt-6 rounded-3xl border border-black/[0.05] bg-gradient-to-br from-[#f4faf9] via-white to-[#f7f5ef]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-black/[0.05] px-4 py-4 sm:px-6">
        <CompareHeader name={left.label} side="left" />
        <span className="rounded-full bg-[#189b8e]/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#189b8e]">
          VS
        </span>
        <CompareHeader name={right.label} side="right" />
      </div>

      <div className="divide-y divide-black/[0.04] px-3 py-2 sm:px-4">
        {rows.map((row) => (
          <CompareMetricRow key={row.key} row={row} />
        ))}
      </div>
    </div>
  );
}

type CompareRow = {
  key: string;
  label: string;
  icon: typeof Dices;
  left: number | null;
  right: number | null;
  format: (n: number | null, side: "left" | "right") => string;
  /** true = bigger better, false = smaller better, null = neutral */
  higherWins: boolean | null;
  tip: string;
  max?: number;
  showBar?: boolean;
};

function CompareHeader({
  name,
  side,
}: {
  name: string;
  side: "left" | "right";
}) {
  return (
    <div className={side === "right" ? "text-right" : "text-left"}>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {side === "left" ? "Вы" : "Соперник"}
      </p>
      <p className="truncate font-genshin text-xl text-foreground sm:text-2xl">
        {name}
      </p>
    </div>
  );
}

function CompareMetricRow({ row }: { row: CompareRow }) {
  const [tip, setTip] = useState(false);
  const Icon = row.icon;
  const l = row.left;
  const r = row.right;
  let winner: "left" | "right" | "tie" | "none" = "none";
  if (l != null && r != null && row.higherWins != null) {
    if (l === r) winner = "tie";
    else if (row.higherWins) winner = l > r ? "left" : "right";
    else winner = l < r ? "left" : "right";
  }

  const maxBar = row.max ?? Math.max(l ?? 0, r ?? 0, 1);

  return (
    <div
      className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3.5 sm:gap-4"
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <div className="min-w-0">
        <p
          className={`font-genshin text-xl tabular-nums sm:text-2xl ${
            winner === "left" ? "text-[#189b8e]" : "text-foreground"
          }`}
        >
          {row.format(l, "left")}
        </p>
        {row.showBar ? (
          <PityMiniBar value={l ?? 0} max={maxBar} accent="#189b8e" align="left" />
        ) : (
          <RelativeBar
            value={l}
            other={r}
            higherWins={row.higherWins}
            side="left"
            accent="#189b8e"
          />
        )}
      </div>

      <div className="flex w-[7.5rem] flex-col items-center gap-1 text-center sm:w-36">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <Icon className="h-4 w-4 text-[#189b8e]" />
        </span>
        <p className="text-xs font-bold text-foreground/80">{row.label}</p>
        {winner === "left" || winner === "right" ? (
          <span className="rounded-full bg-[#189b8e]/10 px-2 py-0.5 text-[10px] font-bold text-[#147f74]">
            {winner === "left" ? "← лучше" : "лучше →"}
          </span>
        ) : winner === "tie" ? (
          <span className="text-[10px] font-bold text-muted-foreground">
            ничья
          </span>
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground">
            сейчас
          </span>
        )}
      </div>

      <div className="min-w-0 text-right">
        <p
          className={`font-genshin text-xl tabular-nums sm:text-2xl ${
            winner === "right" ? "text-[#c99212]" : "text-foreground"
          }`}
        >
          {row.format(r, "right")}
        </p>
        {row.showBar ? (
          <PityMiniBar value={r ?? 0} max={maxBar} accent="#c99212" align="right" />
        ) : (
          <RelativeBar
            value={r}
            other={l}
            higherWins={row.higherWins}
            side="right"
            accent="#c99212"
          />
        )}
      </div>

      {tip ? (
        <div className="pointer-events-none absolute left-1/2 top-[calc(100%-4px)] z-20 w-[min(280px,90vw)] -translate-x-1/2 rounded-2xl border border-black/[0.06] bg-white px-3 py-2 text-center text-xs leading-snug text-foreground/75 shadow-[0_12px_32px_-16px_rgba(15,70,60,0.45)]">
          {row.tip}
        </div>
      ) : null}
    </div>
  );
}

function PityMiniBar({
  value,
  max,
  accent,
  align,
}: {
  value: number;
  max: number;
  accent: string;
  align: "left" | "right";
}) {
  const pct = Math.min(100, Math.max(0, (value / Math.max(max, 1)) * 100));
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
      <div
        className={`h-full rounded-full ${align === "right" ? "ml-auto" : ""}`}
        style={{ width: `${pct}%`, backgroundColor: accent }}
      />
    </div>
  );
}

function RelativeBar({
  value,
  other,
  higherWins,
  side,
  accent,
}: {
  value: number | null;
  other: number | null;
  higherWins: boolean | null;
  side: "left" | "right";
  accent: string;
}) {
  if (value == null || other == null || higherWins == null) {
    return <div className="mt-1.5 h-1.5" />;
  }
  const max = Math.max(Math.abs(value), Math.abs(other), 0.01);
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
      <div
        className={`h-full rounded-full transition-all ${
          side === "right" ? "ml-auto" : ""
        }`}
        style={{ width: `${pct}%`, backgroundColor: accent }}
      />
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

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Сохранить authkey после импорта (для будущего обновления). */
export { setSavedAuthUrl as rememberAuthUrl } from "@/lib/wish-cabinet-extras";
