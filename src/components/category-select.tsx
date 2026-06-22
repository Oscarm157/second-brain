"use client";

import { useState, useTransition } from "react";

import { updateTransactionCategory } from "@/app/(app)/import/actions";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

export function CategorySelect({
  txId,
  categoryId,
  options,
}: {
  txId: string;
  categoryId: string | null;
  options: Option[];
}) {
  const [value, setValue] = useState(categoryId ?? "");
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    startTransition(() => updateTransactionCategory(txId, next || null));
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={pending}
      aria-label="Categoría del movimiento"
      className={cn(
        "h-8 w-full max-w-44 rounded-md border border-line bg-white px-2 text-xs text-navy outline-none transition-colors",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
        value ? "" : "text-ink",
      )}
    >
      <option value="">Sin categoría</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
