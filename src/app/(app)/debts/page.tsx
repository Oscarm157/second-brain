import Link from "next/link";

import { requireUser } from "@/lib/session";
import { listDebts, type DebtRow } from "@/lib/finanzas/data";
import { money, shortDate } from "@/lib/finanzas/format";
import { Empty } from "@/components/states";
import { AddDebt } from "./add-debt";
import { DeleteDebtButton, ToggleStatusButton } from "./debt-actions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  prestamo: "Préstamo",
  tarjeta: "Tarjeta",
  persona: "Persona",
  otro: "Otro",
};

export default async function DebtsPage() {
  const me = await requireUser();
  const debts = await listDebts(me.id);

  const open = debts.filter((d) => d.status === "open");
  const totalDebo = open.reduce((s, d) => s + Math.max(0, d.saldo), 0);
  const mensual = open.reduce((s, d) => s + (d.monthlyPayment ?? 0), 0);
  const vencidas = open.filter((d) => d.vencida);
  const proximos = open
    .filter((d) => d.proximoPago)
    .sort((a, b) => (a.proximoPago! < b.proximoPago! ? -1 : 1))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">Deudas</h1>
          <p className="text-sm text-ink">
            A quién y cuánto debes, con mensualidad, plazo y tu avance. Vincula movimientos del
            banco para que el saldo baje solo.
          </p>
        </div>
        <AddDebt />
      </header>

      {debts.length === 0 ? (
        <Empty
          title="Todavía no mapeas ninguna deuda"
          hint="Agrega tu primera deuda con su monto original, lo que debes hoy y su mensualidad."
        />
      ) : (
        <>
          {/* Resumen */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Debes en total" value={money(totalDebo)} accent="text-navy" />
            <SummaryCard label="Comprometido al mes" value={money(mensual)} accent="text-navy" />
            <SummaryCard label="Deudas activas" value={String(open.length)} accent="text-navy" />
            <SummaryCard
              label="Vencidas"
              value={String(vencidas.length)}
              accent={vencidas.length ? "text-alert" : "text-navy"}
            />
          </section>

          {proximos.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">Próximos vencimientos</h2>
              <ul className="flex flex-wrap gap-x-8 gap-y-2">
                {proximos.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm">
                    <span className="tabular-nums text-faint">{shortDate(d.proximoPago!)}</span>
                    <span className="text-navy">{d.counterparty}</span>
                    {d.monthlyPayment ? (
                      <span className="tabular-nums text-ink">{money(d.monthlyPayment)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Lista */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {debts.map((d) => (
              <DebtCard key={d.id} d={d} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function DebtCard({ d }: { d: DebtRow }) {
  const paid = d.status === "paid";
  const pct = Math.round(d.progreso * 100);

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/debts/${d.id}`}
            className="block truncate font-medium text-navy hover:text-brand"
          >
            {d.counterparty}
          </Link>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-faint">
            <span>{KIND_LABEL[d.kind ?? "otro"] ?? "Otro"}</span>
            {paid && (
              <span className="rounded-full bg-income/10 px-2 py-0.5 font-medium text-income">
                Pagada
              </span>
            )}
            {d.vencida && (
              <span className="rounded-full bg-alert/10 px-2 py-0.5 font-medium text-alert">
                Vencida
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ToggleStatusButton id={d.id} status={d.status} />
          <DeleteDebtButton id={d.id} name={d.counterparty} />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-faint">Saldo</p>
          <p className="font-display text-2xl font-bold tabular-nums text-navy">
            {money(Math.max(0, d.saldo))}
          </p>
        </div>
        <p className="text-xs tabular-nums text-faint">de {money(d.principal)}</p>
      </div>

      {/* Progreso */}
      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-faint">
          {pct}% pagado · {money(d.pagadoTotal)} abonado
        </p>
      </div>

      {/* Meta */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {d.monthlyPayment ? <Meta label="Mensual" value={money(d.monthlyPayment)} /> : null}
        {d.paymentDay ? <Meta label="Día de pago" value={`Día ${d.paymentDay}`} /> : null}
        {d.interestRate ? <Meta label="Tasa" value={`${d.interestRate}%`} /> : null}
        {d.termMonths ? <Meta label="Plazo" value={`${d.termMonths} meses`} /> : null}
        {d.dueDate ? <Meta label="Fecha límite" value={shortDate(d.dueDate)} /> : null}
        {d.linkedCount ? <Meta label="Movimientos" value={`${d.linkedCount} vinculados`} /> : null}
      </dl>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-faint">{label}</dt>
      <dd className="tabular-nums text-navy">{value}</dd>
    </div>
  );
}
