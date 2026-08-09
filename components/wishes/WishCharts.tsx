"use client";

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
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import type { GachaBannerKey, PityChartPoint } from "@/lib/wishes";
import { BANNER_LABELS } from "@/lib/wishes";

const TEAL = "#189b8e";
const GOLD = "#c99212";
const VIOLET = "#6b5b95";
const EXPECTED_GRAY = "#94a3b8";

type ChartPoint = PityChartPoint & { guideHref?: string | null };

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    month: "short",
    year: "2-digit",
  });
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint & { month: string } }[];
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs shadow-panel">
      <p className="font-bold text-foreground">{p.name}</p>
      <p className="mt-0.5 text-foreground/80">
        Гарант <span className="font-bold text-foreground">{p.pity}</span>
        {" · "}
        {BANNER_LABELS[p.banner]}
      </p>
      <p className="text-foreground/65">
        {new Date(p.time).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

export function WishPityAreaChart({
  data,
  banner,
}: {
  data: ChartPoint[];
  banner: GachaBannerKey | "all";
}) {
  const filtered =
    banner === "all" ? data : data.filter((d) => d.banner === banner);
  const chartData = filtered.map((d, i) => ({
    ...d,
    index: i + 1,
    month: monthLabel(d.time),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-black/[0.02] text-sm font-medium text-muted-foreground">
        Нет 5★ на этом баннере — импортируйте историю
      </div>
    );
  }

  return (
    <motion.div
      key={banner}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 12, left: -8, bottom: 8 }}
        >
          <defs>
            <linearGradient id="wishPityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.4} />
              <stop offset="70%" stopColor={TEAL} stopOpacity={0.08} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 8"
            stroke="rgba(0,0,0,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#4b5563", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            domain={[0, 90]}
            ticks={[0, 30, 60, 90]}
            tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="pity"
            name="гарант"
            stroke={TEAL}
            strokeWidth={3}
            fill="url(#wishPityGrad)"
            dot={{ r: 4, fill: "#fff", stroke: TEAL, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: TEAL, stroke: "#fff", strokeWidth: 2 }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
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
    <div className="rounded-2xl border border-black/[0.12] bg-white px-3.5 py-2.5 text-xs shadow-panel">
      <p className="font-bold text-[#0b1f44]">{label}</p>
      {expected != null && (
        <p className="mt-1.5 font-semibold text-[#475569]">
          Ожидание: {expected.value}%
        </p>
      )}
      {actual != null && (
        <p className="font-bold text-[#0b1f44]">У вас: {actual.value}%</p>
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
            stroke="rgba(0,0,0,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#111", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 20]}
            tick={{ fontSize: 11, fill: "#6b7280" }}
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
            wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
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
