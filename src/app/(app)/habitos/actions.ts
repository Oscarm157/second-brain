"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { habits, habitEntries, habitAchievements } from "@/lib/schema";
import { computeStreak, toDateStr } from "@/lib/habits/data";
import { HABIT_ICON_KEYS } from "@/lib/habits/icon-keys";

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
  icon: z.enum(HABIT_ICON_KEYS).default("sparkles"),
  color: z.enum(COLORS).default("#34d399"),
  frequency: z.enum(["daily", "weekly", "custom"]).default("daily"),
  targetPerWeek: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(7)])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  targetPerDay: z.coerce.number().int().min(1).max(100).default(1),
  gracePerWeek: z.coerce.number().int().min(0).max(7).default(1),
  goalPeriod: z
    .union([z.literal(""), z.enum(["week", "month", "year"])])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  goalTarget: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(10000)])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  weekdays: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return null;
      try {
        const parsed = z.array(z.number().int().min(0).max(6)).safeParse(JSON.parse(v));
        return parsed.success ? parsed.data : null;
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
    goalPeriod: d.goalPeriod ?? null,
    goalTarget: d.goalTarget ?? null,
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
      goalPeriod: d.goalPeriod ?? null,
      goalTarget: d.goalTarget ?? null,
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

export async function unarchiveHabit(id: string): Promise<void> {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  await db
    .update(habits)
    .set({ archived: false })
    .where(and(eq(habits.id, id), eq(habits.ownerId, me.id)));
  revalidatePath("/habitos");
  revalidatePath("/");
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
  revalidatePath("/");
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
  revalidatePath("/");
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

  const streakTiers: Array<[number, string]> = [
    [7, "streak_7"],
    [14, "streak_14"],
    [30, "streak_30"],
    [100, "streak_100"],
  ];
  for (const [days, key] of streakTiers) {
    if (current >= days) {
      await db
        .insert(habitAchievements)
        .values({ ownerId, habitId: null, key })
        .onConflictDoNothing();
    }
  }

  // Centenario: 100 completados reales (suma de count) en total.
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${habitEntries.count}), 0)::int` })
    .from(habitEntries)
    .where(eq(habitEntries.ownerId, ownerId));
  if ((total ?? 0) >= 100) {
    await db
      .insert(habitAchievements)
      .values({ ownerId, habitId: null, key: "century" })
      .onConflictDoNothing();
  }

  // Semana perfecta: los últimos 7 días, cada hábito activo cumplió su meta en cada día debido.
  if (await isPerfectWeek(ownerId)) {
    await db
      .insert(habitAchievements)
      .values({ ownerId, habitId: null, key: "perfect_week" })
      .onConflictDoNothing();
  }
}

/** True si en los últimos 7 días cada hábito activo cumplió su meta en todos sus días debidos.
 *  Ignora días previos a la creación de cada hábito (si no, uno recién creado nunca lo logra). */
async function isPerfectWeek(ownerId: string): Promise<boolean> {
  const active = await db
    .select()
    .from(habits)
    .where(and(eq(habits.ownerId, ownerId), eq(habits.archived, false)));
  if (active.length === 0) return false;

  const today = new Date();
  const window: { str: string; weekday: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    window.push({ str: toDateStr(d), weekday: d.getDay() });
  }
  const oldest = window[window.length - 1].str;

  const entries = await db
    .select({ habitId: habitEntries.habitId, date: habitEntries.date, count: habitEntries.count })
    .from(habitEntries)
    .where(and(eq(habitEntries.ownerId, ownerId), gte(habitEntries.date, oldest)));
  const counts = new Map(entries.map((e) => [`${e.habitId}:${e.date}`, e.count]));

  for (const h of active) {
    const createdStr = h.createdAt ? toDateStr(h.createdAt) : null;
    for (const day of window) {
      if (createdStr && day.str < createdStr) continue; // antes de existir el hábito
      const due =
        h.frequency === "daily" ||
        ((h.frequency === "weekly" || h.frequency === "custom") &&
          (h.weekdays ?? []).includes(day.weekday));
      if (!due) continue;
      const count = counts.get(`${h.id}:${day.str}`) ?? 0;
      if (count < h.targetPerDay) return false;
    }
  }
  return true;
}
