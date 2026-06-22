import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { requireUser } from "@/lib/session";
import { listStatements } from "@/lib/finanzas/data";
import { money, period } from "@/lib/finanzas/format";
import { Empty } from "@/components/states";
import { StatusChip } from "@/components/status-chip";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";
// El import parsea, categoriza con IA e inserta cientos de filas; dale margen de tiempo.
export const maxDuration = 60;

export default async function ImportPage() {
  const me = await requireUser();
  const statements = await listStatements(me.id);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
          Importar estado de cuenta
        </h1>
        <p className="text-sm text-ink">
          Sube el PDF mensual de tu cuenta Nu. Se leen los movimientos, se proponen
          categorías y los revisas antes de sumarlos al dashboard.
        </p>
      </header>

      <ImportForm />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-navy">Importados</h2>
        {statements.length === 0 ? (
          <Empty
            title="Aún no importas ningún estado de cuenta"
            hint="Sube tu primer PDF de Nu con el cuadro de arriba."
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {statements.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/import/${s.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-navy">
                        {period(s.periodStart, s.periodEnd)}
                      </span>
                      <StatusChip status={s.status} />
                    </div>
                    <div className="mt-0.5 flex gap-4 text-xs tabular-nums text-ink">
                      <span>
                        Ingresos{" "}
                        <span className="font-medium text-income">{money(s.depositos)}</span>
                      </span>
                      <span>
                        Gastos <span className="font-medium text-navy">{money(s.gastos)}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
