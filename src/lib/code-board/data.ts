import { and, asc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  codeCards,
  codeCardNotes,
  type CodeCard,
  type CodeCardNote,
} from "@/lib/schema";

export async function listCards(
  ownerId: string,
  opts: { project?: string } = {},
): Promise<CodeCard[]> {
  const where = opts.project
    ? and(eq(codeCards.ownerId, ownerId), eq(codeCards.project, opts.project))
    : eq(codeCards.ownerId, ownerId);
  return db
    .select()
    .from(codeCards)
    .where(where)
    .orderBy(asc(codeCards.position), asc(codeCards.createdAt));
}

export async function getCard(
  ownerId: string,
  id: string,
): Promise<{ card: CodeCard; notes: CodeCardNote[] } | null> {
  const [card] = await db
    .select()
    .from(codeCards)
    .where(and(eq(codeCards.id, id), eq(codeCards.ownerId, ownerId)));
  if (!card) return null;
  const notes = await db
    .select()
    .from(codeCardNotes)
    .where(eq(codeCardNotes.cardId, id))
    .orderBy(asc(codeCardNotes.createdAt));
  return { card, notes };
}

/** Proyectos con al menos una card, para el filtro. */
export async function listProjects(ownerId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ project: codeCards.project })
    .from(codeCards)
    .where(eq(codeCards.ownerId, ownerId))
    .orderBy(asc(codeCards.project));
  return rows.map((r) => r.project);
}

export type CodePeekItem = {
  id: string;
  title: string;
  project: string;
  status: "backlog" | "in_progress" | "blocked" | "done";
  priority: "low" | "med" | "high";
  position: number;
};

// Bloqueadas y en curso primero, luego backlog: es lo que hay que atender.
const STATUS_WEIGHT: Record<string, number> = { blocked: 0, in_progress: 1, backlog: 2, done: 3 };

/** Resumen para el hub: contadores + las primeras cards para actuar. */
export async function getCodeSnapshot(ownerId: string): Promise<{
  inProgress: number;
  blocked: number;
  open: number;
  items: CodePeekItem[];
}> {
  const [row] = await db
    .select({
      inProgress: sql<number>`count(*) filter (where ${codeCards.status} = 'in_progress')::int`,
      blocked: sql<number>`count(*) filter (where ${codeCards.status} = 'blocked')::int`,
      open: sql<number>`count(*) filter (where ${codeCards.status} <> 'done')::int`,
    })
    .from(codeCards)
    .where(eq(codeCards.ownerId, ownerId));

  const rows = await db
    .select({
      id: codeCards.id,
      title: codeCards.title,
      project: codeCards.project,
      status: codeCards.status,
      priority: codeCards.priority,
      position: codeCards.position,
    })
    .from(codeCards)
    .where(and(eq(codeCards.ownerId, ownerId), ne(codeCards.status, "done")))
    .orderBy(asc(codeCards.position), asc(codeCards.createdAt));

  const items = rows
    .sort((a, b) => (STATUS_WEIGHT[a.status] ?? 9) - (STATUS_WEIGHT[b.status] ?? 9))
    .slice(0, 6);

  return {
    inProgress: row?.inProgress ?? 0,
    blocked: row?.blocked ?? 0,
    open: row?.open ?? 0,
    items,
  };
}
