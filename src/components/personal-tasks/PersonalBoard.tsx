"use client";

import { useRef, useState, useTransition } from "react";
import { Calendar, Star, X } from "lucide-react";

import type { PersonalTask } from "@/lib/schema";
import { Kanban, type KanbanColumnDef } from "@/components/kanban/Kanban";
import { TaskDetail } from "@/components/personal-tasks/TaskDetail";
import { createTask, deleteTask, moveTask, updateTask } from "@/app/(app)/pendientes/actions";
import { todayISO } from "@/lib/habits/date";

const COLUMNS: KanbanColumnDef[] = [
  { id: "todo", label: "Por hacer", accent: "#60a5fa" },
  { id: "doing", label: "Haciendo", accent: "#fbbf24" },
  { id: "done", label: "Hecho", accent: "#34d399" },
];

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

export function PersonalBoard({ tasks }: { tasks: PersonalTask[] }) {
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? tasks.find((t) => t.id === selectedId) ?? null : null;

  function onMove(id: string, toColumn: string, toIndex: number) {
    startTransition(() => void moveTask(id, toColumn, toIndex));
  }

  return (
    <>
      <Kanban
        columns={COLUMNS}
        items={tasks}
        columnOf={(t) => t.status}
        onMove={onMove}
        onCardClick={(t) => setSelectedId(t.id)}
        columnFooter={(columnId) => <QuickAdd status={columnId} />}
        renderCard={(t) => <TaskCard task={t} />}
      />
      <TaskDetail task={selected} open={!!selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

function TaskCard({ task }: { task: PersonalTask }) {
  const [, startTransition] = useTransition();
  const starred = task.priority > 0;
  const badge = task.dueDate ? dueBadge(task.dueDate, task.status === "done") : null;

  return (
    <article className="group rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <p
          className={
            "flex-1 text-sm leading-snug " +
            (task.status === "done"
              ? "text-faint line-through"
              : "text-navy")
          }
        >
          {task.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => void updateTask({ id: task.id, priority: starred ? 0 : 1 }));
          }}
          className={starred ? "text-warn" : "text-faint opacity-0 group-hover:opacity-100"}
          aria-label="Prioridad"
        >
          <Star className="size-4" fill={starred ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => void deleteTask(task.id));
          }}
          className="text-faint opacity-0 transition-colors hover:text-alert group-hover:opacity-100"
          aria-label="Borrar"
        >
          <X className="size-4" />
        </button>
      </div>
      {task.notes ? (
        <p className="mt-1.5 text-xs text-ink">{task.notes}</p>
      ) : null}
      {badge ? (
        <div className={"mt-1.5 flex items-center gap-1 text-xs " + badge.className}>
          <Calendar className="size-3" />
          <span>{badge.label}</span>
        </div>
      ) : null}
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
