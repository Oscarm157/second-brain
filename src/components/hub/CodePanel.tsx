"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Code2, Plus } from "lucide-react";

import { createCard, moveCard } from "@/app/(app)/codigo/actions";
import type { CodePeekItem } from "@/lib/code-board/data";

// Etiquetas alineadas con el tablero (src/lib/code-board/columns.ts).
const STATUS_META: Record<CodePeekItem["status"], { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "var(--h-text-faint)" },
  in_progress: { label: "En curso", color: "var(--h-violet)" },
  blocked: { label: "Bloqueado", color: "var(--alert)" },
  done: { label: "Hecho", color: "var(--h-emerald)" },
};

// Ciclo de estado para el chip (done se resuelve con el check, no en el ciclo).
const NEXT_STATUS: Record<string, CodePeekItem["status"]> = {
  backlog: "in_progress",
  in_progress: "blocked",
  blocked: "backlog",
};

// Al mover desde el Hub no conocemos la columna destino; la mandamos al final
// (posición alta) para no colisionar con el orden existente de esa columna.
const END_POSITION = 9999;

export function CodePanel({
  items,
  inProgress,
  blocked,
  projects,
}: {
  items: CodePeekItem[];
  inProgress: number;
  blocked: number;
  projects: string[];
}) {
  const reduced = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [project, setProject] = useState("");
  const [title, setTitle] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  function complete(item: CodePeekItem) {
    startTransition(async () => {
      await moveCard(item.id, "done", END_POSITION);
    });
  }

  function cycle(item: CodePeekItem) {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    startTransition(async () => {
      await moveCard(item.id, next, END_POSITION);
    });
  }

  function add() {
    const p = project.trim();
    const t = title.trim();
    if (!p || !t) return;
    const fd = new FormData();
    fd.set("project", p);
    fd.set("title", t);
    setTitle("");
    startTransition(async () => {
      await createCard(fd);
      titleRef.current?.focus();
    });
  }

  return (
    <section className="flex flex-col rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6">
      <div className="flex items-center gap-2">
        <Code2 className="size-5 text-[var(--h-violet)]" />
        <span className="text-sm font-semibold text-[var(--h-text)]">Código</span>
        <span className="text-sm text-[var(--h-text-secondary)]">
          {inProgress} en curso{blocked > 0 ? ` · ${blocked} bloqueadas` : ""}
        </span>
        <Link
          href="/codigo"
          className="group ml-auto flex items-center gap-1 text-xs text-[var(--h-text-faint)] transition-colors hover:text-[var(--h-violet)]"
        >
          Ver tablero
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="mt-4 flex-1 space-y-1.5">
        {items.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--h-text-faint)]">Sin tareas de código.</li>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <motion.li
                  key={c.id}
                  layout
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: 8 }}
                  className="flex items-center gap-3 rounded-xl bg-[var(--h-canvas)] px-3 py-2.5"
                >
                  <button
                    onClick={() => complete(c)}
                    disabled={isPending}
                    className="size-5 shrink-0 rounded-full border-2 border-[var(--h-violet)] transition-colors hover:bg-[var(--h-violet)] disabled:opacity-50"
                    aria-label={`Marcar ${c.title} como hecha`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--h-text)]">{c.title}</p>
                    <p className="truncate text-xs text-[var(--h-text-faint)]">{c.project}</p>
                  </div>
                  <button
                    onClick={() => cycle(c)}
                    disabled={isPending}
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-opacity hover:opacity-70 disabled:opacity-50"
                    style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}
                    aria-label={`Cambiar estado de ${c.title}`}
                  >
                    {meta.label}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        )}
      </ul>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--h-border)] px-3 py-1.5 focus-within:border-[var(--h-violet)]">
        <Plus className="size-4 shrink-0 text-[var(--h-text-faint)]" />
        <input
          value={project}
          onChange={(e) => setProject(e.target.value)}
          list="hub-code-projects"
          placeholder="Proyecto"
          maxLength={60}
          className="w-28 shrink-0 bg-transparent py-1 text-sm text-[var(--h-text)] placeholder:text-[var(--h-text-faint)] focus:outline-none"
        />
        <datalist id="hub-code-projects">
          {projects.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <span className="text-[var(--h-border)]">|</span>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nueva tarea de código"
          maxLength={160}
          className="flex-1 bg-transparent py-1 text-sm text-[var(--h-text)] placeholder:text-[var(--h-text-faint)] focus:outline-none"
        />
        {project.trim() && title.trim() ? (
          <button
            onClick={add}
            disabled={isPending}
            className="shrink-0 rounded-full bg-[var(--h-violet)] px-3 py-1 text-xs font-medium text-[var(--h-on-accent)] disabled:opacity-50"
          >
            Agregar
          </button>
        ) : null}
      </div>
    </section>
  );
}
