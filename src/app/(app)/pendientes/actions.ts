"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { personalTasks } from "@/lib/schema";

const STATUSES = ["todo", "doing", "done"] as const;
const uuid = z.string().uuid();

const createSchema = z.object({
  title: z.string().trim().min(1, "Escribe algo.").max(200),
  status: z.enum(STATUSES).default("todo"),
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
  });
  revalidatePath("/pendientes");
}

const updateSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  priority: z.coerce.number().int().min(0).max(2).optional(),
  dueDate: z.string().date().nullable().optional(),
});

export async function updateTask(input: {
  id: string;
  title?: string;
  notes?: string;
  priority?: number;
  dueDate?: string | null;
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
