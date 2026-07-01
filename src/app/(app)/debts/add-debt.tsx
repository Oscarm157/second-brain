"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { DebtForm } from "./debt-form";

export function AddDebt() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
      >
        <Plus className="size-4" />
        Nueva deuda
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">Nueva deuda</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="text-faint transition-colors hover:text-navy"
        >
          <X className="size-4" />
        </button>
      </div>
      <DebtForm onDone={() => setOpen(false)} />
    </section>
  );
}
