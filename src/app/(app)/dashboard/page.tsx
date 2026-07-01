import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/session";
import { getDashboard, listStatements } from "@/lib/finanzas/data";
import { money, period, shortDate } from "@/lib/finanzas/format";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/states";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { KpiRow } from "./kpi-row";
import { SpendDonut } from "./spend-donut";
import { CashflowChart } from "./cashflow-chart";
import { PeriodSelector } from "./period-selector";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ statement?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;

  const statements = await listStatements(me.id);
  if (statements.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
          Dashboard
        </h1>
        <Empty
          title="Todavía no hay nada que mostrar"
          hint="Importa tu primer estado de cuenta de Nu para ver ingresos, gastos y a dónde se va el dinero."
          action={
            <Button asChild>
              <Link href="/import">Importar estado de cuenta</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const data = await getDashboard(me.id, sp.statement);
  if (!data) redirect("/dashboard");

  const { statement, kpis, spendByCategory, incomeByCategory, cashflow, recent, counts } =
    data;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
              Dashboard
            </h1>
            <StatusChip status={statement.status} />
          </div>
          <p className="text-sm text-ink">
            Periodo {period(statement.periodStart, statement.periodEnd)}
          </p>
        </div>
        <PeriodSelector statements={statements} current={statement.id} />
      </header>

      <KpiRow
        ingresos={kpis.ingresos}
        gastos={kpis.gastos}
        balance={kpis.balance}
        saldoFinal={kpis.saldoFinal}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-5 lg:p-6">
          <div className="mb-5">
            <h2 className="inline-flex rounded-md bg-income px-2.5 py-1 text-sm font-semibold text-income-foreground">
              Ingreso por categoría
            </h2>
          </div>
          <SpendDonut
            data={incomeByCategory}
            total={kpis.ingresos}
            label="Ingreso"
            emptyText="Sin ingresos en este periodo."
          />
        </section>

        <section className="rounded-xl border border-line bg-card p-5 lg:p-6">
          <div className="mb-5">
            <h2 className="inline-flex rounded-md bg-expense px-2.5 py-1 text-sm font-semibold text-expense-foreground">
              Gasto por categoría
            </h2>
          </div>
          <SpendDonut data={spendByCategory} total={kpis.gastos} />
        </section>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-4">
          <h2 className="text-sm font-semibold text-navy">Entradas y salidas</h2>
          <div className="flex items-center gap-3 text-xs text-ink">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-income" />
              Entradas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand" />
              Salidas
            </span>
          </div>
        </div>
        <CashflowChart data={cashflow} />
      </section>

      <section className="rounded-xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy">Movimientos recientes</h2>
          <Link href={`/import/${statement.id}`} className="text-xs text-brand hover:underline">
            Ver todos
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.map((t) => (
            <li
              key={t.id}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5",
                t.isInternal && "opacity-60",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: t.categoryColor ?? "var(--faint)" }}
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm text-navy">
                  {t.counterparty ?? t.description}
                </span>
                <span className="text-xs text-faint">{shortDate(t.date)}</span>
              </div>
              {t.isInternal && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink">
                  Interno
                </span>
              )}
              <span
                className={cn(
                  "shrink-0 text-sm font-medium tabular-nums",
                  t.direction === "in" ? "text-income" : "text-navy",
                )}
              >
                {t.direction === "in" ? "+" : "-"}
                {money(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-faint">
        {counts.total} movimientos en el periodo: {counts.flujo} de flujo y {counts.internos}{" "}
        de Cajitas (excluidas de los totales).
      </p>
    </div>
  );
}
