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

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/95 px-3.5 py-2.5 text-xs shadow-panel backdrop-blur">
      <p className="font-bold text-foreground">{p.name}</p>
      <p className="mt-0.5 text-muted-foreground">
        Pity <span className="font-bold text-foreground">{p.pity}</span>
        {" · "}
        {BANNER_LABELS[p.banner]}
      </p>
      <p className="text-muted-foreground">
        {new Date(p.time).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
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
  const chartData = filtered.map((d, i) => ({ ...d, index: i + 1 }));

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
          margin={{ top: 16, right: 12, left: -8, bottom: 4 }}
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
            dataKey="index"
            tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "№ 5★",
              position: "insideBottomRight",
              offset: -2,
              style: { fill: "#9ca3af", fontSize: 10 },
            }}
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
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === "actual" ? "У вас" : "Ожидание",
            ]}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <Bar
            dataKey="expected"
            name="expected"
            fill="rgba(0,0,0,0.08)"
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
