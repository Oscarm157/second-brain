"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";

import type { PersonalTask, PersonalTaskStatus, PersonalSubtask } from "@/lib/schema";
import { Drawer } from "@/components/code-board/Drawer";
import { FocusTimer } from "@/components/ui/FocusTimer";
import {
  addSubtask,
  deleteSubtask,
  deleteTask,
  logFocusSession,
  moveTask,
  toggleSubtask,
  updateTask,
} from "@/app/(app)/pendientes/actions";
import { PERSONAL_COLUMNS } from "@/lib/personal-tasks/columns";
import { PRIORITY_META } from "@/lib/personal-tasks/priority";
import { parseLabels } from "@/lib/personal-tasks/labels";

export function TaskDetail({
  task,
  subtasks,
  open,
  onClose,
  statusCounts,
}: {
  task: PersonalTask | null;
  subtasks: PersonalSubtask[];
  open: boolean;
  onClose: () => void;
  /** Nº de tareas por estado, para que "mover" mande la card al final de la columna destino. */
  statusCounts: Record<PersonalTaskStatus, number>;
}) {
  if (!task) return null;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={<span className="text-sm font-semibold text-navy">Detalle de tarea</span>}
    >
      <TaskDetailBody
        key={task.id}
        task={task}
        subtasks={subtasks}
        onClose={onClose}
        statusCounts={statusCounts}
      />
    </Drawer>
  );
}

const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint";
const fieldCls =
  "w-full rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy placeholder:text-faint outline-none focus:border-brand";

function TaskDetailBody({
  task,
  subtasks,
  onClose,
  statusCounts,
}: {
  task: PersonalTask;
  subtasks: PersonalSubtask[];
  onClose: () => void;
  statusCounts: Record<PersonalTaskStatus, number>;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [labels, setLabels] = useState((task.labels ?? []).join(", "));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(fields: Parameters<typeof updateTask>[0]) {
    startTransition(async () => {
      await updateTask(fields);
      setSaved(true);
    });
  }

  function saveTitle() {
    const next = title.trim();
    if (!next || next === task.title) {
      setTitle(task.title);
      return;
    }
    save({ id: task.id, title: next });
  }

  function saveNotes() {
    const next = notes.trim();
    if (next === (task.notes ?? "")) return;
    save({ id: task.id, notes: next });
  }

  function saveLabels() {
    const next = parseLabels(labels);
    if (next.join(",") === (task.labels ?? []).join(",")) return;
    setLabels(next.join(", "));
    save({ id: task.id, labels: next });
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
      <FocusTimer
        storageKey={`focus:task:${task.id}`}
        focusSeconds={task.focusSeconds}
        onLog={async (s) => {
          await logFocusSession(task.id, s);
        }}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={labelCls + " mb-0"}>Estado</span>
          {pending ? (
            <span className="text-xs text-faint">Guardando…</span>
          ) : saved ? (
            <span className="flex items-center gap-1 text-xs text-income">
              <Check className="size-3" /> Guardado
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PERSONAL_COLUMNS.map((s) => {
            const active = task.status === s.id;
            return (
              <button
                key={s.id}
                onClick={() =>
                  active
                    ? undefined
                    : startTransition(() => void moveTask(task.id, s.id, statusCounts[s.id]))
                }
                className={
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors " +
                  (active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line text-ink hover:bg-secondary hover:text-navy")
                }
                aria-pressed={active}
              >
                <span className="size-2 rounded-full" style={{ background: s.accent }} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelCls}>Título</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={fieldCls}
        />
      </div>

      <Subtasks taskId={task.id} subtasks={subtasks} />

      <div>
        <label className={labelCls}>Notas</label>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          onBlur={saveNotes}
          rows={4}
          placeholder="Sin notas."
          className={fieldCls}
        />
      </div>

      <div>
        <label className={labelCls}>Etiquetas</label>
        <input
          value={labels}
          onChange={(e) => {
            setLabels(e.target.value);
            setSaved(false);
          }}
          onBlur={saveLabels}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="casa, urgente"
          className={fieldCls}
        />
        <p className="mt-1 text-xs text-faint">Separadas por coma, máximo 8.</p>
      </div>

      <div>
        <label className={labelCls}>Prioridad</label>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITY_META.map((p) => {
            const active = task.priority === p.value;
            return (
              <button
                key={p.value}
                onClick={() =>
                  active ? undefined : save({ id: task.id, priority: p.value })
                }
                className={
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors " +
                  (active ? "border-brand text-navy" : "border-line text-ink hover:bg-secondary")
                }
                style={active && p.color ? { color: p.color, borderColor: p.color } : undefined}
                aria-pressed={active}
              >
                {p.color ? (
                  <span className="size-2 rounded-full" style={{ background: p.color }} />
                ) : null}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelCls}>Fecha de vencimiento</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              save({ id: task.id, dueDate: v ? v : null });
            }}
            className="rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy outline-none focus:border-brand"
          />
          {task.dueDate ? (
            <button
              onClick={() => save({ id: task.id, dueDate: null })}
              className="rounded-md px-2 py-1 text-sm text-ink hover:bg-secondary hover:text-navy"
            >
              Quitar fecha
            </button>
          ) : null}
        </div>
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

function Subtasks({ taskId, subtasks }: { taskId: string; subtasks: PersonalSubtask[] }) {
  const [value, setValue] = useState("");
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const done = subtasks.filter((s) => s.done).length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    setValue("");
    startTransition(async () => {
      await addSubtask(taskId, title);
      inputRef.current?.focus();
    });
  }

  return (
    <div>
      <label className={labelCls}>
        Subtareas{subtasks.length > 0 ? ` · ${done}/${subtasks.length}` : ""}
      </label>
      {subtasks.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5">
              <button
                onClick={() => startTransition(() => void toggleSubtask(s.id))}
                className="flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors"
                style={{
                  borderColor: s.done ? "var(--income)" : "var(--line)",
                  background: s.done ? "var(--income)" : "transparent",
                }}
                aria-label={s.done ? "Desmarcar" : "Completar"}
              >
                {s.done ? <Check className="size-3 text-[var(--h-on-accent)]" /> : null}
              </button>
              <span
                className={
                  "flex-1 text-sm " + (s.done ? "text-faint line-through" : "text-navy")
                }
              >
                {s.title}
              </span>
              <button
                onClick={() => startTransition(() => void deleteSubtask(s.id))}
                className="text-faint transition-colors hover:text-alert"
                aria-label="Borrar subtarea"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex items-center gap-2">
        <Plus className="size-4 text-faint" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Agregar subtarea"
          className="flex-1 border-b border-transparent bg-transparent py-1 text-sm text-navy placeholder:text-faint outline-none focus:border-line"
        />
      </form>
    </div>
  );
}
