"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { personalTasks, personalSubtasks } from "@/lib/schema";
import { parseLabels } from "@/lib/personal-tasks/labels";

const STATUSES = ["todo", "doing", "done"] as const;
const uuid = z.string().uuid();

const labelsSchema = z
  .string()
  .optional()
  .transform((v) => parseLabels(v ?? ""));

const createSchema = z.object({
  title: z.string().trim().min(1, "Escribe algo.").max(200),
  status: z.enum(STATUSES).default("todo"),
  notes: z.string().trim().max(2000).optional(),
  dueDate: z
    .union([z.literal(""), z.string().date()])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  priority: z.coerce.number().int().min(0).max(2).optional(),
  labels: labelsSchema,
});

export async function createTask(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await db.insert(personalTasks).values({
    ownerId: me.id,
    title: parsed.data.title,
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
    dueDate: parsed.data.dueDate ?? null,
    priority: parsed.data.priority ?? 0,
    labels: parsed.data.labels,
  });
  revalidatePath("/pendientes");
}

const updateSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  priority: z.coerce.number().int().min(0).max(2).optional(),
  dueDate: z.string().date().nullable().optional(),
  labels: z.array(z.string().trim().toLowerCase().min(1).max(24)).max(8).optional(),
});

export async function updateTask(input: {
  id: string;
  title?: string;
  notes?: string;
  priority?: number;
  dueDate?: string | null;
  labels?: string[];
}): Promise<void> {
  const me = await requireUser();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return;
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return;

  await db
    .update(personalTasks)
    .set({ ...fields, updatedAt: new Date() })
    .where(and(eq(personalTasks.id, id), eq(personalTasks.ownerId, me.id)));
  revalidatePath("/pendientes");
}

const moveSchema = z.object({
  id: uuid,
  status: z.enum(STATUSES),
  position: z.coerce.number().int().min(0).max(10000),
});

export async function moveTask(
  id: string,
  status: string,
  position: number,
): Promise<void> {
  const me = await requireUser();
  const parsed = moveSchema.safeParse({ id, status, position });
  if (!parsed.success) return;
  await db
    .update(personalTasks)
    .set({ status: parsed.data.status, position: parsed.data.position, updatedAt: new Date() })
    .where(and(eq(personalTasks.id, parsed.data.id), eq(personalTasks.ownerId, me.id)));
  revalidatePath("/pendientes");
}

export async function deleteTask(id: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  await db
    .delete(personalTasks)
    .where(and(eq(personalTasks.id, id), eq(personalTasks.ownerId, me.id)));
  revalidatePath("/pendientes");
}

const focusSchema = z.object({
  taskId: uuid,
  seconds: z.number().int().positive().max(14400),
});

export async function logFocusSession(
  taskId: string,
  seconds: number,
): Promise<void> {
  const me = await requireUser();
  const parsed = focusSchema.safeParse({ taskId, seconds });
  if (!parsed.success) return;

  // Verificar que la tarea es del usuario antes de acumularle tiempo.
  const [task] = await db
    .select({ id: personalTasks.id })
    .from(personalTasks)
    .where(and(eq(personalTasks.id, parsed.data.taskId), eq(personalTasks.ownerId, me.id)));
  if (!task) return;

  await db
    .update(personalTasks)
    .set({
      focusSeconds: sql`${personalTasks.focusSeconds} + ${parsed.data.seconds}`,
      updatedAt: new Date(),
    })
    .where(and(eq(personalTasks.id, parsed.data.taskId), eq(personalTasks.ownerId, me.id)));
  revalidatePath("/pendientes");
}

// ---- Subtareas ----

export async function addSubtask(
  taskId: string,
  title: string,
): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(taskId).success) return;
  const clean = title.trim().slice(0, 200);
  if (!clean) return;

  // La subtarea hereda al owner de la tarea padre, verificada contra la DB.
  const [task] = await db
    .select({ id: personalTasks.id })
    .from(personalTasks)
    .where(and(eq(personalTasks.id, taskId), eq(personalTasks.ownerId, me.id)));
  if (!task) return;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(personalSubtasks)
    .where(eq(personalSubtasks.taskId, taskId));

  await db.insert(personalSubtasks).values({
    ownerId: me.id,
    taskId,
    title: clean,
    position: count ?? 0,
  });
  revalidatePath("/pendientes");
}

export async function toggleSubtask(id: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  const [sub] = await db
    .select({ id: personalSubtasks.id, done: personalSubtasks.done })
    .from(personalSubtasks)
    .where(and(eq(personalSubtasks.id, id), eq(personalSubtasks.ownerId, me.id)));
  if (!sub) return;
  await db
    .update(personalSubtasks)
    .set({ done: !sub.done })
    .where(and(eq(personalSubtasks.id, id), eq(personalSubtasks.ownerId, me.id)));
  revalidatePath("/pendientes");
}

export async function deleteSubtask(id: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  await db
    .delete(personalSubtasks)
    .where(and(eq(personalSubtasks.id, id), eq(personalSubtasks.ownerId, me.id)));
  revalidatePath("/pendientes");
}
