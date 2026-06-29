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
        style={{ background: "#a6ff00", color: "#141320" }}
      >
        Nuevo hábito
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-md space-y-5 rounded-2xl p-6"
            style={{ background: "#1f1e30", border: "1px solid #322f4a" }}
          >
            <h2 className="font-display text-lg font-bold text-[#f7f7ff]">Nuevo hábito</h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[#6f6d82]">
                  Nombre
                </label>
                <input
                  name="name"
                  required
                  maxLength={80}
                  placeholder="Ej: Meditar 10 min"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm text-[#f7f7ff] placeholder-[#6f6d82] focus:outline-none"
                  style={{ background: "#29273f", borderColor: "#322f4a" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[#6f6d82]">
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
                          selectedColor === c.value ? "#f7f7ff" : "transparent",
                        transform:
                          selectedColor === c.value ? "scale(1.2)" : "scale(1)",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[#6f6d82]">
                  Frecuencia
                </label>
                <select
                  name="frequency"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm text-[#f7f7ff] focus:outline-none"
                  style={{ background: "#29273f", borderColor: "#322f4a" }}
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>

              {error && <p className="text-sm text-[#fb7185]">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border py-2 text-sm font-medium text-[#a5a3b8] transition-colors hover:text-[#f7f7ff]"
                  style={{ borderColor: "#322f4a" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-full py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "#a6ff00", color: "#141320" }}
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
