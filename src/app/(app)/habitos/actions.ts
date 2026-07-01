"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { habits, habitEntries, habitAchievements } from "@/lib/schema";
import { computeStreak } from "@/lib/habits/data";

const uuid = z.string().uuid();

const COLORS = [
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
] as const;

const habitSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(80),
  icon: z.string().trim().min(1).max(40).default("check"),
  color: z.enum(COLORS).default("#34d399"),
  frequency: z.enum(["daily", "weekly", "custom"]).default("daily"),
  targetPerWeek: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(7)])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  targetPerDay: z.coerce.number().int().min(1).max(100).default(1),
  gracePerWeek: z.coerce.number().int().min(0).max(7).default(1),
  weekdays: z
    .string()
    .optional()
    .transform((v) => {
      try {
        return v ? (JSON.parse(v) as number[]) : null;
      } catch {
        return null;
      }
    }),
});

export async function createHabit(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const parsed = habitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;
  await db.insert(habits).values({
    ownerId: me.id,
    name: d.name,
    icon: d.icon,
    color: d.color,
    frequency: d.frequency,
    targetPerWeek: d.targetPerWeek ?? null,
    targetPerDay: d.targetPerDay,
    gracePerWeek: d.gracePerWeek,
    weekdays: d.weekdays ?? null,
  });
  revalidatePath("/habitos");
}

export async function updateHabit(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const id = formData.get("id");
  if (!uuid.safeParse(id).success) return { error: "Hábito inválido." };
  const [existing] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, String(id)), eq(habits.ownerId, me.id)));
  if (!existing) return { error: "Hábito no encontrado." };
  const parsed = habitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;
  await db
    .update(habits)
    .set({
      name: d.name,
      icon: d.icon,
      color: d.color,
      frequency: d.frequency,
      targetPerWeek: d.targetPerWeek ?? null,
      targetPerDay: d.targetPerDay,
      gracePerWeek: d.gracePerWeek,
      weekdays: d.weekdays ?? null,
    })
    .where(and(eq(habits.id, String(id)), eq(habits.ownerId, me.id)));
  revalidatePath("/habitos");
  revalidatePath(`/habitos/${id}`);
  revalidatePath("/");
}

export async function archiveHabit(id: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  await db
    .update(habits)
    .set({ archived: true })
    .where(and(eq(habits.id, id), eq(habits.ownerId, me.id)));
  revalidatePath("/habitos");
  revalidatePath("/");
  revalidatePath(`/habitos/${id}`);
}

export async function toggleEntry(habitId: string, date: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(habitId).success) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const [h] = await db
    .select({ id: habits.id, targetPerDay: habits.targetPerDay })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.ownerId, me.id)));
  if (!h) return;
  const [existing] = await db
    .select({ id: habitEntries.id, count: habitEntries.count })
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.habitId, habitId),
        eq(habitEntries.date, date),
        eq(habitEntries.ownerId, me.id),
      ),
    );
  if (existing) {
    await db
      .delete(habitEntries)
      .where(and(eq(habitEntries.id, existing.id), eq(habitEntries.ownerId, me.id)));
  } else {
    await db
      .insert(habitEntries)
      .values({ ownerId: me.id, habitId, date, count: 1 });
    await evaluateAchievements(me.id, habitId);
  }
  revalidatePath("/habitos");
}

export async function incrementEntry(habitId: string, date: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(habitId).success) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const [h] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.ownerId, me.id)));
  if (!h) return;
  const [existing] = await db
    .select({ id: habitEntries.id, count: habitEntries.count })
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.habitId, habitId),
        eq(habitEntries.date, date),
        eq(habitEntries.ownerId, me.id),
      ),
    );
  if (existing) {
    await db
      .update(habitEntries)
      .set({ count: existing.count + 1 })
      .where(and(eq(habitEntries.id, existing.id), eq(habitEntries.ownerId, me.id)));
  } else {
    await db
      .insert(habitEntries)
      .values({ ownerId: me.id, habitId, date, count: 1 });
  }
  await evaluateAchievements(me.id, habitId);
  revalidatePath("/habitos");
}

// Logros globales por usuario (habitId null). Idempotente por el unique (ownerId, key).
async function evaluateAchievements(ownerId: string, habitId: string) {
  await db
    .insert(habitAchievements)
    .values({ ownerId, habitId: null, key: "first_habit" })
    .onConflictDoNothing();

  const entries = await db
    .select({ date: habitEntries.date, count: habitEntries.count })
    .from(habitEntries)
    .where(and(eq(habitEntries.habitId, habitId), eq(habitEntries.ownerId, ownerId)))
    .orderBy(habitEntries.date);

  const [hRow] = await db.select().from(habits).where(eq(habits.id, habitId));
  if (!hRow) return;

  const { current } = computeStreak(entries, hRow);

  if (current >= 7) {
    await db
      .insert(habitAchievements)
      .values({ ownerId, habitId: null, key: "streak_7" })
      .onConflictDoNothing();
  }
  if (current >= 30) {
    await db
      .insert(habitAchievements)
      .values({ ownerId, habitId: null, key: "streak_30" })
      .onConflictDoNothing();
  }
}
