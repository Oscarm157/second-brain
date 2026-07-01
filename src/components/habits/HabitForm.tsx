"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { createHabit, updateHabit } from "@/app/(app)/habitos/actions";
import type { Habit } from "@/lib/schema";

const COLORS = [
  { value: "#34d399", label: "Esmeralda" },
  { value: "#22d3ee", label: "Cian" },
  { value: "#60a5fa", label: "Azul" },
  { value: "#a78bfa", label: "Violeta" },
  { value: "#f472b6", label: "Rosa" },
  { value: "#fb923c", label: "Naranja" },
  { value: "#fbbf24", label: "Ámbar" },
  { value: "#a3e635", label: "Lima" },
];

export function HabitFormTrigger({ habit }: { habit?: Habit } = {}) {
  const isEdit = !!habit;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(habit?.color ?? "#34d399");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", selectedColor);
    setError(null);
    startTransition(async () => {
      const result = await (isEdit ? updateHabit(fd) : createHabit(fd));
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (isEdit) {
        router.refresh();
      } else {
        formRef.current?.reset();
        setSelectedColor("#34d399");
      }
    });
  }

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-navy transition-colors hover:bg-surface"
        >
          <Pencil className="size-3.5" />
          Editar
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          Nuevo hábito
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ background: "var(--overlay)" }}
        >
          <div className="w-full max-w-md space-y-5 rounded-lg border border-line bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-navy">
              {isEdit ? "Editar hábito" : "Nuevo hábito"}
            </h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {isEdit && habit && (
                <>
                  <input type="hidden" name="id" value={habit.id} />
                  <input type="hidden" name="icon" value={habit.icon} />
                  <input type="hidden" name="targetPerDay" value={habit.targetPerDay} />
                  <input type="hidden" name="gracePerWeek" value={habit.gracePerWeek} />
                  <input type="hidden" name="targetPerWeek" value={habit.targetPerWeek ?? ""} />
                  <input
                    type="hidden"
                    name="weekdays"
                    value={habit.weekdays ? JSON.stringify(habit.weekdays) : ""}
                  />
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Nombre
                </label>
                <input
                  name="name"
                  required
                  maxLength={80}
                  defaultValue={habit?.name}
                  placeholder="Ej: Meditar 10 min"
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy placeholder-faint focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className="size-8 rounded-full border-2 transition-all"
                      style={{
                        background: c.value,
                        borderColor:
                          selectedColor === c.value ? "var(--navy)" : "transparent",
                        transform:
                          selectedColor === c.value ? "scale(1.2)" : "scale(1)",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Frecuencia
                </label>
                <select
                  name="frequency"
                  defaultValue={habit?.frequency ?? "daily"}
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
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
                  {isPending ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
