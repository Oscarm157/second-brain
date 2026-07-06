import Link from "next/link";
import { ArrowUpRight, Wallet } from "lucide-react";

import { requireUser } from "@/lib/session";
import { getDashboard } from "@/lib/finanzas/data";
import { money } from "@/lib/finanzas/format";
import { getTodayHabits, getGamification } from "@/lib/habits/data";
import { getTasksSnapshot } from "@/lib/personal-tasks/data";
import { getCodeSnapshot, listProjects } from "@/lib/code-board/data";
import { DarkShell } from "@/components/DarkShell";
import { TasksPanel } from "@/components/hub/TasksPanel";
import { CodePanel } from "@/components/hub/CodePanel";
import { HabitsQuick } from "@/components/hub/HabitsQuick";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function todayLabel(): string {
  const s = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function HubPage() {
  const me = await requireUser();
  const [fin, todayHabits, gam, tasks, code, projects] = await Promise.all([
    getDashboard(me.id),
    getTodayHabits(me.id),
    getGamification(me.id),
    getTasksSnapshot(me.id),
    getCodeSnapshot(me.id),
    listProjects(me.id),
  ]);

  return (
    <DarkShell>
      <header className="mb-7">
        <p className="text-sm text-[var(--h-text-secondary)]">{greeting()},</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--h-text)]">
            {me.name.split(" ")[0]}
          </h1>
          <span className="text-sm text-[var(--h-text-faint)]">{todayLabel()}</span>
        </div>
      </header>

      <div className="space-y-4">
        {/* Registro rápido de hábitos de hoy */}
        <HabitsQuick habits={todayHabits} level={gam.level} />

        {/* Pendientes (operativo) + Finanzas (vistazo general) */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TasksPanel items={tasks.items} open={tasks.open} doing={tasks.doing} />
          </div>

          <Link
            href="/dashboard"
            className="group flex flex-col rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6 transition-colors hover:border-[var(--income)]"
          >
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-[var(--income)]" />
              <span className="text-sm font-semibold text-[var(--h-text)]">Finanzas</span>
              <ArrowUpRight className="ml-auto size-4 text-[var(--h-text-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            {fin ? (
              <div className="mt-5 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[var(--h-text-secondary)]">Ingresos</span>
                  <span className="font-display text-lg font-semibold text-[var(--income)]">{money(fin.kpis.ingresos)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[var(--h-text-secondary)]">Gastos</span>
                  <span className="font-display text-lg font-semibold text-[var(--expense)]">{money(fin.kpis.gastos)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--h-text-faint)]">Importa un estado de cuenta.</p>
            )}
          </Link>
        </div>

        {/* Código (operativo) */}
        <CodePanel items={code.items} inProgress={code.inProgress} blocked={code.blocked} projects={projects} />
      </div>
    </DarkShell>
  );
}
