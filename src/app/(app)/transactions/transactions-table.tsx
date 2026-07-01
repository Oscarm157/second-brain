"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";

import type { TxRow } from "@/lib/finanzas/data";
import { updateTransactionCategories } from "@/app/(app)/import/actions";
import { money, parseDetail, shortDate } from "@/lib/finanzas/format";
import { cn } from "@/lib/utils";
import { CategorySelect } from "@/components/category-select";
import { DebtSelect } from "@/components/debt-select";
import { categoryOptionNodes, type CatOpt } from "@/components/category-options";
import type { DebtOption } from "@/lib/finanzas/data";

type Dir = "all" | "in" | "out";

export function TransactionsTable({
  rows,
  options,
  debtOptions,
}: {
  rows: TxRow[];
  options: CatOpt[];
  debtOptions: DebtOption[];
}) {
  const [dir, setDir] = useState<Dir>("all");
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSel = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((t) => {
      if (dir !== "all" && t.direction !== dir) return false;
      if (cat !== "all") {
        if (cat === "none" ? t.categoryId !== null : t.categoryId !== cat) return false;
      }
      if (query && !(t.counterparty ?? t.description).toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [rows, dir, cat, q]);

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((t) => next.delete(t.id));
      else filtered.forEach((t) => next.add(t.id));
      return next;
    });

  function moveSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    const target = bulkCat || null;
    startTransition(async () => {
      await updateTransactionCategories(ids, target);
      const name = options.find((o) => o.id === bulkCat)?.name ?? "Sin categoría";
      toast.success(`${ids.length} movimientos movidos a ${name}.`);
      setSelected(new Set());
      setBulkCat("");
    });
  }

  const net = filtered.reduce((a, t) => a + (t.direction === "in" ? t.amount : -t.amount), 0);
  const showDebt = debtOptions.length > 0;
  const totalCols = showDebt ? 6 : 5;

  const dirBtn = (value: Dir, label: string) => (
    <button
      type="button"
      onClick={() => setDir(value)}
      className={cn(
        "h-8 rounded-md px-3 text-xs font-medium transition-colors",
        dir === value ? "bg-brand text-white" : "text-ink hover:bg-surface",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1">
          {dirBtn("all", "Todos")}
          {dirBtn("in", "Entradas")}
          {dirBtn("out", "Salidas")}
        </div>
        <div className="flex flex-1 items-center gap-2 sm:justify-end">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-9 max-w-52 rounded-md border border-line bg-card px-2 text-sm text-navy outline-none focus-visible:border-brand"
          >
            <option value="all">Todas las categorías</option>
            <option value="none">Sin categoría</option>
            {categoryOptionNodes(options)}
          </select>
          <div className="relative flex-1 sm:max-w-56">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar movimiento"
              className="h-9 w-full rounded-md border border-line bg-card pl-8 pr-2 text-sm text-navy outline-none focus-visible:border-brand"
            />
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-navy">
            {selected.size} seleccionados
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkCat}
              onChange={(e) => setBulkCat(e.target.value)}
              className="h-9 max-w-52 rounded-md border border-line bg-card px-2 text-sm text-navy outline-none focus-visible:border-brand"
            >
              <option value="">Sin categoría</option>
              {categoryOptionNodes(options)}
            </select>
            <button
              type="button"
              onClick={moveSelected}
              disabled={pending}
              className="h-9 rounded-md bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {pending ? "Moviendo..." : `Mover ${selected.size}`}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Limpiar selección"
              className="text-ink transition-colors hover:text-navy"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="max-h-[68vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="text-left text-xs uppercase tracking-wide text-faint">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Seleccionar todos"
                    className="size-4 accent-brand"
                  />
                </th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Movimiento</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                {showDebt && <th className="px-5 py-3 font-medium">Deuda</th>}
                <th className="px-5 py-3 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((t) => (
                <Fragment key={t.id}>
                  <tr
                    className={cn(
                      "align-middle",
                      selected.has(t.id) && "bg-brand-soft/50",
                      t.categoryExcluded && "opacity-55",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggleSel(t.id)}
                        aria-label="Seleccionar movimiento"
                        className="size-4 accent-brand"
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-ink">
                      {shortDate(t.date)}
                    </td>
                    <td className="max-w-md px-5 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(t.id)}
                        className="flex w-full items-center gap-2 text-left"
                      >
                        <ChevronRight
                          className={cn(
                            "size-3.5 shrink-0 text-faint transition-transform",
                            open.has(t.id) && "rotate-90",
                          )}
                        />
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: t.categoryColor ?? "var(--faint)" }}
                        />
                        <span className="truncate text-navy hover:text-brand">
                          {t.counterparty ?? t.description}
                        </span>
                        {t.categoryExcluded && (
                          <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-ink">
                            No cuenta
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-2.5">
                      <CategorySelect txId={t.id} categoryId={t.categoryId} options={options} />
                    </td>
                    {showDebt && (
                      <td className="px-5 py-2.5">
                        <DebtSelect txId={t.id} debtId={t.debtId} options={debtOptions} />
                      </td>
                    )}
                    <td
                      className={cn(
                        "whitespace-nowrap px-5 py-2.5 text-right font-medium tabular-nums",
                        t.direction === "in" ? "text-income" : "text-navy",
                      )}
                    >
                      {t.direction === "in" ? "+" : "-"}
                      {money(t.amount)}
                    </td>
                  </tr>
                  {open.has(t.id) && (
                    <tr className="bg-surface/60">
                      <td colSpan={2} />
                      <td colSpan={totalCols - 2} className="px-5 pb-3 pt-0">
                        <div className="rounded-lg border border-line bg-card p-4 text-xs">
                          <p className="mb-3 font-medium text-navy">{t.description}</p>
                          {(() => {
                            const fields = parseDetail(t.rawDetail);
                            if (fields.length === 0) {
                              return t.rawDetail ? (
                                <p className="leading-relaxed text-ink">{t.rawDetail}</p>
                              ) : (
                                <p className="text-faint">
                                  Sin detalle adicional en el estado de cuenta.
                                </p>
                              );
                            }
                            return (
                              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                                {fields.map((f) => (
                                  <div
                                    key={f.label}
                                    className="flex justify-between gap-3 border-b border-line/60 pb-1.5"
                                  >
                                    <dt className="shrink-0 text-faint">{f.label}</dt>
                                    <dd className="truncate text-right font-medium text-navy">
                                      {f.value}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={totalCols} className="px-5 py-10 text-center text-sm text-ink">
                    Ningún movimiento con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-faint">
        {filtered.length} de {rows.length} movimientos · neto {net >= 0 ? "+" : "-"}
        {money(Math.abs(net))}
      </p>
    </div>
  );
}
