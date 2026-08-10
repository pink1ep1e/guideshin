"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Bell, GitCompare, Share2 } from "lucide-react";
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
        characterPity: ch ? `${ch.pity5}/${ch.pity5Max}` : "—",
        weaponPity: wp ? `${wp.pity5}/${wp.pity5Max}` : "—",
      });
    } finally {
      setCompareBusy(false);
    }
  }, [accountId, compareId]);

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
                onChange={setCompareId}
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
          Средний гарант: {avgPity5 == null ? "—" : avgPity5.toFixed(1)}
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
