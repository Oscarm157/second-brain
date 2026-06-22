import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/session";
import { getDashboard, listScenarios, listStatements } from "@/lib/finanzas/data";
import { period } from "@/lib/finanzas/format";
import { Empty } from "@/components/states";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "../dashboard/period-selector";
import { ScenarioBoard } from "./scenario-board";

export const dynamic = "force-dynamic";

export default async function ScenariosPage({
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
          Escenarios
        </h1>
        <Empty
          title="Todavía no hay datos"
          hint="Importa un estado de cuenta para poder simular escenarios sobre tu mes."
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
  if (!data) redirect("/scenarios");

  const saved = await listScenarios(me.id, data.statement.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            Escenarios
          </h1>
          <p className="text-sm text-ink">
            Omite conceptos o cámbiales el monto para ver cómo quedaría tu{" "}
            {period(data.statement.periodStart, data.statement.periodEnd)}. No afecta tus datos reales.
          </p>
        </div>
        <PeriodSelector statements={statements} current={data.statement.id} basePath="/scenarios" />
      </header>

      <ScenarioBoard
        statementId={data.statement.id}
        income={data.incomeByCategory.map((c) => ({
          key: `in:${c.id}`,
          name: c.name,
          color: c.color,
          real: c.total,
        }))}
        expense={data.spendByCategory.map((c) => ({
          key: `out:${c.id}`,
          name: c.name,
          color: c.color,
          real: c.total,
        }))}
        realIngresos={data.kpis.ingresos}
        realGastos={data.kpis.gastos}
        saved={saved.map((s) => ({ id: s.id, name: s.name, adjustments: s.adjustments }))}
      />
    </div>
  );
}
