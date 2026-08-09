"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import type { GachaBannerKey, PityChartPoint } from "@/lib/wishes";
import { BANNER_LABELS } from "@/lib/wishes";

const TEAL = "#189b8e";
const GOLD = "#c99212";
const VIOLET = "#6b5b95";

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
      <p className="mt-0.5 text-foreground/75">
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
    ts: new Date(d.time).getTime(),
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
  payload?: { dataKey?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const expected = payload.find((p) => p.dataKey === "expected");
  const actual = payload.find((p) => p.dataKey === "actual");
  return (
    <div className="rounded-2xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-xs shadow-panel">
      <p className="font-bold text-foreground">{label}</p>
      {expected != null && (
        <p className="mt-1 font-semibold text-foreground/70">
          Ожидание: {expected.value}%
        </p>
      )}
      {actual != null && (
        <p className="font-bold text-foreground">У вас: {actual.value}%</p>
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
      fill: GOLD,
    },
    {
      name: "4★",
      actual: Number(rate4.toFixed(2)),
      expected: 13,
      fill: VIOLET,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="h-[220px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={8}
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
          <Bar
            dataKey="expected"
            name="expected"
            fill="rgba(0,0,0,0.12)"
            radius={[10, 10, 0, 0]}
            barSize={28}
            animationDuration={800}
          />
          <Bar
            dataKey="actual"
            name="actual"
            radius={[10, 10, 0, 0]}
            barSize={28}
            animationDuration={900}
          >
            {rows.map((r) => (
              <Cell key={r.name} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
