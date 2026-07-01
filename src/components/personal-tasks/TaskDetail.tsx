"use client";

import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";

import type { PersonalTask } from "@/lib/schema";
import { Drawer } from "@/components/code-board/Drawer";
import { deleteTask, updateTask } from "@/app/(app)/pendientes/actions";

export function TaskDetail({
  task,
  open,
  onClose,
}: {
  task: PersonalTask | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!task) return null;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={<span className="text-sm font-semibold text-navy">Detalle de tarea</span>}
    >
      <TaskDetailBody key={task.id} task={task} onClose={onClose} />
    </Drawer>
  );
}

function TaskDetailBody({ task, onClose }: { task: PersonalTask; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [pending, startTransition] = useTransition();
  const starred = task.priority > 0;

  function saveTitle() {
    const next = title.trim();
    if (!next || next === task.title) {
      setTitle(task.title);
      return;
    }
    startTransition(() => void updateTask({ id: task.id, title: next }));
  }

  function saveNotes() {
    const next = notes.trim();
    if (next === (task.notes ?? "")) return;
    startTransition(() => void updateTask({ id: task.id, notes: next }));
  }

  function onDelete() {
    if (!confirm("¿Borrar esta tarea?")) return;
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">
          Título
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={4}
          placeholder="Sin notas."
          className="w-full rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy placeholder:text-faint outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">
          Fecha de vencimiento
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              startTransition(() =>
                void updateTask({ id: task.id, dueDate: v ? v : null }),
              );
            }}
            className="rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy outline-none focus:border-brand"
          />
          {task.dueDate ? (
            <button
              onClick={() =>
                startTransition(() => void updateTask({ id: task.id, dueDate: null }))
              }
              className="rounded-md px-2 py-1 text-sm text-ink hover:bg-secondary hover:text-navy"
            >
              Quitar fecha
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">
          Prioridad
        </label>
        <button
          onClick={() =>
            startTransition(() =>
              void updateTask({ id: task.id, priority: starred ? 0 : 1 }),
            )
          }
          className={
            "inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm " +
            (starred ? "text-warn" : "text-ink hover:bg-secondary hover:text-navy")
          }
        >
          <Star className="size-4" fill={starred ? "currentColor" : "none"} />
          {starred ? "Prioritaria" : "Marcar prioritaria"}
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <button
          onClick={onDelete}
          disabled={pending}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-secondary hover:text-alert disabled:opacity-50"
        >
          <Trash2 className="size-4" /> Borrar tarea
        </button>
      </div>
    </div>
  );
}
