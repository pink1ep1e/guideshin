"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import type { GachaBannerKey, MonthlyPullPoint } from "@/lib/wishes";
import {
  formatVersionLabel,
  formatVersionStartRu,
  versionForMonthKey,
} from "@/lib/genshin-versions";
import { useTheme } from "next-themes";

const TEAL = "#189b8e";
const GOLD = "#c99212";
const VIOLET = "#6b5b95";
const EXPECTED_GRAY = "#94a3b8";
const CHRONICLE = "#9b6bff";

function useChartInk() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return {
    dark,
    brand: dark ? "#c4b194" : TEAL,
    peak: dark ? "#d3bc8e" : "#147f74",
    tick: dark ? "#b8ae9c" : "#4b5563",
    tickStrong: dark ? "#ece5d8" : "#111111",
    grid: dark ? "rgba(236,229,216,0.08)" : "rgba(0,0,0,0.05)",
    legend: dark ? "#cfc0a5" : "#334155",
  };
}

function MonthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const value = Number(payload[0].value) || 0;
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs shadow-panel dark:border-white/10">
      <p className="font-bold text-foreground">{label}</p>
      <p className="mt-1 font-bold text-[#189b8e]">
        {value.toLocaleString("ru-RU")} молитв
      </p>
    </div>
  );
}

function valueForBanner(
  d: MonthlyPullPoint,
  banner: GachaBannerKey | "all",
): number {
  if (banner === "all") return d.total;
  if (banner === "character") return d.character;
  if (banner === "weapon") return d.weapon;
  if (banner === "permanent") return d.permanent;
  if (banner === "chronicled") return d.chronicled;
  return d.total;
}

export function WishMonthlyPullChart({
  data,
  banner,
}: {
  data: MonthlyPullPoint[];
  banner: GachaBannerKey | "all";
}) {
  const ink = useChartInk();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        monthKey: d.monthKey,
        value: valueForBanner(d, banner),
      })),
    [data, banner],
  );

  const peak = useMemo(() => {
    let best: (typeof chartData)[number] | null = null;
    for (const row of chartData) {
      if (!best || row.value > best.value) best = row;
    }
    if (!best || best.value <= 0) return null;
    const version = versionForMonthKey(best.monthKey);
    return { ...best, version };
  }, [chartData]);

  if (chartData.length === 0 || chartData.every((d) => d.value === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-black/[0.02] text-sm font-medium text-muted-foreground">
        Нет данных — импортируйте историю
      </div>
    );
  }

  const barColor =
    banner === "weapon"
      ? GOLD
      : banner === "permanent"
        ? VIOLET
        : banner === "chronicled"
          ? CHRONICLE
          : ink.brand;

  return (
    <div>
      {peak ? (
        <div className="mb-4 rounded-2xl border border-black/[0.05] bg-[#f7faf9] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Самый активный месяц
          </p>
          <p className="mt-1 font-genshin text-xl text-foreground sm:text-2xl">
            {peak.label}
            <span className="ml-2 font-sans text-base font-bold text-[#189b8e]">
              {peak.value.toLocaleString("ru-RU")} круток
            </span>
          </p>
          {peak.version ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Обновление{" "}
              <span className="font-bold text-foreground">
                {formatVersionLabel(peak.version)}
              </span>
              {" · "}
              {peak.version.name}
              {" · с "}
              {formatVersionStartRu(peak.version)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Версия обновления для этого месяца не найдена
            </p>
          )}
        </div>
      ) : null}

      <motion.div
        key={banner}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="h-[300px] w-full min-h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 12, left: -8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="4 8"
              stroke={ink.grid}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: ink.tick, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: ink.tick, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<MonthTooltip />} />
            <Bar
              dataKey="value"
              name="Молитвы"
              fill={barColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              isAnimationActive={false}
            >
              {chartData.map((row) => (
                <Cell
                  key={row.monthKey}
                  fill={
                    peak && row.monthKey === peak.monthKey
                      ? ink.peak
                      : barColor
                  }
                  fillOpacity={
                    peak && row.monthKey === peak.monthKey ? 1 : 0.55
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

function RateTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const expected = payload.find((p) => p.dataKey === "expected");
  const actual = payload.find((p) => p.dataKey === "actual");
  return (
    <div className="rounded-2xl border border-black/[0.12] bg-white px-3.5 py-2.5 text-xs shadow-panel dark:border-white/10">
      <p className="font-bold text-foreground">{label}</p>
      {expected != null && (
        <p className="mt-1.5 font-semibold text-muted-foreground">
          Ожидание: {expected.value}%
        </p>
      )}
      {actual != null && (
        <p className="font-bold text-[#189b8e]">У вас: {actual.value}%</p>
      )}
    </div>
  );
}

export function WishRateCompare({
  rate5,
  rate4,
}: {
  rate5: number;
  rate4: number;
}) {
  const ink = useChartInk();
  const rows = [
    {
      name: "5★",
      actual: Number(rate5.toFixed(2)),
      expected: 1.6,
      actualFill: GOLD,
    },
    {
      name: "4★",
      actual: Number(rate4.toFixed(2)),
      expected: 13,
      actualFill: VIOLET,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="h-[240px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          barCategoryGap="28%"
          barGap={6}
        >
          <CartesianGrid
            strokeDasharray="4 8"
            stroke={ink.grid}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: ink.tickStrong, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 20]}
            tick={{ fontSize: 11, fill: ink.tick }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Tooltip content={<RateTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) =>
              value === "expected" ? "Ожидание" : "У вас"
            }
            wrapperStyle={{
              fontSize: 12,
              fontWeight: 600,
              color: ink.legend,
            }}
          />
          <Bar
            dataKey="expected"
            name="expected"
            fill={EXPECTED_GRAY}
            radius={[8, 8, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          />
          <Bar
            dataKey="actual"
            name="actual"
            radius={[8, 8, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          >
            {rows.map((r) => (
              <Cell key={r.name} fill={r.actualFill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
