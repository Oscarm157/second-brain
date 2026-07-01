"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { money } from "@/lib/finanzas/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveScenario, deleteScenario } from "./actions";

const PCTS = Array.from({ length: 21 }, (_, i) => i * 10); // 0,10,...,200

type Item = { key: string; name: string; color: string; real: number };
type Adjustment = { key: string; included: boolean; amount: number };
type Saved = { id: string; name: string; adjustments: Adjustment[] };
type Adj = { included: boolean; amount: number };

export function ScenarioBoard({
  statementId,
  income,
  expense,
  realIngresos,
  realGastos,
  saved,
}: {
  statementId: string;
  income: Item[];
  expense: Item[];
  realIngresos: number;
  realGastos: number;
  saved: Saved[];
}) {
  const all = useMemo(() => [...income, ...expense], [income, expense]);
  const realOf = (key: string) => all.find((i) => i.key === key)?.real ?? 0;

  const [adj, setAdj] = useState<Map<string, Adj>>(new Map());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const get = (key: string): Adj => adj.get(key) ?? { included: true, amount: realOf(key) };
  const patch = (key: string, p: Partial<Adj>) =>
    setAdj((prev) => {
      const next = new Map(prev);
      next.set(key, { ...get(key), ...p });
      return next;
    });

  const sum = (items: Item[]) =>
    items.reduce((s, i) => {
      const a = get(i.key);
      return s + (a.included ? a.amount : 0);
    }, 0);

  const ingresosAj = sum(income);
  const gastosAj = sum(expense);
  const netoAj = ingresosAj - gastosAj;
  const netoReal = realIngresos - realGastos;

  function resetAll() {
    setAdj(new Map());
    setCurrentId(null);
    setName("");
  }

  function load(s: Saved) {
    const m = new Map<string, Adj>();
    for (const a of s.adjustments) m.set(a.key, { included: a.included, amount: a.amount });
    setAdj(m);
    setCurrentId(s.id);
    setName(s.name);
  }

  function buildAdjustments(): Adjustment[] {
    return all
      .map((i) => ({ key: i.key, ...get(i.key) }))
      .filter((a) => !a.included || a.amount !== realOf(a.key));
  }

  function save(asNew: boolean) {
    if (!name.trim()) {
      toast.error("Ponle nombre al escenario.");
      return;
    }
    startTransition(async () => {
      const res = await saveScenario({
        id: asNew ? undefined : currentId ?? undefined,
        name: name.trim(),
        statementId,
        adjustments: buildAdjustments(),
      });
      if ("error" in res) toast.error(res.error);
      else {
        setCurrentId(res.id);
        toast.success("Escenario guardado.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Eliminar este escenario?")) return;
    startTransition(async () => {
      await deleteScenario(id);
      if (currentId === id) resetAll();
      toast.success("Escenario eliminado.");
    });
  }

  const netoColor = netoAj >= 0 ? "text-emerald-400" : "text-rose-400";

  const list = (items: Item[], accent: string) => (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div
        className={cn(
          "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide",
          accent === "Ingresos" ? "bg-income text-income-foreground" : "bg-expense text-expense-foreground",
        )}
      >
        {accent}
      </div>
      <ul className="divide-y divide-line">
        {items.length === 0 && (
          <li className="px-4 py-4 text-sm text-ink">Nada en este periodo.</li>
        )}
        {items.map((i) => {
          const a = get(i.key);
          return (
            <li key={i.key} className={cn("px-4 py-2.5", !a.included && "opacity-50")}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={a.included}
                  onChange={(e) => patch(i.key, { included: e.target.checked })}
                  aria-label={`Incluir ${i.name}`}
                  className="size-4 shrink-0 accent-brand"
                />
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: i.color }} />
                <span className="min-w-0 flex-1 truncate text-sm text-navy">{i.name}</span>
                <span className="hidden w-24 shrink-0 text-right text-xs tabular-nums text-faint sm:block">
                  {money(i.real)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-faint">$</span>
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(a.amount) ? a.amount : 0}
                    onChange={(e) => patch(i.key, { amount: parseFloat(e.target.value) || 0 })}
                    disabled={!a.included}
                    className="h-8 w-24 rounded-md border border-line bg-card px-2 text-right text-sm tabular-nums text-navy outline-none focus-visible:border-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => patch(i.key, { amount: Math.round((i.real / 2) * 100) / 100, included: true })}
                  className="h-7 rounded-md border border-line px-2 text-xs text-ink hover:bg-surface"
                >
                  ½
                </button>
                <select
                  value={(() => {
                    const p = i.real > 0 ? Math.round((a.amount / i.real) * 100) : 0;
                    return p % 10 === 0 && p >= 0 && p <= 200 ? String(p) : "";
                  })()}
                  onChange={(e) =>
                    patch(i.key, {
                      amount: Math.round(((i.real * Number(e.target.value)) / 100) * 100) / 100,
                      included: true,
                    })
                  }
                  aria-label="Porcentaje del real"
                  className="h-7 rounded-md border border-line bg-card px-1 text-xs text-ink outline-none focus-visible:border-brand"
                >
                  <option value="">%</option>
                  {PCTS.map((p) => (
                    <option key={p} value={p}>
                      {p}%
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => patch(i.key, { amount: i.real, included: true })}
                  aria-label="Restablecer"
                  className="text-faint transition-colors hover:text-navy"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Banda de resultado en vivo */}
      <section className="rounded-2xl bg-hero p-6 text-hero-foreground sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-wide text-hero-foreground/55">Neto ajustado</span>
            <div className={cn("font-display text-4xl font-bold tabular-nums sm:text-5xl", netoColor)}>
              {netoAj >= 0 ? "+" : "-"}
              {money(Math.abs(netoAj))}
            </div>
            <p className="mt-1 text-sm text-hero-foreground/55">
              Real del mes: {netoReal >= 0 ? "+" : "-"}
              {money(Math.abs(netoReal))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-xs uppercase tracking-wide text-hero-foreground/55">Ingresos</span>
              <div className="font-display text-xl font-bold tabular-nums text-emerald-400">
                {money(ingresosAj)}
              </div>
              <p className="text-xs text-hero-foreground/40 tabular-nums">de {money(realIngresos)}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-hero-foreground/55">Gastos</span>
              <div className="font-display text-xl font-bold tabular-nums">{money(gastosAj)}</div>
              <p className="text-xs text-hero-foreground/40 tabular-nums">de {money(realGastos)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guardar / abrir escenarios */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {saved.length > 0 && <span className="text-xs text-faint">Guardados:</span>}
          {saved.map((s) => (
            <span
              key={s.id}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                currentId === s.id ? "border-brand bg-brand-soft text-navy" : "border-line text-ink",
              )}
            >
              <button type="button" onClick={() => load(s)} className="hover:underline">
                {s.name}
              </button>
              <button type="button" onClick={() => remove(s.id)} aria-label="Eliminar">
                <Trash2 className="size-3 text-faint hover:text-alert" />
              </button>
            </span>
          ))}
          <button type="button" onClick={resetAll} className="flex items-center gap-1 text-xs text-ink hover:text-navy">
            <RotateCcw className="size-3" /> Restablecer
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del escenario"
            maxLength={60}
            className="h-9 w-48"
          />
          {currentId ? (
            <>
              <Button onClick={() => save(false)} disabled={pending}>
                <Save className="size-4" /> Guardar
              </Button>
              <Button variant="outline" onClick={() => save(true)} disabled={pending}>
                Como nuevo
              </Button>
            </>
          ) : (
            <Button onClick={() => save(true)} disabled={pending}>
              <Save className="size-4" /> Guardar
            </Button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list(income, "Ingresos")}
        {list(expense, "Gastos")}
      </div>
    </div>
  );
}
