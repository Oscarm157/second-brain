"use client";

import { motion, useReducedMotion } from "motion/react";
import type { GoalProgress } from "@/lib/habits/data";

export function GoalBar({ goal }: { goal: GoalProgress }) {
  const reduced = useReducedMotion();

  return (
    <div className="rounded-lg border border-line bg-card px-5 py-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
          Meta {goal.periodLabel}
        </span>
        <span className="text-sm tabular-nums text-navy">
          <span className="font-semibold text-brand">{goal.current}</span> / {goal.target}
        </span>
        <span className="ml-auto text-xs tabular-nums text-faint">{goal.pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${goal.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function GoalBarCompact({ goal, color }: { goal: GoalProgress; color: string }) {
  const reduced = useReducedMotion();

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs text-faint">
        <span>
          Meta {goal.periodLabel}:{" "}
          <span className="tabular-nums text-navy">
            {goal.current}/{goal.target}
          </span>
        </span>
        <span className="tabular-nums">{goal.pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${goal.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
