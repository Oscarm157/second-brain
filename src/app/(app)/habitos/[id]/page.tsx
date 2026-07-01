import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/session";
import {
  getHabit,
  getHabitGrid,
  computeStreak,
  computeHabitStats,
} from "@/lib/habits/data";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { HabitFormTrigger } from "@/components/habits/HabitForm";
import { ArchiveHabitButton } from "./archive-habit";
import { Tile } from "@/components/habits/Tile";

export const dynamic = "force-dynamic";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  custom: "Personalizado",
};

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const habit = await getHabit(me.id, id);
  if (!habit) notFound();

  const cells = await getHabitGrid(me.id, id, 365);
  const streak = computeStreak(
    cells.map((c) => ({ date: c.date, count: c.count })),
    habit,
  );
  const stats = computeHabitStats(cells, habit.targetPerDay, habit.createdAt);

  const targetLabel =
    habit.targetPerDay === 1 ? "Una vez al día" : `${habit.targetPerDay}× al día`;

  return (
    <div className="space-y-6">
      <Link
        href="/habitos"
        className="inline-flex items-center gap-1.5 text-sm text-ink transition-colors hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        Hábitos
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${habit.color}22` }}
          >
            <span className="text-2xl" style={{ color: habit.color }}>
              ✦
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-navy">
              {habit.name}
            </h1>
            <p className="mt-0.5 text-sm text-faint">
              {FREQUENCY_LABEL[habit.frequency] ?? "Diario"} · {targetLabel}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <HabitFormTrigger habit={habit} />
          <ArchiveHabitButton id={habit.id} name={habit.name} />
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Racha actual"
          value={String(streak.current)}
          sub="días seguidos"
          accent="text-warn"
        />
        <Tile label="Mejor racha" value={String(streak.best)} sub="días" />
        <Tile label="Cumplimiento del mes" value={`${stats.monthPct}%`} sub="últimos 30 días" />
        <Tile
          label="Días completados"
          value={String(stats.totalCompleted)}
          sub="en el último año"
        />
      </section>

      {/* Heatmap de año completo */}
      <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-navy">Último año</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <HabitHeatmap cells={cells} color={habit.color} />
          </div>
        </div>
      </section>
    </div>
  );
}
