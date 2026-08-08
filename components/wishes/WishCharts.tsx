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
import type { PityChartPoint } from "@/lib/wishes";
import { BANNER_LABELS } from "@/lib/wishes";

const TEAL = "#189b8e";
const GOLD = "#d4a017";
const PURPLE = "#7c5cbf";

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
    <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-2 text-xs shadow-panel">
      <p className="font-bold text-foreground">{p.name}</p>
      <p className="text-muted-foreground">
        Pity {p.pity} · {BANNER_LABELS[p.banner]}
      </p>
      <p className="text-muted-foreground">
        {new Date(p.time).toLocaleDateString("ru-RU")}
      </p>
    </div>
  );
}

export function WishPityAreaChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm font-medium text-muted-foreground">
        Импортируйте молитвы — здесь появится график pity 5★
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="pityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 90]}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="pity"
            stroke={TEAL}
            strokeWidth={2.5}
            fill="url(#pityFill)"
            dot={{ r: 3, fill: TEAL, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: TEAL }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WishRateBars({
  rate5,
  rate4,
}: {
  rate5: number;
  rate4: number;
}) {
  const rows = [
    { name: "5★", value: Number(rate5.toFixed(2)), fill: GOLD, expect: 1.6 },
    { name: "4★", value: Number(rate4.toFixed(2)), fill: PURPLE, expect: 13 },
  ];

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,0,0,0.05)" horizontal={false} />
          <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11, fill: "#6b7280" }} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#111" }} width={36} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Шанс"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={22}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
