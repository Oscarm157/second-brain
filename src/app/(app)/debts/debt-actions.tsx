"use client";

import { useTransition } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDebt, toggleDebtStatus } from "./actions";

export function ToggleStatusButton({
  id,
  status,
}: {
  id: string;
  status: "open" | "paid";
}) {
  const [pending, startTransition] = useTransition();
  const paid = status === "paid";

  function onClick() {
    startTransition(async () => {
      await toggleDebtStatus(id);
      toast.success(paid ? "Deuda reabierta." : "Deuda marcada como pagada.");
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={paid ? "Reabrir deuda" : "Marcar pagada"}
      title={paid ? "Reabrir" : "Marcar pagada"}
      className="text-faint transition-colors hover:text-income disabled:opacity-50"
    >
      {paid ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
    </button>
  );
}

export function DeleteDebtButton({
  id,
  name,
  redirectTo,
}: {
  id: string;
  name: string;
  redirectTo?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Borrar la deuda con "${name}"? Los movimientos vinculados quedarán libres.`))
      return;
    startTransition(async () => {
      await deleteDebt(id);
      toast.success("Deuda borrada.");
      if (redirectTo) window.location.href = redirectTo;
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label={`Borrar deuda con ${name}`}
      className="text-faint transition-colors hover:text-alert disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
