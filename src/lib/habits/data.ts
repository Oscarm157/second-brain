import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { habits, habitEntries, habitAchievements } from "@/lib/schema";
import { computeLevel, XP_PER_COMPLETION } from "./xp";

export type HabitRow = {
  id: string;
  ownerId: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  targetPerWeek: number | null;
  weekdays: number[] | null;
  targetPerDay: number;
  gracePerWeek: number;
  position: number;
  archived: boolean;
  createdAt: Date | null;
};

export type GridCell = {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
};

export type StreakResult = {
  current: number;
  best: number;
};

export type TodayHabit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetPerDay: number;
  completedToday: number;
  doneToday: boolean;
};

export type GamificationData = {
  xp: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  achievements: Array<{
    key: string;
    label: string;
    desc: string;
    unlockedAt: string | null;
    unlocked: boolean;
  }>;
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns active (non-archived) habits ordered by position. */
export async function listHabits(ownerId: string) {
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.ownerId, ownerId), eq(habits.archived, false)))
    .orderBy(habits.position);
}

/** Returns a single habit or null. */
export async function getHabit(ownerId: string, id: string) {
  const [h] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, id), eq(habits.ownerId, ownerId)));
  return h ?? null;
}

function computeIntensity(
  count: number,
  targetPerDay: number,
): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count >= targetPerDay * 2) return 4;
  if (count >= targetPerDay) return 3;
  if (count >= Math.ceil(targetPerDay / 2)) return 2;
  return 1;
}

/** Returns grid cells for the last `days` days (oldest→newest), filling missing days with 0. */
export async function getHabitGrid(
  ownerId: string,
  habitId: string,
  days = 119,
): Promise<GridCell[]> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const startStr = toDateStr(start);

  const [habit] = await db
    .select({ targetPerDay: habits.targetPerDay })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.ownerId, ownerId)));
  const targetPerDay = habit?.targetPerDay ?? 1;

  const entries = await db
    .select({ date: habitEntries.date, count: habitEntries.count })
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.habitId, habitId),
        eq(habitEntries.ownerId, ownerId),
        gte(habitEntries.date, startStr),
      ),
    );

  const entryMap = new Map(entries.map((e) => [e.date, e.count]));

  const cells: GridCell[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStr(d);
    const count = entryMap.get(dateStr) ?? 0;
    cells.push({
      date: dateStr,
      count,
      intensity: computeIntensity(count, targetPerDay),
    });
  }
  return cells;
}

/** Returns habits due today with today's completion status. */
export async function getTodayHabits(ownerId: string): Promise<TodayHabit[]> {
  const todayStr = toDateStr(new Date());
  const todayWeekday = new Date().getDay(); // 0=Sun

  const allHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.ownerId, ownerId), eq(habits.archived, false)))
    .orderBy(habits.position);

  const due = allHabits.filter((h) => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "weekly" || h.frequency === "custom") {
      const days = (h.weekdays ?? []) as number[];
      return days.includes(todayWeekday);
    }
    return true;
  });

  if (due.length === 0) return [];

  const habitIds = due.map((h) => h.id);
  const todayEntries = await db
    .select({ habitId: habitEntries.habitId, count: habitEntries.count })
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.ownerId, ownerId),
        eq(habitEntries.date, todayStr),
        sql`${habitEntries.habitId} = ANY(ARRAY[${sql.join(
          habitIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}])`,
      ),
    );

  const entryMap = new Map(todayEntries.map((e) => [e.habitId, e.count]));

  return due.map((h) => {
    const completedToday = entryMap.get(h.id) ?? 0;
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      targetPerDay: h.targetPerDay,
      completedToday,
      doneToday: completedToday >= h.targetPerDay,
    };
  });
}

/** Pure function. Computes current and best streak from an array of entries.
 *  Going backward from today (inclusive). A day "counts" if count >= targetPerDay.
 *  Grace: at most gracePerWeek missed days in any rolling 7-day window keep the streak alive.
 */
export function computeStreak(
  entries: Array<{ date: string; count: number }>,
  habit: { targetPerDay: number; gracePerWeek: number; frequency: string },
): StreakResult {
  if (entries.length === 0) return { current: 0, best: 0 };

  const entryMap = new Map(entries.map((e) => [e.date, e.count]));
  const { targetPerDay, gracePerWeek } = habit;

  const today = new Date();
  const todayStr = toDateStr(today);

  // Compute current streak: go back from today. Grace per 7-day window: the streak
  // survives as long as misses within each rolling 7-day block stay within gracePerWeek.
  let current = 0;
  let missedInWindow = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const count = entryMap.get(dateStr) ?? 0;
    const completed = count >= targetPerDay;

    // Reset the miss budget every 7 days back.
    if (i > 0 && i % 7 === 0) {
      if (missedInWindow > gracePerWeek) break;
      missedInWindow = 0;
    }

    if (completed) {
      current++;
    } else {
      // Today doesn't count against the streak yet (might be completed later).
      if (dateStr === todayStr) continue;
      missedInWindow++;
      if (missedInWindow > gracePerWeek) break;
      // Within grace: don't break, but a missed day adds no streak length.
    }
  }

  // Compute best streak (simple consecutive completed days)
  const sorted = [...entries]
    .filter((e) => e.count >= targetPerDay)
    .sort((a, b) => a.date.localeCompare(b.date));

  let best = 0;
  let run = 0;
  let prevDate: string | null = null;

  for (const e of sorted) {
    if (prevDate === null) {
      run = 1;
    } else {
      const prev = new Date(prevDate);
      prev.setDate(prev.getDate() + 1);
      if (toDateStr(prev) === e.date) {
        run++;
      } else {
        run = 1;
      }
    }
    if (run > best) best = run;
    prevDate = e.date;
  }

  return { current, best };
}

export type HabitStats = {
  /** % de días completados en los últimos 7 días del rango. */
  weekPct: number;
  /** % de días completados en los últimos 30 días del rango. */
  monthPct: number;
  /** Total de días completados en todo el rango recibido. */
  totalCompleted: number;
};

/** Pure. From grid cells (oldest→newest) + target, computes completion rates.
 *  A day counts as completed when count >= targetPerDay.
 */
export function computeHabitStats(
  cells: GridCell[],
  targetPerDay: number,
  createdAt: Date | null,
): HabitStats {
  const createdStr = createdAt ? toDateStr(createdAt) : null;
  const sinceCreated = createdStr ? cells.filter((c) => c.date >= createdStr) : cells;
  const done = (c: GridCell) => c.count >= targetPerDay;
  const pct = (arr: GridCell[]) =>
    arr.length === 0 ? 0 : Math.round((arr.filter(done).length / arr.length) * 100);

  return {
    weekPct: pct(sinceCreated.slice(-7)),
    monthPct: pct(sinceCreated.slice(-30)),
    totalCompleted: cells.filter(done).length,
  };
}

const ACHIEVEMENT_DEFS = [
  { key: "first_habit", label: "Primer hábito", desc: "Completa tu primer hábito." },
  { key: "streak_7", label: "7 días", desc: "Mantén una racha de 7 días." },
  { key: "streak_30", label: "30 días", desc: "Mantén una racha de 30 días." },
  { key: "perfect_week", label: "Semana perfecta", desc: "Completa todos tus hábitos una semana." },
];

/** Returns XP, level, and achievement status for the user. */
export async function getGamification(ownerId: string): Promise<GamificationData> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(habitEntries)
    .where(eq(habitEntries.ownerId, ownerId));

  const xp = (total ?? 0) * XP_PER_COMPLETION;
  const { level, xpInLevel, xpToNext } = computeLevel(xp);

  const unlocked = await db
    .select()
    .from(habitAchievements)
    .where(eq(habitAchievements.ownerId, ownerId));

  const unlockedMap = new Map(
    unlocked.map((a) => [a.key, a.unlockedAt?.toISOString() ?? null]),
  );

  return {
    xp,
    level,
    xpInLevel,
    xpToNext,
    achievements: ACHIEVEMENT_DEFS.map((d) => ({
      ...d,
      unlockedAt: unlockedMap.get(d.key) ?? null,
      unlocked: unlockedMap.has(d.key),
    })),
  };
}
