"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Calendar, Flag, ListChecks, Search, X } from "lucide-react";

import type { PersonalTask, PersonalSubtask } from "@/lib/schema";
import { Kanban } from "@/components/kanban/Kanban";
import { TaskDetail } from "@/components/personal-tasks/TaskDetail";
import { createTask, deleteTask, moveTask, updateTask } from "@/app/(app)/pendientes/actions";
import { todayISO } from "@/lib/habits/date";
import { PERSONAL_COLUMNS } from "@/lib/personal-tasks/columns";
import { PRIORITY_META } from "@/lib/personal-tasks/priority";

const COLUMNS = PERSONAL_COLUMNS;

const DATE_FMT = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

/** dueDate es "YYYY-MM-DD"; se compara como string (orden lexicográfico == cronológico). */
function dueBadge(dueDate: string, isDone: boolean): { label: string; className: string } {
  const [y, m, d] = dueDate.split("-").map(Number);
  const label = DATE_FMT.format(new Date(y, m - 1, d));
  if (isDone) return { label, className: "text-faint" };
  const today = todayISO();
  if (dueDate < today) return { label, className: "text-alert" };
  if (dueDate === today) return { label, className: "text-warn" };
  return { label, className: "text-faint" };
}

export function PersonalBoard({
  tasks,
  subtasksByTask,
}: {
  tasks: PersonalTask[];
  subtasksByTask: Record<string, PersonalSubtask[]>;
}) {
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const selected = selectedId ? tasks.find((t) => t.id === selectedId) ?? null : null;

  const statusCounts = { todo: 0, doing: 0, done: 0 };
  for (const t of tasks) statusCounts[t.status] += 1;

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) for (const l of t.labels ?? []) set.add(l);
    return [...set].sort();
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (labelFilter && !(t.labels ?? []).includes(labelFilter)) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [tasks, query, labelFilter]);

  function onMove(id: string, toColumn: string, toIndex: number) {
    startTransition(() => void moveTask(id, toColumn, toIndex));
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-card py-16 text-center">
        <p className="text-ink">Todavía no tienes pendientes.</p>
        <p className="mt-1 text-sm text-faint">
          Crea el primero con “Nueva tarea” o el campo de cada columna.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pendiente"
            className="w-full rounded-md border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy placeholder:text-faint outline-none focus:border-brand"
          />
        </div>
        {allLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allLabels.map((l) => {
              const active = labelFilter === l;
              return (
                <button
                  key={l}
                  onClick={() => setLabelFilter(active ? null : l)}
                  className={
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-brand-soft text-brand"
                      : "text-ink hover:bg-secondary hover:text-navy")
                  }
                >
                  #{l}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Kanban
        columns={COLUMNS}
        items={visible}
        columnOf={(t) => t.status}
        onMove={onMove}
        onCardClick={(t) => setSelectedId(t.id)}
        columnFooter={(columnId) => <QuickAdd status={columnId} />}
        renderCard={(t) => <TaskCard task={t} subtasks={subtasksByTask[t.id] ?? []} />}
        disableDnd={query.trim() !== "" || labelFilter !== null}
      />

      <TaskDetail
        task={selected}
        subtasks={selected ? subtasksByTask[selected.id] ?? [] : []}
        open={!!selected}
        onClose={() => setSelectedId(null)}
        statusCounts={statusCounts}
      />
    </>
  );
}

function TaskCard({ task, subtasks }: { task: PersonalTask; subtasks: PersonalSubtask[] }) {
  const [, startTransition] = useTransition();
  const badge = task.dueDate ? dueBadge(task.dueDate, task.status === "done") : null;
  const prio = PRIORITY_META[task.priority] ?? PRIORITY_META[0];
  const doneSubs = subtasks.filter((s) => s.done).length;

  return (
    <article className="group rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <p
          className={
            "flex-1 text-sm leading-snug " +
            (task.status === "done" ? "text-faint line-through" : "text-navy")
          }
        >
          {task.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() =>
              void updateTask({ id: task.id, priority: (task.priority + 1) % 3 }),
            );
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-md lg:size-8"
          style={{ color: prio.color ?? "var(--faint)" }}
          aria-label={`Prioridad: ${prio.label}`}
          title={`Prioridad: ${prio.label}`}
        >
          <Flag className="size-4" fill={task.priority > 0 ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => void deleteTask(task.id));
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:text-alert lg:size-8 lg:opacity-0 lg:group-hover:opacity-100"
          aria-label="Borrar"
        >
          <X className="size-4" />
        </button>
      </div>

      {task.notes ? <p className="mt-1.5 text-xs text-ink">{task.notes}</p> : null}

      {(badge || subtasks.length > 0 || (task.labels ?? []).length > 0) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {badge ? (
            <span className={"flex items-center gap-1 " + badge.className}>
              <Calendar className="size-3" />
              {badge.label}
            </span>
          ) : null}
          {subtasks.length > 0 ? (
            <span className="flex items-center gap-1 text-faint">
              <ListChecks className="size-3" />
              {doneSubs}/{subtasks.length}
            </span>
          ) : null}
          {(task.labels ?? []).slice(0, 3).map((l) => (
            <span key={l} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-ink">
              #{l}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function QuickAdd({ status }: { status: string }) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("title", title);
    fd.set("status", status);
    setValue("");
    startTransition(async () => {
      await createTask(fd);
      inputRef.current?.focus();
    });
  }

  return (
    <form onSubmit={submit}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        placeholder="+ Agregar"
        className="w-full rounded-md border border-transparent bg-secondary px-3 py-2 text-sm text-navy placeholder:text-faint outline-none focus:border-border"
      />
    </form>
  );
}
