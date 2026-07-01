import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/session";
import { getDebt } from "@/lib/finanzas/data";
import { money, shortDate } from "@/lib/finanzas/format";
import { DeleteDebtButton, ToggleStatusButton } from "../debt-actions";
import { EditDebt } from "./edit-debt";
import { LinkTransactions } from "./link-transactions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  prestamo: "Préstamo",
  tarjeta: "Tarjeta",
  persona: "Persona",
  otro: "Otro",
};

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const data = await getDebt(me.id, id);
  if (!data) notFound();

  const { debt, movimientos, saldo, pagadoTotal, progreso } = data;
  const pct = Math.round(progreso * 100);
  const paid = debt.status === "paid";

  return (
    <div className="space-y-6">
      <Link
        href="/debts"
        className="inline-flex items-center gap-1.5 text-sm text-ink transition-colors hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        Deudas
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
              {debt.counterparty}
            </h1>
            {paid && (
              <span className="rounded-full bg-income/10 px-2 py-0.5 text-xs font-medium text-income">
                Pagada
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-faint">{KIND_LABEL[debt.kind ?? "otro"] ?? "Otro"}</p>
        </div>
        <div className="flex items-center gap-3">
          <EditDebt debt={debt} />
          <ToggleStatusButton id={debt.id} status={debt.status} />
          <DeleteDebtButton id={debt.id} name={debt.counterparty} redirectTo="/debts" />
        </div>
      </header>

      {/* Desglose */}
      <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Saldo actual" value={money(Math.max(0, saldo))} big />
          <Stat label="Monto original" value={money(debt.principal)} />
          <Stat label="Abonado" value={money(pagadoTotal)} />
        </div>

        <div className="mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-faint">{pct}% pagado</p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {debt.monthlyPayment ? <Row label="Pago mensual" value={money(debt.monthlyPayment)} /> : null}
          {debt.paymentDay ? <Row label="Día de pago" value={`Día ${debt.paymentDay}`} /> : null}
          {debt.interestRate ? <Row label="Tasa" value={`${debt.interestRate}%`} /> : null}
          {debt.termMonths ? <Row label="Plazo" value={`${debt.termMonths} meses`} /> : null}
          {debt.startDate ? <Row label="Inicio" value={shortDate(debt.startDate)} /> : null}
          {debt.dueDate ? <Row label="Fecha límite" value={shortDate(debt.dueDate)} /> : null}
        </dl>

        {debt.description ? (
          <p className="mt-4 border-t border-line pt-4 text-sm text-ink">{debt.description}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <LinkTransactions debtId={debt.id} linked={movimientos} />
      </section>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
      <p
        className={`mt-1 font-display font-bold tabular-nums text-navy ${
          big ? "text-3xl" : "text-xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-line/60 pb-1.5">
      <dt className="text-faint">{label}</dt>
      <dd className="tabular-nums text-navy">{value}</dd>
    </div>
  );
}
