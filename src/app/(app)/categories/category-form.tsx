"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createCategory } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type State = { error: string } | null;
type Parent = { id: string; name: string; kind: "income" | "expense" };

const PALETTE = [
  "#2456e6", "#0fa3a3", "#0f9d58", "#e8a33d", "#e8694a",
  "#7a5af0", "#d4548a", "#64748b", "#d23f3f", "#94a3b8",
];

export function CategoryForm({ parents }: { parents: Parent[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(PALETTE[0]);
  const [parentId, setParentId] = useState("");
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await createCategory(formData)) ?? null,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state === null) {
      formRef.current?.reset();
      setParentId("");
    }
  }, [state]);

  const parent = parents.find((p) => p.id === parentId);
  const effectiveKind = parent ? parent.kind : kind;

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="kind" value={effectiveKind} />
      <input type="hidden" name="color" value={color} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium text-ink">
            Nombre
          </label>
          <Input id="name" name="name" placeholder="Ej. Netflix, Deuda carro, Bono" maxLength={40} required />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-ink">Tipo</span>
          <div
            className={cn(
              "flex h-9 items-center rounded-md border border-line bg-card p-1",
              parent && "opacity-50",
            )}
          >
            <button
              type="button"
              disabled={!!parent}
              onClick={() => setKind("expense")}
              className={cn(
                "h-7 rounded px-3 text-xs font-medium transition-colors",
                effectiveKind === "expense" ? "bg-foreground text-background" : "text-ink hover:bg-surface",
              )}
            >
              Gasto
            </button>
            <button
              type="button"
              disabled={!!parent}
              onClick={() => setKind("income")}
              className={cn(
                "h-7 rounded px-3 text-xs font-medium transition-colors",
                effectiveKind === "income" ? "bg-income text-income-foreground" : "text-ink hover:bg-surface",
              )}
            >
              Ingreso
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-ink">Categoría padre (opcional)</span>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-9 w-full rounded-md border border-line bg-card px-2 text-sm text-navy outline-none focus-visible:border-brand"
          >
            <option value="">Ninguna (categoría principal)</option>
            <optgroup label="Gastos">
              {parents.filter((p) => p.kind === "expense").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            <optgroup label="Ingresos">
              {parents.filter((p) => p.kind === "income").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          </select>
          {parent && (
            <p className="text-xs text-faint">Será subcategoría de {parent.name} ({parent.kind === "income" ? "ingreso" : "gasto"}).</p>
          )}
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
      </div>

      {!parent && (
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="exclude" className="size-4 accent-brand" />
          No contar en totales (omitir del flujo)
        </label>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
