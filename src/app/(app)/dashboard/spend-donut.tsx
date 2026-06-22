"use client";

import { motion, useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { money } from "@/lib/finanzas/format";

type Slice = { name: string; color: string; total: number; pct: number };

export function SpendDonut({
  data,
  total,
  label = "Gasto",
  emptyText = "Sin gastos en este periodo.",
}: {
  data: Slice[];
  total: number;
  label?: string;
  emptyText?: string;
}) {
  const reduce = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center text-sm text-ink">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={!reduce}
              animationDuration={700}
            >
              {data.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs uppercase tracking-wide text-faint">{label}</span>
          <span className="font-display text-lg font-bold tabular-nums text-navy">
            {money(total)}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((s, i) => (
          <motion.li
            key={s.name}
            initial={reduce ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-navy">{s.name}</span>
            <span className="tabular-nums text-ink">{money(s.total)}</span>
            <span className="w-9 text-right tabular-nums text-faint">{s.pct}%</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
