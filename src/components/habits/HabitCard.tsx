"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HabitHeatmap } from "./HabitHeatmap";
import { HabitIcon } from "./habit-icons";
import { StreakBadge } from "./StreakBadge";
import { GoalBarCompact } from "./GoalBar";
import { toggleEntry, incrementEntry } from "@/app/(app)/habitos/actions";
import { computeStreak, computeHabitStats, computeGoalProgress } from "@/lib/habits/data";
import type { GridCell } from "@/lib/habits/data";
import type { Habit } from "@/lib/schema";
import { todayISO } from "@/lib/habits/date";

export function HabitCard({ habit, cells }: { habit: Habit; cells: GridCell[] }) {
  const reduced = useReducedMotion();
  const [toggled, setToggled] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const today = todayISO();
  const todayCell = cells.find((c) => c.date === today);
  const todayCount = todayCell?.count ?? 0;
  const multi = habit.targetPerDay > 1;
  const completedToday = todayCount >= habit.targetPerDay;

  const entries = cells
    .filter((c) => c.count > 0)
    .map((c) => ({ date: c.date, count: c.count }));
  const streak = computeStreak(entries, habit);
  const stats = computeHabitStats(cells, habit.targetPerDay, habit.createdAt);
  const goal = computeGoalProgress(cells, habit);

  async function handleAction() {
    if (pending) return;
    setPending(true);
    setToggled(today);
    // Multi-conteo: suma hasta la meta; ya completado o meta 1, alterna (resetea el día).
    if (multi && !completedToday) await incrementEntry(habit.id, today);
    else await toggleEntry(habit.id, today);
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
            <HabitIcon name={habit.icon} className="size-5" style={{ color: habit.color }} />
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

      {/* Heatmap: siempre los últimos 119 días, aunque `cells` traiga más (meta anual) */}
      <HabitHeatmap cells={cells.slice(-119)} color={habit.color} justToggledDate={toggled} />

      {/* Stats */}
      <div className="space-y-2">
        <p className="text-xs text-faint">
          Mejor racha: {streak.best} {streak.best === 1 ? "día" : "días"} · {stats.monthPct}% este mes
        </p>
        {goal && <GoalBarCompact goal={goal} color={habit.color} />}
      </div>

      {/* Complete button */}
      <motion.button
        onClick={handleAction}
        disabled={pending}
        className="mt-1 w-full rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: completedToday ? `${habit.color}22` : habit.color,
          color: completedToday ? habit.color : "var(--h-on-accent)",
        }}
        whileTap={reduced ? {} : { scale: 0.97 }}
      >
        {completedToday
          ? multi
            ? `✓ Hecho hoy (${todayCount}/${habit.targetPerDay})`
            : "✓ Hecho hoy"
          : multi
            ? `+1 · ${todayCount}/${habit.targetPerDay}`
            : "Marcar hecho"}
      </motion.button>
    </motion.div>
  );
}
