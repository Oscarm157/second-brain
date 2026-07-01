"use client";

import { useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { linkTransactionToDebt, searchUnassignedTx } from "../actions";
import { money, shortDate } from "@/lib/finanzas/format";
import type { DebtLinkedTx } from "@/lib/finanzas/data";
import { cn } from "@/lib/utils";

export function LinkTransactions({
  debtId,
  linked,
}: {
  debtId: string;
  linked: DebtLinkedTx[];
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DebtLinkedTx[]>([]);
  const [searching, startSearch] = useTransition();
  const [pending, startAction] = useTransition();

  function runSearch(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchUnassignedTx(value));
    });
  }

  function link(txId: string) {
    startAction(async () => {
      await linkTransactionToDebt(txId, debtId);
      setResults((r) => r.filter((t) => t.id !== txId));
      toast.success("Movimiento vinculado.");
    });
  }

  function unlink(txId: string) {
    startAction(async () => {
      await linkTransactionToDebt(txId, null);
      toast.success("Movimiento desvinculado.");
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy">
          Movimientos vinculados ({linked.length})
        </h2>
        {linked.length === 0 ? (
          <p className="text-sm text-faint">
            Aún no vinculas movimientos. Busca abajo los pagos o préstamos de esta deuda.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {linked.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-14 shrink-0 tabular-nums text-faint">
                  {shortDate(t.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-navy">{t.description}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    t.direction === "out"
                      ? "bg-income/10 text-income"
                      : "bg-alert/10 text-alert",
                  )}
                >
                  {t.direction === "out" ? "Pago" : "Préstamo"}
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums text-navy">
                  {money(t.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => unlink(t.id)}
                  disabled={pending}
                  aria-label="Desvincular"
                  className="text-faint transition-colors hover:text-alert disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-navy">Agregar movimiento</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Busca por descripción o contraparte"
            className="h-9 w-full rounded-md border border-line bg-card pl-8 pr-2 text-sm text-navy outline-none focus-visible:border-brand"
          />
        </div>

        {q.trim() && (
          <ul className="mt-2 max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
            {searching && (
              <li className="px-4 py-3 text-sm text-faint">Buscando...</li>
            )}
            {!searching && results.length === 0 && (
              <li className="px-4 py-3 text-sm text-faint">
                Sin movimientos libres con ese texto.
              </li>
            )}
            {results.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-14 shrink-0 tabular-nums text-faint">
                  {shortDate(t.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-navy">{t.description}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    t.direction === "out" ? "text-income" : "text-alert",
                  )}
                >
                  {t.direction === "out" ? "+" : "-"}
                  {money(t.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => link(t.id)}
                  disabled={pending}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-navy transition-colors hover:bg-surface disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  Vincular
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
