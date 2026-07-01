import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";

import { requireUser } from "@/lib/session";
import {
  getStatement,
  getStatementTransactions,
  listCategories,
} from "@/lib/finanzas/data";
import { money, period, shortDate } from "@/lib/finanzas/format";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";
import { CategorySelect } from "@/components/category-select";
import { ReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

const num = (v: string | null) => (v ? parseFloat(v) : 0);

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();

  const stmt = await getStatement(me.id, id);
  if (!stmt) redirect("/import");

  const [txs, cats] = await Promise.all([
    getStatementTransactions(me.id, id),
    listCategories(me.id),
  ]);

  const flow = txs.filter((t) => !t.isInternal);
  const internos = txs.length - flow.length;

  const incomeCats = cats
    .filter((c) => c.kind === "income")
    .map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId }));
  const expenseCats = cats
    .filter((c) => c.kind === "expense")
    .map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId }));

  const totals = [
    { label: "Depósitos", value: num(stmt.depositos), tone: "income" as const },
    { label: "Gastos", value: num(stmt.gastos), tone: "navy" as const },
    { label: "Saldo final", value: num(stmt.saldoFinal), tone: "navy" as const },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/import"
          className="inline-flex items-center gap-1.5 text-sm text-ink transition-colors hover:text-brand"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
          Importados
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
              Revisión del periodo
            </h1>
            <StatusChip status={stmt.status} />
          </div>
          <p className="text-sm text-ink">{period(stmt.periodStart, stmt.periodEnd)}</p>
        </div>
        <ReviewActions id={id} />
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {totals.map((t) => (
          <div key={t.label} className="rounded-xl border border-line bg-card px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-faint">
              {t.label}
            </div>
            <div
              className={cn(
                "mt-1 font-display text-xl font-bold tabular-nums",
                t.tone === "income" ? "text-income" : "text-navy",
              )}
            >
              {money(t.value)}
            </div>
          </div>
        ))}
      </section>

      {internos > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-line bg-brand-soft px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
          <p className="text-sm text-navy">
            Se excluyen {internos} movimiento{internos === 1 ? "" : "s"} de Cajitas (dinero
            propio que se aparta y regresa). No cuentan como gasto ni ingreso.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-navy">
            Movimientos del flujo
          </h2>
          <span className="text-xs tabular-nums text-ink">{flow.length} movimientos</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-line">
          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-faint">
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Movimiento</th>
                  <th className="px-4 py-2.5 font-medium">Categoría</th>
                  <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {flow.map((t) => (
                  <tr key={t.id} className="hover:bg-surface/60">
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink">
                      {shortDate(t.date)}
                    </td>
                    <td className="max-w-0 px-4 py-2.5">
                      <span className="block truncate text-navy">
                        {t.counterparty ?? t.description}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <CategorySelect
                        txId={t.id}
                        categoryId={t.categoryId}
                        options={t.direction === "in" ? incomeCats : expenseCats}
                      />
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums",
                        t.direction === "in" ? "text-income" : "text-navy",
                      )}
                    >
                      {t.direction === "in" ? "+" : "-"}
                      {money(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
