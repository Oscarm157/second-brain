"use client";

import { useTransition } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { toggleEntry } from "@/app/(app)/habitos/actions";
import type { TodayHabit } from "@/lib/habits/data";
import { todayISO } from "@/lib/habits/date";

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

  return (
    <section className="rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-[var(--h-text-faint)]">
          Hoy
        </h2>
        <span className="font-display text-sm tabular-nums text-[var(--h-text-secondary)]">
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
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "var(--h-surface-2)" }}
            >
              <button
                onClick={() => toggle(h.id)}
                disabled={isPending}
                className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                style={{ borderColor: h.color }}
                aria-label={`Completar ${h.name}`}
              />
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{ background: `${h.color}22` }}
              >
                <span style={{ color: h.color }}>✦</span>
              </div>
              <span className="flex-1 text-sm text-[var(--h-text)]">{h.name}</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {done.map((h) => (
          <li
            key={h.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-50"
          >
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: h.color }}
            >
              <span className="text-xs text-[var(--h-on-accent)]">✓</span>
            </div>
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-lg text-sm"
              style={{ background: `${h.color}22` }}
            >
              <span style={{ color: h.color }}>✦</span>
            </div>
            <span className="flex-1 text-sm line-through text-[var(--h-text-faint)]">{h.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
