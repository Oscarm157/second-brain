"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { HabitHeatmap } from "./HabitHeatmap";
import { StreakBadge } from "./StreakBadge";
import { toggleEntry } from "@/app/(app)/habitos/actions";
import { computeStreak } from "@/lib/habits/data";
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
      className="flex flex-col gap-4 rounded-[20px] border p-5"
      style={{ background: "var(--h-surface)", borderColor: "var(--h-border)" }}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${habit.color}22` }}
          >
            <span
              className="text-xl"
              style={{ filter: `drop-shadow(0 0 6px ${habit.color}40)` }}
            >
              ✦
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display font-semibold text-[var(--h-text)]">{habit.name}</p>
            <p className="text-xs text-[var(--h-text-faint)]">
              {habit.targetPerDay === 1 ? "Una vez al día" : `${habit.targetPerDay}× al día`}
            </p>
          </div>
        </div>
        <StreakBadge streak={streak.current} />
      </div>

      {/* Heatmap */}
      <HabitHeatmap cells={cells} color={habit.color} justToggledDate={toggled} />

      {/* Complete button */}
      <motion.button
        onClick={handleToggle}
        disabled={pending}
        className="mt-1 w-full rounded-full py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: completedToday ? `${habit.color}22` : habit.color,
          color: completedToday ? habit.color : "#141320",
        }}
        whileTap={reduced ? {} : { scale: 0.97 }}
      >
        {completedToday ? "✓ Hecho hoy" : "Marcar hecho"}
      </motion.button>
    </motion.div>
  );
}
