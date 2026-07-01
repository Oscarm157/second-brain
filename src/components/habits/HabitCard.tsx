"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HabitHeatmap } from "./HabitHeatmap";
import { StreakBadge } from "./StreakBadge";
import { toggleEntry } from "@/app/(app)/habitos/actions";
import { computeStreak, computeHabitStats } from "@/lib/habits/data";
import type { GridCell } from "@/lib/habits/data";
import type { Habit } from "@/lib/schema";
import { todayISO } from "@/lib/habits/date";

export function HabitCard({ habit, cells }: { habit: Habit; cells: GridCell[] }) {
  const reduced = useReducedMotion();
  const [toggled, setToggled] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const today = todayISO();
  const todayCell = cells.find((c) => c.date === today);
  const completedToday = (todayCell?.count ?? 0) >= habit.targetPerDay;

  const entries = cells
    .filter((c) => c.count > 0)
    .map((c) => ({ date: c.date, count: c.count }));
  const streak = computeStreak(entries, habit);
  const stats = computeHabitStats(cells, habit.targetPerDay, habit.createdAt);

  async function handleToggle() {
    if (pending) return;
    setPending(true);
    setToggled(today);
    await toggleEntry(habit.id, today);
    setPending(false);
    setTimeout(() => setToggled(undefined), 1000);
  }

  return (
    <motion.div
      className="flex flex-col gap-4 rounded-lg border border-line bg-card p-5 shadow-sm"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/habitos/${habit.id}`}
          className="group flex min-w-0 items-center gap-2.5"
        >
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${habit.color}22` }}
          >
            <span className="text-xl" style={{ color: habit.color }}>
              ✦
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy transition-colors group-hover:text-brand">
              {habit.name}
            </p>
            <p className="text-xs text-faint">
              {habit.targetPerDay === 1 ? "Una vez al día" : `${habit.targetPerDay}× al día`}
            </p>
          </div>
        </Link>
        <StreakBadge streak={streak.current} />
      </div>

      {/* Heatmap */}
      <HabitHeatmap cells={cells} color={habit.color} justToggledDate={toggled} />

      {/* Stats */}
      <p className="text-xs text-faint">
        Mejor racha: {streak.best} {streak.best === 1 ? "día" : "días"} · {stats.monthPct}% este mes
      </p>

      {/* Complete button */}
      <motion.button
        onClick={handleToggle}
        disabled={pending}
        className="mt-1 w-full rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: completedToday ? `${habit.color}22` : habit.color,
          color: completedToday ? habit.color : "var(--h-on-accent)",
        }}
        whileTap={reduced ? {} : { scale: 0.97 }}
      >
        {completedToday ? "✓ Hecho hoy" : "Marcar hecho"}
      </motion.button>
    </motion.div>
  );
}
