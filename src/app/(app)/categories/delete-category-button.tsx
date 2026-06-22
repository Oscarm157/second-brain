"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCategory } from "./actions";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Borrar la categoría "${name}"? Sus movimientos quedarán sin categoría.`)) return;
    startTransition(async () => {
      await deleteCategory(id);
      toast.success("Categoría borrada.");
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label={`Borrar ${name}`}
      className="text-faint transition-colors hover:text-alert disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
