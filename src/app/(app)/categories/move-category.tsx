"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateCategoryParent } from "./actions";

type Parent = { id: string; name: string };

export function MoveCategory({
  id,
  parentId,
  isParent,
  hasChildren,
  parents,
}: {
  id: string;
  parentId: string | null;
  isParent: boolean;
  hasChildren: boolean;
  parents: Parent[];
}) {
  const [pending, startTransition] = useTransition();

  // No se puede mover una categoría que ya tiene subcategorías (solo un nivel).
  if (hasChildren) return null;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value || null;
    startTransition(async () => {
      const res = await updateCategoryParent(id, next);
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <select
      value={parentId ?? ""}
      onChange={onChange}
      disabled={pending}
      aria-label="Mover bajo categoría"
      className="h-7 max-w-36 rounded-md border border-line bg-card px-1.5 text-xs text-ink outline-none focus-visible:border-brand"
    >
      <option value="">{isParent ? "Principal" : "Sacar a principal"}</option>
      {parents
        .filter((p) => p.id !== id)
        .map((p) => (
          <option key={p.id} value={p.id}>
            ↳ {p.name}
          </option>
        ))}
    </select>
  );
}
