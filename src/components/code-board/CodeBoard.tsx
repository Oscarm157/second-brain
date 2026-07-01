"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import type { CodeCard, CodeCardNote } from "@/lib/schema";
import { Kanban, type KanbanColumnDef } from "@/components/kanban/Kanban";
import { moveCard, fetchCardDetail } from "@/app/(app)/codigo/actions";
import { Drawer } from "./Drawer";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";

const COLUMNS: KanbanColumnDef[] = [
  { id: "backlog", label: "Backlog", accent: "#6f6d82" },
  { id: "in_progress", label: "En curso", accent: "#60a5fa" },
  { id: "blocked", label: "Bloqueado", accent: "#fb923c" },
  { id: "done", label: "Hecho", accent: "#34d399" },
];

const PRIORITY_DOT: Record<string, string> = {
  high: "#f87171",
  med: "#fbbf24",
  low: "#6f6d82",
};

type Detail = { card: CodeCard; notes: CodeCardNote[] };

export function CodeBoard({
  cards,
  projects,
}: {
  cards: CodeCard[];
  projects: string[];
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const visible = filter ? cards.filter((c) => c.project === filter) : cards;

  function openCard(card: CodeCard) {
    fetchCardDetail(card.id).then((d) => {
      if (d) setDetail(d);
    });
  }

  function refreshDetail() {
    if (!detail) return;
    fetchCardDetail(detail.card.id).then((d) => setDetail(d));
  }

  function onMove(id: string, toColumn: string, toIndex: number) {
    startTransition(() => {
      void moveCard(id, toColumn, toIndex);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === null} onClick={() => setFilter(null)} label="Todos" />
        {projects.map((p) => (
          <FilterChip key={p} active={filter === p} onClick={() => setFilter(p)} label={p} />
        ))}
        <button
          onClick={() => setCreating(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[var(--h-blue)] px-3 py-1.5 text-sm font-semibold text-[var(--h-on-accent)]"
        >
          <Plus className="size-4" /> Nueva card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--h-border)] py-16 text-center">
          <p className="text-[var(--h-text-secondary)]">Sin cards todavía.</p>
          <p className="mt-1 text-sm text-[var(--h-text-faint)]">
            Crea la primera o agrégala desde la terminal con <code className="text-[var(--h-text-secondary)]">npm run kanban -- add</code>.
          </p>
        </div>
      ) : (
        <Kanban
          columns={COLUMNS}
          items={visible}
          columnOf={(c) => c.status}
          onMove={onMove}
          onCardClick={openCard}
          renderCard={(c) => (
            <article className="cursor-pointer rounded-xl border border-[var(--h-border)] bg-[var(--h-surface)] p-3 transition-colors hover:border-[var(--h-surface-2)]">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: PRIORITY_DOT[c.priority] ?? "#6f6d82" }}
                />
                <p className="text-sm font-medium leading-snug text-[var(--h-text)]">{c.title}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-4">
                {filter === null ? (
                  <span className="rounded bg-[var(--h-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--h-text-secondary)]">
                    {c.project}
                  </span>
                ) : null}
                {c.labels?.slice(0, 3).map((l) => (
                  <span key={l} className="text-[11px] text-[var(--h-text-faint)]">
                    #{l}
                  </span>
                ))}
              </div>
            </article>
          )}
        />
      )}

      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={
          detail ? (
            <h3 className="text-lg font-semibold leading-tight text-[var(--h-text)]">
              {detail.card.title}
            </h3>
          ) : null
        }
      >
        {detail ? (
          <CardDetail
            detail={detail}
            projects={projects}
            onRefresh={refreshDetail}
            onClose={() => setDetail(null)}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title={<h3 className="text-lg font-semibold text-[var(--h-text)]">Nueva card</h3>}
      >
        <CardForm projects={projects} onDone={() => setCreating(false)} />
      </Drawer>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-[var(--h-surface-2)] text-[var(--h-text)]"
          : "text-[var(--h-text-secondary)] hover:bg-[var(--h-surface)] hover:text-[var(--h-text)]")
      }
    >
      {label}
    </button>
  );
}
