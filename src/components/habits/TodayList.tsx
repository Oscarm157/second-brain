"use client";

import { useTransition } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { toggleEntry, incrementEntry } from "@/app/(app)/habitos/actions";
import type { TodayHabit } from "@/lib/habits/data";
import { todayISO } from "@/lib/habits/date";
import { HabitIcon } from "./habit-icons";

export function TodayList({ habits }: { habits: TodayHabit[] }) {
  const reduced = useReducedMotion();
  const pending = habits.filter((h) => !h.doneToday);
  const done = habits.filter((h) => h.doneToday);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    const date = todayISO();
    startTransition(async () => {
      await toggleEntry(id, date);
    });
  }

  function increment(id: string) {
    const date = todayISO();
    startTransition(async () => {
      await incrementEntry(id, date);
    });
  }

  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-faint">
          Hoy
        </h2>
        <span className="text-sm tabular-nums text-ink">
          {done.length}/{habits.length}
        </span>
      </div>
      <ul className="space-y-2">
        <AnimatePresence>
          {pending.map((h) => (
            <motion.li
              key={h.id}
              layout
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? {} : { opacity: 0, x: 8 }}
              className="flex items-center gap-3 rounded-md bg-secondary px-3 py-2.5"
            >
              <button
                onClick={() => (h.targetPerDay > 1 ? increment(h.id) : toggle(h.id))}
                disabled={isPending}
                className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold tabular-nums transition-colors"
                style={{ borderColor: h.color, color: h.color }}
                aria-label={`Completar ${h.name}`}
              >
                {h.targetPerDay > 1 ? `+1` : ""}
              </button>
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-sm"
                style={{ background: `${h.color}22` }}
              >
                <HabitIcon name={h.icon} className="size-3.5" style={{ color: h.color }} />
              </div>
              <span className="flex-1 text-sm text-navy">{h.name}</span>
              {h.targetPerDay > 1 && (
                <span className="text-xs tabular-nums text-faint">
                  {h.completedToday}/{h.targetPerDay}
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
        {done.map((h) => (
          <li
            key={h.id}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 opacity-50"
          >
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: h.color }}
            >
              <span className="text-xs text-[var(--h-on-accent)]">✓</span>
            </div>
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-sm"
              style={{ background: `${h.color}22` }}
            >
              <HabitIcon name={h.icon} className="size-3.5" style={{ color: h.color }} />
            </div>
            <span className="flex-1 text-sm line-through text-faint">{h.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
