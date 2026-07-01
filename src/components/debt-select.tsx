"use client";

import { useState, useTransition } from "react";

import { linkTransactionToDebt } from "@/app/(app)/debts/actions";
import type { DebtOption } from "@/lib/finanzas/data";
import { cn } from "@/lib/utils";

export function DebtSelect({
  txId,
  debtId,
  options,
}: {
  txId: string;
  debtId: string | null;
  options: DebtOption[];
}) {
  const [value, setValue] = useState(debtId ?? "");
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    startTransition(() => {
      linkTransactionToDebt(txId, next || null);
    });
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={pending}
      aria-label="Deuda del movimiento"
      className={cn(
        "h-8 w-full max-w-40 rounded-md border border-line bg-card px-2 text-xs outline-none transition-colors",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
        value ? "text-navy" : "text-faint",
      )}
    >
      <option value="">Sin deuda</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.counterparty}
        </option>
      ))}
    </select>
  );
}
