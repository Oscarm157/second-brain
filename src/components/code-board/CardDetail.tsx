"use client";

import { useState, useTransition } from "react";
import { GitBranch, Link2, Pencil, Trash2 } from "lucide-react";

import type { CodeCard, CodeCardNote, CodeCardStatus } from "@/lib/schema";
import { addNote, deleteCard, logFocusSession, moveCard } from "@/app/(app)/codigo/actions";
import { CardForm } from "./CardForm";
import { SpecView } from "./SpecView";
import { FocusTimer } from "@/components/ui/FocusTimer";
import { CODE_COLUMNS } from "@/lib/code-board/columns";

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
  statusCounts,
  userName,
}: {
  detail: { card: CodeCard; notes: CodeCardNote[] };
  projects: string[];
  onRefresh: () => void;
  onClose: () => void;
  /** Nº de cards por estado, para mandar la card al final de la columna destino al mover sin drag. */
  statusCounts: Record<CodeCardStatus, number>;
  /** Nombre del usuario de sesión: etiqueta las notas humanas con su nombre real. */
  userName: string;
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
        <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-ink">
          {card.project}
        </span>
        <span className="text-faint">·</span>
        <span className="text-ink">
          Prioridad {PRIORITY_LABEL[card.priority] ?? card.priority}
        </span>
        {card.labels?.map((l) => (
          <span key={l} className="rounded-md border border-line px-2 py-0.5 text-ink">
            {l}
          </span>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-ink hover:bg-secondary hover:text-navy"
          >
            <Pencil className="size-3.5" /> Editar
          </button>
          <button
            onClick={onDelete}
            disabled={pending}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-ink hover:bg-secondary hover:text-alert"
          >
            <Trash2 className="size-3.5" /> Borrar
          </button>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
          Estado
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CODE_COLUMNS.map((s) => {
            const active = card.status === s.id;
            return (
              <button
                key={s.id}
                onClick={() =>
                  active
                    ? undefined
                    : startTransition(async () => {
                        await moveCard(card.id, s.id, statusCounts[s.id]);
                        onRefresh();
                      })
                }
                className={
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors " +
                  (active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line text-ink hover:bg-secondary hover:text-navy")
                }
                aria-pressed={active}
              >
                <span className="size-2 rounded-full" style={{ background: s.accent }} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <FocusTimer
        storageKey={`focus:card:${card.id}`}
        focusSeconds={card.focusSeconds}
        onLog={async (s) => {
          await logFocusSession(card.id, s);
          onRefresh();
        }}
      />

      {(card.repo || card.prUrl) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {card.repo ? (
            <span className="inline-flex items-center gap-1.5 text-ink">
              <GitBranch className="size-4" />
              {card.repo}
              {card.branch ? <span className="text-faint">@{card.branch}</span> : null}
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
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
          Spec
        </h4>
        {card.spec ? (
          <SpecView spec={card.spec} />
        ) : (
          <p className="text-sm text-faint">Sin spec todavía.</p>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
          Notas y preguntas ({notes.length})
        </h4>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-faint">
              Sin notas. Aquí Claude deja dudas y tú respondes.
            </p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border border-line bg-secondary p-3"
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
                    {n.author === "claude" ? "Claude" : userName}
                  </span>
                  <span className="text-faint">{fmt(n.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-navy">{n.body}</p>
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
            className="w-full rounded-md border border-line bg-secondary px-3 py-2 text-sm text-navy placeholder:text-faint outline-none focus:border-brand"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submitNote}
              disabled={pending || !body.trim()}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50"
            >
              Agregar nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
