import Link from "next/link";

import { requireUser } from "@/lib/session";
import { getTransactions, listCategories } from "@/lib/finanzas/data";
import { Empty } from "@/components/states";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "./transactions-table";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const me = await requireUser();
  const [rows, cats] = await Promise.all([
    getTransactions(me.id),
    listCategories(me.id),
  ]);

  if (rows.length === 0) {
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

  const options = cats.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
          Movimientos
        </h1>
        <p className="text-sm text-ink">
          Filtra, busca y ajusta la categoría de cada movimiento. Las Cajitas (apartados)
          no aparecen, no cuentan como gasto ni ingreso.
        </p>
      </header>

      <TransactionsTable rows={rows} options={options} />
    </div>
  );
}
