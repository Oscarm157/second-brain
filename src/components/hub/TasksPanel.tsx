"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { ArrowUpRight, ListChecks, Plus } from "lucide-react";

import { createTask, moveTask } from "@/app/(app)/pendientes/actions";
import { PRIORITY_META } from "@/lib/personal-tasks/priority";
import type { TaskPeekItem } from "@/lib/personal-tasks/data";

// Al completar desde el Hub no conocemos la columna destino; la mandamos al final
// (posición alta) para no colisionar con el orden existente de esa columna.
const END_POSITION = 9999;

export function TasksPanel({ items, open, doing }: { items: TaskPeekItem[]; open: number; doing: number }) {
  const reduced = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function complete(item: TaskPeekItem) {
    startTransition(async () => {
      await moveTask(item.id, "done", END_POSITION);
    });
  }

  function add() {
    const clean = title.trim();
    if (!clean) return;
    const fd = new FormData();
    fd.set("title", clean);
    setTitle("");
    startTransition(async () => {
      await createTask(fd);
      inputRef.current?.focus();
    });
  }

  return (
    <section className="flex flex-col rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6">
      <div className="flex items-center gap-2">
        <ListChecks className="size-5 text-[var(--h-blue)]" />
        <span className="text-sm font-semibold text-[var(--h-text)]">Pendientes</span>
        <span className="text-sm text-[var(--h-text-secondary)]">
          {open} abiertos{doing > 0 ? ` · ${doing} haciendo` : ""}
        </span>
        <Link
          href="/pendientes"
          className="group ml-auto flex items-center gap-1 text-xs text-[var(--h-text-faint)] transition-colors hover:text-[var(--h-blue)]"
        >
          Ver todos
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="mt-4 flex-1 space-y-1.5">
        {items.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--h-text-faint)]">Sin pendientes. Todo en orden.</li>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((t) => {
              const pColor = PRIORITY_META[t.priority]?.color;
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: 8 }}
                  className="flex items-center gap-3 rounded-xl bg-[var(--h-canvas)] px-3 py-2.5"
                >
                  <button
                    onClick={() => complete(t)}
                    disabled={isPending}
                    className="size-5 shrink-0 rounded-full border-2 border-[var(--h-blue)] transition-colors hover:bg-[var(--h-blue)] disabled:opacity-50"
                    aria-label={`Completar ${t.title}`}
                  />
                  {pColor ? (
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: pColor }} />
                  ) : null}
                  <span className="flex-1 truncate text-sm text-[var(--h-text)]">{t.title}</span>
                  {t.status === "doing" ? (
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-[var(--h-blue)]">
                      haciendo
                    </span>
                  ) : null}
                </motion.li>
              );
            })}
          </AnimatePresence>
        )}
      </ul>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--h-border)] px-3 py-1.5 focus-within:border-[var(--h-blue)]">
        <Plus className="size-4 shrink-0 text-[var(--h-text-faint)]" />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Agregar pendiente"
          maxLength={200}
          className="flex-1 bg-transparent py-1 text-sm text-[var(--h-text)] placeholder:text-[var(--h-text-faint)] focus:outline-none"
        />
        {title.trim() ? (
          <button
            onClick={add}
            disabled={isPending}
            className="shrink-0 rounded-full bg-[var(--h-blue)] px-3 py-1 text-xs font-medium text-[var(--h-on-accent)] disabled:opacity-50"
          >
            Agregar
          </button>
        ) : null}
      </div>
    </section>
  );
}
