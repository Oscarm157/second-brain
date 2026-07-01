import { requireUser } from "@/lib/session";
import {
  listHabits,
  getTodayHabits,
  getHabitGrid,
  getGamification,
  computeStreak,
  computeHabitStats,
} from "@/lib/habits/data";
import { TodayList } from "@/components/habits/TodayList";
import { HabitCard } from "@/components/habits/HabitCard";
import { XpBar } from "@/components/habits/XpBar";
import { AchievementsStrip } from "@/components/habits/AchievementsStrip";
import { HabitFormTrigger } from "@/components/habits/HabitForm";
import { Tile } from "@/components/habits/Tile";

export const dynamic = "force-dynamic";

export default async function HabitosPage() {
  const me = await requireUser();
  const [habitsList, todayHabits, gamification] = await Promise.all([
    listHabits(me.id),
    getTodayHabits(me.id),
    getGamification(me.id),
  ]);

  const grids = await Promise.all(
    habitsList.map(async (h) => {
      const cells = await getHabitGrid(me.id, h.id, 119);
      return { habitId: h.id, cells };
    }),
  );
  const gridMap = new Map(grids.map((g) => [g.habitId, g.cells]));

  // Stats agregadas del hub. "Cumplimiento semanal" = promedio del % semanal de
  // cada hábito (weekPct de computeHabitStats sobre sus 7 últimos días).
  const perHabit = habitsList.map((h) => {
    const cells = gridMap.get(h.id) ?? [];
    const entries = cells
      .filter((c) => c.count > 0)
      .map((c) => ({ date: c.date, count: c.count }));
    return {
      streak: computeStreak(entries, h),
      stats: computeHabitStats(cells, h.targetPerDay, h.createdAt),
    };
  });
  const activeCount = habitsList.length;
  const longestStreak = perHabit.reduce((m, p) => Math.max(m, p.streak.current), 0);
  const weekAgg = perHabit.length
    ? Math.round(perHabit.reduce((s, p) => s + p.stats.weekPct, 0) / perHabit.length)
    : 0;

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
              Hábitos
            </h1>
            <p className="mt-1 text-sm text-ink">Tus rutinas.</p>
          </div>
          <HabitFormTrigger />
        </header>

        {/* XP Bar */}
        <XpBar
          xp={gamification.xp}
          level={gamification.level}
          xpInLevel={gamification.xpInLevel}
          xpToNext={gamification.xpToNext}
        />

        {/* KPIs */}
        {habitsList.length > 0 && (
          <section className="grid grid-cols-3 gap-4">
            <Tile label="Hábitos activos" value={String(activeCount)} />
            <Tile
              label="Racha más larga"
              value={String(longestStreak)}
              sub={longestStreak === 1 ? "día" : "días"}
              accent="text-warn"
            />
            <Tile label="Cumplimiento semanal" value={`${weekAgg}%`} sub="promedio" />
          </section>
        )}

        {/* Today */}
        {todayHabits.length > 0 && <TodayList habits={todayHabits} />}

        {/* Habit grid or empty */}
        {habitsList.length === 0 ? (
          <div className="rounded-lg border border-line bg-card py-16 text-center shadow-sm">
            <p className="text-ink">Todavía no tienes hábitos.</p>
            <p className="mt-1 text-sm text-faint">Crea el primero.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {habitsList.map((h) => (
              <HabitCard key={h.id} habit={h} cells={gridMap.get(h.id) ?? []} />
            ))}
          </section>
        )}

        {/* Achievements */}
        <AchievementsStrip achievements={gamification.achievements} />
      </div>
    </div>
  );
}
