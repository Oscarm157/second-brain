"use client";

import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { money, shortDate } from "@/lib/finanzas/format";

type Point = { date: string; in: number; out: number };

const compact = new Intl.NumberFormat("es-MX", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const entrada = payload.find((p) => p.dataKey === "in")?.value ?? 0;
  const salida = payload.find((p) => p.dataKey === "out")?.value ?? 0;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-navy">{label ? shortDate(label) : ""}</div>
      <div className="flex items-center gap-2 tabular-nums">
        <span className="size-2 rounded-full bg-income" />
        <span className="text-ink">Entradas</span>
        <span className="ml-auto font-medium text-navy">{money(entrada)}</span>
      </div>
      <div className="flex items-center gap-2 tabular-nums">
        <span className="size-2 rounded-full bg-brand" />
        <span className="text-ink">Salidas</span>
        <span className="ml-auto font-medium text-navy">{money(salida)}</span>
      </div>
    </div>
  );
}

export function CashflowChart({ data }: { data: Point[] }) {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#322f4a" : "#e7ecf4";
  const tick = dark ? "#6f6d82" : "#8a94a6";
  const income = dark ? "#34d399" : "#0f9d58";
  const brand = dark ? "#5b8cff" : "#2456e6";

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center text-sm text-ink">
        Sin movimientos en este periodo.
      </div>
    );
  }

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-in" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={income} stopOpacity={0.22} />
              <stop offset="100%" stopColor={income} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-out" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brand} stopOpacity={0.22} />
              <stop offset="100%" stopColor={brand} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={grid} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: tick, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: grid }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => compact.format(v as number)}
            tick={{ fill: tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: grid }} />
          <Area
            type="monotone"
            dataKey="in"
            stroke={income}
            strokeWidth={2}
            fill="url(#grad-in)"
            isAnimationActive={!reduce}
            animationDuration={700}
          />
          <Area
            type="monotone"
            dataKey="out"
            stroke={brand}
            strokeWidth={2}
            fill="url(#grad-out)"
            isAnimationActive={!reduce}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
