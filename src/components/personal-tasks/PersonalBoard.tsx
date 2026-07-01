"use client";

import { useRef, useState, useTransition } from "react";
import { Star, X } from "lucide-react";

import type { PersonalTask } from "@/lib/schema";
import { Kanban, type KanbanColumnDef } from "@/components/kanban/Kanban";
import { createTask, deleteTask, moveTask, updateTask } from "@/app/(app)/pendientes/actions";

const COLUMNS: KanbanColumnDef[] = [
  { id: "todo", label: "Por hacer", accent: "#60a5fa" },
  { id: "doing", label: "Haciendo", accent: "#fbbf24" },
  { id: "done", label: "Hecho", accent: "#34d399" },
];

export function PersonalBoard({ tasks }: { tasks: PersonalTask[] }) {
  const [, startTransition] = useTransition();

  function onMove(id: string, toColumn: string, toIndex: number) {
    startTransition(() => void moveTask(id, toColumn, toIndex));
  }

  return (
    <Kanban
      columns={COLUMNS}
      items={tasks}
      columnOf={(t) => t.status}
      onMove={onMove}
      columnFooter={(columnId) => <QuickAdd status={columnId} />}
      renderCard={(t) => <TaskCard task={t} />}
    />
  );
}

function TaskCard({ task }: { task: PersonalTask }) {
  const [, startTransition] = useTransition();
  const starred = task.priority > 0;

  return (
    <article className="group rounded-xl border border-[var(--h-border)] bg-[var(--h-surface)] p-3">
      <div className="flex items-start gap-2">
        <p
          className={
            "flex-1 text-sm leading-snug " +
            (task.status === "done"
              ? "text-[var(--h-text-faint)] line-through"
              : "text-[var(--h-text)]")
          }
        >
          {task.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => void updateTask({ id: task.id, priority: starred ? 0 : 1 }));
          }}
          className={starred ? "text-[var(--h-amber)]" : "text-[var(--h-text-faint)] opacity-0 group-hover:opacity-100"}
          aria-label="Prioridad"
        >
          <Star className="size-4" fill={starred ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => void deleteTask(task.id));
          }}
          className="text-[var(--h-text-faint)] opacity-0 transition-colors hover:text-alert group-hover:opacity-100"
          aria-label="Borrar"
        >
          <X className="size-4" />
        </button>
      </div>
      {task.notes ? (
        <p className="mt-1.5 text-xs text-[var(--h-text-secondary)]">{task.notes}</p>
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
        className="w-full rounded-lg border border-transparent bg-[var(--h-surface)] px-3 py-2 text-sm text-[var(--h-text)] placeholder:text-[var(--h-text-faint)] outline-none focus:border-[var(--h-border)]"
      />
    </form>
  );
}
