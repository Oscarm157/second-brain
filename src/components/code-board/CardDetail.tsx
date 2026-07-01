"use client";

import { useState, useTransition } from "react";
import { GitBranch, Link2, Pencil, Trash2 } from "lucide-react";

import type { CodeCard, CodeCardNote } from "@/lib/schema";
import { addNote, deleteCard } from "@/app/(app)/codigo/actions";
import { CardForm } from "./CardForm";

const PRIORITY_LABEL: Record<string, string> = { low: "Baja", med: "Media", high: "Alta" };

function fmt(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CardDetail({
  detail,
  projects,
  onRefresh,
  onClose,
}: {
  detail: { card: CodeCard; notes: CodeCardNote[] };
  projects: string[];
  onRefresh: () => void;
  onClose: () => void;
}) {
  const { card, notes } = detail;
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submitNote() {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addNote(card.id, body);
      if (!res?.error) {
        setBody("");
        onRefresh();
      }
    });
  }

  function onDelete() {
    if (!confirm("¿Borrar esta card y sus notas?")) return;
    startTransition(async () => {
      await deleteCard(card.id);
      onClose();
    });
  }

  if (editing) {
    return (
      <CardForm
        card={card}
        projects={projects}
        onDone={() => {
          setEditing(false);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-[var(--h-surface-2)] px-2 py-0.5 font-medium text-[var(--h-text-secondary)]">
          {card.project}
        </span>
        <span className="text-[var(--h-text-faint)]">·</span>
        <span className="text-[var(--h-text-secondary)]">
          Prioridad {PRIORITY_LABEL[card.priority] ?? card.priority}
        </span>
        {card.labels?.map((l) => (
          <span key={l} className="rounded-md border border-[var(--h-border)] px-2 py-0.5 text-[var(--h-text-secondary)]">
            {l}
          </span>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--h-text-secondary)] hover:bg-[var(--h-surface-2)] hover:text-[var(--h-text)]"
          >
            <Pencil className="size-3.5" /> Editar
          </button>
          <button
            onClick={onDelete}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--h-text-secondary)] hover:bg-[var(--h-surface-2)] hover:text-alert"
          >
            <Trash2 className="size-3.5" /> Borrar
          </button>
        </div>
      </div>

      {(card.repo || card.prUrl) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {card.repo ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--h-text-secondary)]">
              <GitBranch className="size-4" />
              {card.repo}
              {card.branch ? <span className="text-[var(--h-text-faint)]">@{card.branch}</span> : null}
            </span>
          ) : null}
          {card.prUrl ? (
            <a
              href={card.prUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline"
            >
              <Link2 className="size-4" /> Ver PR
            </a>
          ) : null}
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--h-text-faint)]">
          Spec
        </h4>
        {card.spec ? (
          <pre className="whitespace-pre-wrap rounded-xl border border-[var(--h-border)] bg-[var(--h-surface)] p-4 font-mono text-[13px] leading-relaxed text-[var(--h-text)]">
            {card.spec}
          </pre>
        ) : (
          <p className="text-sm text-[var(--h-text-faint)]">Sin spec todavía.</p>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--h-text-faint)]">
          Notas y preguntas ({notes.length})
        </h4>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-[var(--h-text-faint)]">
              Sin notas. Aquí Claude deja dudas y tú respondes.
            </p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-[var(--h-border)] bg-[var(--h-surface)] p-3"
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span
                    className="rounded px-1.5 py-0.5 font-semibold"
                    style={
                      n.author === "claude"
                        ? { background: "rgba(96,165,250,0.15)", color: "var(--primary)" }
                        : { background: "rgba(52,211,153,0.15)", color: "var(--income)" }
                    }
                  >
                    {n.author === "claude" ? "Claude" : "Oscar"}
                  </span>
                  <span className="text-[var(--h-text-faint)]">{fmt(n.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[var(--h-text)]">{n.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Responder o anotar algo…"
            className="w-full rounded-lg border border-[var(--h-border)] bg-[var(--h-surface)] px-3 py-2 text-sm text-[var(--h-text)] placeholder:text-[var(--h-text-faint)] outline-none focus:border-[var(--h-blue)]"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submitNote}
              disabled={pending || !body.trim()}
              className="rounded-lg bg-[var(--h-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--h-text)] disabled:opacity-50"
            >
              Agregar nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
