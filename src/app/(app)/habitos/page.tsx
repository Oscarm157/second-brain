import { requireUser } from "@/lib/session";
import {
  listHabits,
  getTodayHabits,
  getHabitGrid,
  getGamification,
} from "@/lib/habits/data";
import { TodayList } from "@/components/habits/TodayList";
import { HabitCard } from "@/components/habits/HabitCard";
import { XpBar } from "@/components/habits/XpBar";
import { AchievementsStrip } from "@/components/habits/AchievementsStrip";
import { HabitFormTrigger } from "@/components/habits/HabitForm";

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

  return (
    <div
      className="min-h-full"
      style={{ background: "var(--h-canvas)", color: "var(--h-text)" }}
    >
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--h-text)]">
              Hábitos
            </h1>
            <p className="mt-1 text-sm text-[var(--h-text-secondary)]">Tus rutinas.</p>
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

        {/* Today */}
        {todayHabits.length > 0 && <TodayList habits={todayHabits} />}

        {/* Habit grid or empty */}
        {habitsList.length === 0 ? (
          <div className="rounded-2xl border border-[var(--h-border)] py-16 text-center">
            <p className="text-[var(--h-text-secondary)]">Todavía no tienes hábitos.</p>
            <p className="mt-1 text-sm text-[var(--h-text-faint)]">Crea el primero.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
