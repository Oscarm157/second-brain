import Link from "next/link";

import { requireUser } from "@/lib/session";
import {
  getTransactions,
  listCategories,
  listDebtOptions,
  listStatements,
} from "@/lib/finanzas/data";
import { period } from "@/lib/finanzas/format";
import { Empty } from "@/components/states";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "../dashboard/period-selector";
import { TransactionsTable } from "./transactions-table";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
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
          Movimientos
        </h1>
        <Empty
          title="Aún no hay movimientos"
          hint="Importa tu estado de cuenta de Nu para empezar a revisar y categorizar."
          action={
            <Button asChild>
              <Link href="/import">Importar estado de cuenta</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const current = statements.find((s) => s.id === sp.statement) ?? statements[0];
  const [rows, cats, debtOptions] = await Promise.all([
    getTransactions(me.id, current.id),
    listCategories(me.id),
    listDebtOptions(me.id),
  ]);

  const options = cats.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    parentId: c.parentId,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            Movimientos
          </h1>
          <p className="text-sm text-ink">
            {period(current.periodStart, current.periodEnd)}. Filtra, busca y ajusta la
            categoría de cada movimiento. Las Cajitas no cuentan y no aparecen.
          </p>
        </div>
        <PeriodSelector statements={statements} current={current.id} basePath="/transactions" />
      </header>

      <TransactionsTable rows={rows} options={options} debtOptions={debtOptions} />
    </div>
  );
}
