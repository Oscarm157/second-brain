"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import type { TxRow } from "@/lib/finanzas/data";
import { money, parseDetail, shortDate } from "@/lib/finanzas/format";
import { cn } from "@/lib/utils";
import { CategorySelect } from "@/components/category-select";

type Option = { id: string; name: string };
type Dir = "all" | "in" | "out";

export function TransactionsTable({
  rows,
  options,
}: {
  rows: TxRow[];
  options: Option[];
}) {
  const [dir, setDir] = useState<Dir>("all");
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
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

  const net = filtered.reduce((a, t) => a + (t.direction === "in" ? t.amount : -t.amount), 0);

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
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          {dirBtn("all", "Todos")}
          {dirBtn("in", "Entradas")}
          {dirBtn("out", "Salidas")}
        </div>
        <div className="flex flex-1 items-center gap-2 sm:justify-end">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-9 max-w-52 rounded-md border border-line bg-white px-2 text-sm text-navy outline-none focus-visible:border-brand"
          >
            <option value="all">Todas las categorías</option>
            <option value="none">Sin categoría</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 sm:max-w-56">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar movimiento"
              className="h-9 w-full rounded-md border border-line bg-white pl-8 pr-2 text-sm text-navy outline-none focus-visible:border-brand"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="max-h-[68vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Movimiento</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((t) => (
                <Fragment key={t.id}>
                  <tr className="align-middle">
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
                          style={{ backgroundColor: t.categoryColor ?? "#cbd2dd" }}
                        />
                        <span className="truncate text-navy hover:text-brand">
                          {t.counterparty ?? t.description}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-2.5">
                      <CategorySelect txId={t.id} categoryId={t.categoryId} options={options} />
                    </td>
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
                      <td />
                      <td colSpan={3} className="px-5 pb-3 pt-0">
                        <div className="rounded-lg border border-line bg-white p-4 text-xs">
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
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink">
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
