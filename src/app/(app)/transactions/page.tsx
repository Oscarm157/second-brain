import Link from "next/link";

import { requireUser } from "@/lib/session";
import { getTransactions, listCategories } from "@/lib/finanzas/data";
import { money, shortDate } from "@/lib/finanzas/format";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/states";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/category-select";

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
          Revisa cada movimiento y ajusta su categoría. Las Cajitas (apartados) no
          aparecen, no cuentan como gasto ni ingreso.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="max-h-[70vh] overflow-y-auto">
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
              {rows.map((t) => (
                <tr key={t.id} className="align-middle">
                  <td className="whitespace-nowrap px-5 py-2.5 text-ink">
                    {shortDate(t.date)}
                  </td>
                  <td className="max-w-md px-5 py-2.5">
                    <span className="block truncate text-navy">
                      {t.counterparty ?? t.description}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <CategorySelect
                      txId={t.id}
                      categoryId={t.categoryId}
                      options={options}
                    />
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-faint">{rows.length} movimientos de flujo (sin Cajitas).</p>
    </div>
  );
}
