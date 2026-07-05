"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { createHabit, updateHabit } from "@/app/(app)/habitos/actions";
import type { Habit } from "@/lib/schema";
import { HABIT_ICONS, HabitIcon } from "./habit-icons";

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

// Lun→Dom, mapeados a getDay() (0=Dom). El orden visual empieza en lunes.
const WEEKDAYS = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "M" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

export function HabitFormTrigger({ habit }: { habit?: Habit } = {}) {
  const isEdit = !!habit;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(habit?.color ?? "#34d399");
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon ?? "sparkles");
  const [goalPeriod, setGoalPeriod] = useState(habit?.goalPeriod ?? "");
  const [frequency, setFrequency] = useState<string>(habit?.frequency ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? []);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", selectedColor);
    fd.set("icon", selectedIcon);
    fd.set("weekdays", frequency === "custom" ? JSON.stringify(weekdays) : "");
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
        setSelectedIcon("sparkles");
        setGoalPeriod("");
        setFrequency("daily");
        setWeekdays([]);
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
          <div className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-lg border border-line bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-navy">
              {isEdit ? "Editar hábito" : "Nuevo hábito"}
            </h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {isEdit && habit && <input type="hidden" name="id" value={habit.id} />}
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
                  Icono
                </label>
                <div className="grid grid-cols-9 gap-1.5">
                  {HABIT_ICONS.map(({ key }) => {
                    const active = selectedIcon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedIcon(key)}
                        className="flex aspect-square items-center justify-center rounded-md border transition-colors"
                        style={{
                          borderColor: active ? selectedColor : "var(--line)",
                          background: active ? `${selectedColor}22` : "transparent",
                          color: active ? selectedColor : "var(--ink)",
                        }}
                        aria-pressed={active}
                        aria-label={key}
                      >
                        <HabitIcon name={key} className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Frecuencia
                </label>
                <select
                  name="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="custom">Días específicos</option>
                </select>
              </div>

              {frequency === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-faint">
                    Días
                  </label>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((d) => {
                      const active = weekdays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleWeekday(d.value)}
                          className="flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors"
                          style={{
                            borderColor: active ? selectedColor : "var(--line)",
                            background: active ? `${selectedColor}22` : "transparent",
                            color: active ? selectedColor : "var(--ink)",
                          }}
                          aria-pressed={active}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {frequency === "weekly" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-faint">
                    Veces por semana
                  </label>
                  <input
                    name="targetPerWeek"
                    type="number"
                    min={1}
                    max={7}
                    defaultValue={habit?.targetPerWeek ?? 3}
                    className="w-24 rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-faint">
                    Veces al día
                  </label>
                  <input
                    name="targetPerDay"
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={habit?.targetPerDay ?? 1}
                    className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-faint">
                    Gracia / semana
                  </label>
                  <input
                    name="gracePerWeek"
                    type="number"
                    min={0}
                    max={7}
                    defaultValue={habit?.gracePerWeek ?? 1}
                    className="w-full rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-faint">
                  Meta
                </label>
                <div className="flex gap-2">
                  <select
                    name="goalPeriod"
                    value={goalPeriod}
                    onChange={(e) => setGoalPeriod(e.target.value)}
                    className="flex-1 rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy focus:border-brand focus:outline-none"
                  >
                    <option value="">Sin meta</option>
                    <option value="week">Semana</option>
                    <option value="month">Mes</option>
                    <option value="year">Año</option>
                  </select>
                  {goalPeriod && (
                    <input
                      name="goalTarget"
                      type="number"
                      min={1}
                      required
                      defaultValue={habit?.goalTarget ?? ""}
                      placeholder="Veces"
                      className="w-24 rounded-md border border-line bg-secondary px-3 py-2.5 text-sm text-navy placeholder-faint focus:border-brand focus:outline-none"
                    />
                  )}
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
