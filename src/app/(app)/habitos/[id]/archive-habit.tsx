"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { toast } from "sonner";

import { archiveHabit } from "../actions";

export function ArchiveHabitButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function onArchive() {
    if (!confirm(`Archivar "${name}"? Dejará de aparecer en tus hábitos.`)) return;
    startTransition(async () => {
      await archiveHabit(id);
      toast.success("Hábito archivado.");
      window.location.href = "/habitos";
    });
  }

  return (
    <button
      type="button"
      onClick={onArchive}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink transition-colors hover:text-alert disabled:opacity-50"
    >
      <Archive className="size-3.5" />
      Archivar
    </button>
  );
}
