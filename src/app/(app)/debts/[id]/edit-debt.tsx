"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";

import { DebtForm, type DebtFormValues } from "../debt-form";

export function EditDebt({ debt }: { debt: DebtFormValues }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-navy transition-colors hover:bg-surface"
      >
        <Pencil className="size-3.5" />
        Editar
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">Editar deuda</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="text-faint transition-colors hover:text-navy"
        >
          <X className="size-4" />
        </button>
      </div>
      <DebtForm debt={debt} onDone={() => setOpen(false)} />
    </section>
  );
}
