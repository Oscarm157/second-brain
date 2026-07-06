"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Flame } from "lucide-react";

import { toggleEntry, incrementEntry } from "@/app/(app)/habitos/actions";
import type { TodayHabit } from "@/lib/habits/data";
import { todayISO } from "@/lib/habits/date";
import { HabitIcon } from "@/components/habits/habit-icons";

export function HabitsQuick({ habits, level }: { habits: TodayHabit[]; level: number }) {
  const reduced = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const done = habits.filter((h) => h.doneToday).length;

  function register(h: TodayHabit) {
    const date = todayISO();
    startTransition(async () => {
      if (h.targetPerDay > 1) await incrementEntry(h.id, date);
      else await toggleEntry(h.id, date);
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6">
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-[var(--h-streak)]" />
        <span className="text-sm font-semibold text-[var(--h-text)]">Hoy</span>
        <span className="text-sm tabular-nums text-[var(--h-text-secondary)]">
          {done}/{habits.length}
        </span>
        <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-medium text-[var(--h-xp-ink)] bg-[color-mix(in_srgb,var(--h-xp)_18%,transparent)]">
          Nivel {level}
        </span>
        <Link
          href="/habitos"
          className="group ml-auto flex items-center gap-1 text-xs text-[var(--h-text-faint)] transition-colors hover:text-[var(--h-streak)]"
        >
          Ver hábitos
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {habits.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--h-text-faint)]">No hay hábitos para hoy.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {habits.map((h) => {
            const multi = h.targetPerDay > 1;
            const active = h.doneToday;
            return (
              <motion.button
                key={h.id}
                onClick={() => register(h)}
                disabled={isPending || active}
                whileTap={reduced || active ? undefined : { scale: 0.94 }}
                className="flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors disabled:opacity-60"
                style={{
                  borderColor: active ? h.color : "var(--h-border)",
                  background: active ? h.color : "transparent",
                  color: active ? "var(--h-on-accent)" : "var(--h-text)",
                }}
                aria-label={`Registrar ${h.name}`}
              >
                <span
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                  style={{ background: active ? "color-mix(in srgb, var(--h-on-accent) 22%, transparent)" : `${h.color}22` }}
                >
                  {active && !multi ? (
                    <span>✓</span>
                  ) : (
                    <HabitIcon name={h.icon} className="size-3.5" style={{ color: active ? "var(--h-on-accent)" : h.color }} />
                  )}
                </span>
                <span className={active && !multi ? "line-through" : ""}>{h.name}</span>
                {multi ? (
                  <span className="text-xs tabular-nums opacity-80">
                    {h.completedToday}/{h.targetPerDay}
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}
