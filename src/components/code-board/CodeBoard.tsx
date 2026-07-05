"use client";

import { useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";

import type { CodeCard, CodeCardNote } from "@/lib/schema";
import { Kanban } from "@/components/kanban/Kanban";
import { moveCard, fetchCardDetail } from "@/app/(app)/codigo/actions";
import { Drawer } from "./Drawer";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
import { CODE_COLUMNS } from "@/lib/code-board/columns";

const COLUMNS = CODE_COLUMNS;

const PRIORITY_DOT: Record<string, string> = {
  high: "#f87171",
  med: "#fbbf24",
  low: "#6f6d82",
};

type Detail = { card: CodeCard; notes: CodeCardNote[] };

export function CodeBoard({
  cards,
  projects,
  userName,
}: {
  cards: CodeCard[];
  projects: string[];
  userName: string;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const q = query.trim().toLowerCase();
  const visible = cards.filter((c) => {
    if (filter && c.project !== filter) return false;
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.spec ?? "").toLowerCase().includes(q) ||
      (c.labels ?? []).some((l) => l.toLowerCase().includes(q))
    );
  });

  const statusCounts = { backlog: 0, in_progress: 0, blocked: 0, done: 0 };
  for (const c of cards) statusCounts[c.status] += 1;

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
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar card"
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-3 text-sm text-navy placeholder:text-faint outline-none focus:border-brand"
          />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="size-4" /> Nueva card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-ink">Sin cards todavía.</p>
          <p className="mt-1 text-sm text-faint">
            Crea la primera o agrégala desde la terminal con <code className="text-ink">npm run kanban -- add</code>.
          </p>
        </div>
      ) : (
        <Kanban
          columns={COLUMNS}
          items={visible}
          columnOf={(c) => c.status}
          onMove={onMove}
          onCardClick={openCard}
          disableDnd={filter !== null || q !== ""}
          renderCard={(c) => (
            <article className="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: PRIORITY_DOT[c.priority] ?? "#6f6d82" }}
                />
                <p className="text-sm font-medium leading-snug text-navy">{c.title}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-4">
                {filter === null ? (
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-ink">
                    {c.project}
                  </span>
                ) : null}
                {c.labels?.slice(0, 3).map((l) => (
                  <span key={l} className="text-[11px] text-faint">
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
            <h3 className="text-lg font-semibold leading-tight text-navy">
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
            statusCounts={statusCounts}
            userName={userName}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title={<h3 className="text-lg font-semibold text-navy">Nueva card</h3>}
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
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-secondary text-navy"
          : "text-ink hover:bg-secondary hover:text-navy")
      }
    >
      {label}
    </button>
  );
}
