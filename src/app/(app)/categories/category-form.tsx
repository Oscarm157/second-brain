"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createCategory } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type State = { error: string } | null;

const PALETTE = [
  "#2456e6", "#0fa3a3", "#0f9d58", "#e8a33d", "#e8694a",
  "#7a5af0", "#d4548a", "#64748b", "#d23f3f", "#94a3b8",
];

export function CategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(PALETTE[0]);
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await createCategory(formData)) ?? null,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state === null) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="color" value={color} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium text-ink">
            Nombre
          </label>
          <Input id="name" name="name" placeholder="Ej. Renta, Mascota, Bono" maxLength={40} required />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-ink">Tipo</span>
          <div className="flex h-9 items-center rounded-md border border-line bg-white p-1">
            <button
              type="button"
              onClick={() => setKind("expense")}
              className={cn(
                "h-7 rounded px-3 text-xs font-medium transition-colors",
                kind === "expense" ? "bg-navy text-white" : "text-ink hover:bg-surface",
              )}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              className={cn(
                "h-7 rounded px-3 text-xs font-medium transition-colors",
                kind === "income" ? "bg-income text-white" : "text-ink hover:bg-surface",
              )}
            >
              Ingreso
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-ink">Color</span>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={cn(
                "size-7 rounded-full transition-transform",
                color === c ? "ring-2 ring-navy ring-offset-2" : "hover:scale-110",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" name="exclude" className="size-4 accent-brand" />
        No contar en totales (omitir del flujo)
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
