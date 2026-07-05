"use client";

import { useState, useRef, useTransition } from "react";

import { createTask } from "@/app/(app)/pendientes/actions";
import { PRIORITY_META } from "@/lib/personal-tasks/priority";

export function TaskFormTrigger() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState(0);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData();
    fd.set("status", "todo");

    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    fd.set("title", title);

    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value.trim();
    if (notes) fd.set("notes", notes);

    const dueDate = (form.elements.namedItem("dueDate") as HTMLInputElement).value;
    if (dueDate) fd.set("dueDate", dueDate);

    const labels = (form.elements.namedItem("labels") as HTMLInputElement).value.trim();
    if (labels) fd.set("labels", labels);

    if (priority > 0) fd.set("priority", String(priority));

    setError(null);
    startTransition(async () => {
      const result = await createTask(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      formRef.current?.reset();
      setPriority(0);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
      >
        Nueva tarea
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ background: "var(--overlay)" }}
        >
          <div className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-lg border border-line bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-navy">Nueva tarea</h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Título
                </label>
                <input
                  name="title"
                  required
                  autoFocus
                  maxLength={200}
                  placeholder="Ej: Llamar al proveedor"
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy placeholder-faint focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  maxLength={2000}
                  placeholder="Opcional."
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy placeholder-faint focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Fecha de vencimiento
                </label>
                <input
                  name="dueDate"
                  type="date"
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Etiquetas
                </label>
                <input
                  name="labels"
                  maxLength={200}
                  placeholder="casa, urgente"
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy placeholder-faint focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Prioridad
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_META.map((p) => {
                    const active = priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={
                          "flex min-h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors " +
                          (active ? "border-brand text-navy" : "border-line text-ink hover:bg-secondary")
                        }
                        style={active && p.color ? { color: p.color, borderColor: p.color } : undefined}
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

              {error && <p className="text-sm text-alert">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-line py-2 text-sm font-medium text-ink transition-colors hover:text-navy"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  {isPending ? "Guardando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
