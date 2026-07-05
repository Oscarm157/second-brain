"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";

import type { Habit } from "@/lib/schema";
import { unarchiveHabit } from "@/app/(app)/habitos/actions";
import { HabitIcon } from "./habit-icons";

export function ArchivedHabits({ habits }: { habits: Habit[] }) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (habits.length === 0) return null;

  function restore(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await unarchiveHabit(id);
      setPendingId(null);
    });
  }

  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-[0.14em] text-faint"
        aria-expanded={open}
      >
        Archivados ({habits.length})
        <span className="text-xs normal-case tracking-normal text-ink">
          {open ? "Ocultar" : "Ver"}
        </span>
      </button>

      {open && (
        <ul className="mt-4 space-y-2">
          {habits.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-3 rounded-md bg-secondary px-3 py-2.5"
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-md"
                style={{ background: `${h.color}22` }}
              >
                <HabitIcon name={h.icon} className="size-4" style={{ color: h.color }} />
              </div>
              <span className="flex-1 text-sm text-navy">{h.name}</span>
              <button
                onClick={() => restore(h.id)}
                disabled={pendingId === h.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink transition-colors hover:text-navy disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" />
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
