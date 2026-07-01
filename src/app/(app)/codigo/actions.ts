"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCard } from "@/lib/code-board/data";
import {
  codeCards,
  codeCardNotes,
  type CodeCard,
  type CodeCardNote,
} from "@/lib/schema";

const STATUSES = ["backlog", "in_progress", "blocked", "done"] as const;
const PRIORITIES = ["low", "med", "high"] as const;

const uuid = z.string().uuid();

const cardSchema = z.object({
  project: z.string().trim().min(1, "El proyecto es requerido.").max(60),
  title: z.string().trim().min(1, "El título es requerido.").max(160),
  spec: z.string().trim().max(8000).optional().or(z.literal("")),
  status: z.enum(STATUSES).default("backlog"),
  priority: z.enum(PRIORITIES).default("med"),
  labels: z.string().trim().max(200).optional().or(z.literal("")),
  repo: z.string().trim().max(200).optional().or(z.literal("")),
  branch: z.string().trim().max(160).optional().or(z.literal("")),
  prUrl: z.string().trim().max(400).optional().or(z.literal("")),
});

function parseLabels(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function createCard(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const parsed = cardSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;

  await db.insert(codeCards).values({
    ownerId: me.id,
    project: d.project,
    title: d.title,
    spec: d.spec || null,
    status: d.status,
    priority: d.priority,
    labels: parseLabels(d.labels),
    repo: d.repo || null,
    branch: d.branch || null,
    prUrl: d.prUrl || null,
  });
  revalidatePath("/codigo");
}

export async function updateCard(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return { error: "Card inválida." };

  const [existing] = await db
    .select({ id: codeCards.id })
    .from(codeCards)
    .where(and(eq(codeCards.id, id), eq(codeCards.ownerId, me.id)));
  if (!existing) return { error: "Card no encontrada." };

  const parsed = cardSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;

  await db
    .update(codeCards)
    .set({
      project: d.project,
      title: d.title,
      spec: d.spec || null,
      status: d.status,
      priority: d.priority,
      labels: parseLabels(d.labels),
      repo: d.repo || null,
      branch: d.branch || null,
      prUrl: d.prUrl || null,
      updatedAt: new Date(),
    })
    .where(and(eq(codeCards.id, id), eq(codeCards.ownerId, me.id)));
  revalidatePath("/codigo");
}

const moveSchema = z.object({
  id: uuid,
  status: z.enum(STATUSES),
  position: z.coerce.number().int().min(0).max(10000),
});

export async function moveCard(
  id: string,
  status: string,
  position: number,
): Promise<void> {
  const me = await requireUser();
  const parsed = moveSchema.safeParse({ id, status, position });
  if (!parsed.success) return;

  await db
    .update(codeCards)
    .set({ status: parsed.data.status, position: parsed.data.position, updatedAt: new Date() })
    .where(and(eq(codeCards.id, parsed.data.id), eq(codeCards.ownerId, me.id)));
  revalidatePath("/codigo");
}

export async function deleteCard(id: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  await db
    .delete(codeCards)
    .where(and(eq(codeCards.id, id), eq(codeCards.ownerId, me.id)));
  revalidatePath("/codigo");
}

const noteSchema = z.object({
  cardId: uuid,
  body: z.string().trim().min(1, "La nota está vacía.").max(4000),
});

export async function addNote(
  cardId: string,
  body: string,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const parsed = noteSchema.safeParse({ cardId, body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nota inválida." };

  // Verificar que la card es del usuario antes de colgarle una nota.
  const [card] = await db
    .select({ id: codeCards.id })
    .from(codeCards)
    .where(and(eq(codeCards.id, parsed.data.cardId), eq(codeCards.ownerId, me.id)));
  if (!card) return { error: "Card no encontrada." };

  await db.insert(codeCardNotes).values({
    ownerId: me.id,
    cardId: parsed.data.cardId,
    author: "oscar",
    body: parsed.data.body,
  });
  revalidatePath("/codigo");
}

const focusSchema = z.object({
  cardId: uuid,
  seconds: z.number().int().positive().max(14400),
});

export async function logFocusSession(
  cardId: string,
  seconds: number,
): Promise<void> {
  const me = await requireUser();
  const parsed = focusSchema.safeParse({ cardId, seconds });
  if (!parsed.success) return;

  // Verificar que la card es del usuario antes de acumularle tiempo.
  const [card] = await db
    .select({ id: codeCards.id })
    .from(codeCards)
    .where(and(eq(codeCards.id, parsed.data.cardId), eq(codeCards.ownerId, me.id)));
  if (!card) return;

  await db
    .update(codeCards)
    .set({
      focusSeconds: sql`${codeCards.focusSeconds} + ${parsed.data.seconds}`,
      updatedAt: new Date(),
    })
    .where(and(eq(codeCards.id, parsed.data.cardId), eq(codeCards.ownerId, me.id)));
  revalidatePath("/codigo");
}

export async function fetchCardDetail(
  id: string,
): Promise<{ card: CodeCard; notes: CodeCardNote[] } | null> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return null;
  return getCard(me.id, id);
}
