"use client";

import { useState, useTransition } from "react";

import type { CodeCard } from "@/lib/schema";
import { createCard, updateCard } from "@/app/(app)/codigo/actions";

const inputCls =
  "w-full rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy placeholder:text-faint outline-none focus:border-brand";
const labelCls = "mb-1 block text-xs font-medium uppercase tracking-wide text-faint";

export function CardForm({
  card,
  projects,
  onDone,
}: {
  card?: CodeCard;
  projects: string[];
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(card);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = editing ? await updateCard(formData) : await createCard(formData);
      if (res?.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {editing ? <input type="hidden" name="id" value={card!.id} /> : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Proyecto</label>
          <input
            name="project"
            list="kb-projects"
            defaultValue={card?.project ?? ""}
            placeholder="finanzas"
            className={inputCls}
            required
          />
          <datalist id="kb-projects">
            {projects.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Prioridad</label>
          <select name="priority" defaultValue={card?.priority ?? "med"} className={inputCls}>
            <option value="low">Baja</option>
            <option value="med">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Título</label>
        <input
          name="title"
          defaultValue={card?.title ?? ""}
          placeholder="Qué hay que hacer"
          className={inputCls}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Estado</label>
          <select name="status" defaultValue={card?.status ?? "backlog"} className={inputCls}>
            <option value="backlog">Backlog</option>
            <option value="in_progress">En curso</option>
            <option value="blocked">Bloqueado</option>
            <option value="done">Hecho</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Etiquetas (coma)</label>
          <input
            name="labels"
            defaultValue={(card?.labels ?? []).join(", ")}
            placeholder="bug, ui"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Spec / PRD</label>
        <textarea
          name="spec"
          defaultValue={card?.spec ?? ""}
          rows={6}
          placeholder="Objetivo, alcance, criterios de aceptación…"
          className={inputCls + " resize-y font-mono text-[13px] leading-relaxed"}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Repo</label>
          <input name="repo" defaultValue={card?.repo ?? ""} placeholder="Oscarm157/…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Rama</label>
          <input name="branch" defaultValue={card?.branch ?? ""} placeholder="main" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>PR</label>
          <input name="prUrl" defaultValue={card?.prUrl ?? ""} placeholder="https://…" className={inputCls} />
        </div>
      </div>

      {error ? <p className="text-sm text-alert">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-navy"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? "Guardando…" : editing ? "Guardar" : "Crear card"}
        </button>
      </div>
    </form>
  );
}
