"use client";

import { useState, useRef, useTransition } from "react";
import { createHabit } from "@/app/(app)/habitos/actions";

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

export function HabitFormTrigger() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("#34d399");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", selectedColor);
    setError(null);
    startTransition(async () => {
      const result = await createHabit(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      formRef.current?.reset();
      setSelectedColor("#34d399");
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "var(--h-xp)", color: "var(--h-xp-ink)" }}
      >
        Nuevo hábito
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ background: "var(--overlay)" }}
        >
          <div
            className="w-full max-w-md space-y-5 rounded-2xl p-6"
            style={{ background: "var(--h-surface)", border: "1px solid var(--h-border)" }}
          >
            <h2 className="font-display text-lg font-bold text-[var(--h-text)]">Nuevo hábito</h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--h-text-faint)]">
                  Nombre
                </label>
                <input
                  name="name"
                  required
                  maxLength={80}
                  placeholder="Ej: Meditar 10 min"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm text-[var(--h-text)] placeholder-[var(--h-text-faint)] focus:outline-none"
                  style={{ background: "var(--h-surface-2)", borderColor: "var(--h-border)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--h-text-faint)]">
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
                          selectedColor === c.value ? "var(--h-text)" : "transparent",
                        transform:
                          selectedColor === c.value ? "scale(1.2)" : "scale(1)",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--h-text-faint)]">
                  Frecuencia
                </label>
                <select
                  name="frequency"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm text-[var(--h-text)] focus:outline-none"
                  style={{ background: "var(--h-surface-2)", borderColor: "var(--h-border)" }}
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>

              {error && <p className="text-sm text-[var(--expense)]">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border py-2 text-sm font-medium text-[var(--h-text-secondary)] transition-colors hover:text-[var(--h-text)]"
                  style={{ borderColor: "var(--h-border)" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-full py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "var(--h-xp)", color: "var(--h-xp-ink)" }}
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
