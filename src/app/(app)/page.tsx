import Link from "next/link";
import { ArrowUpRight, Code2, Flame, ListChecks, Wallet } from "lucide-react";

import { requireUser } from "@/lib/session";
import { getDashboard } from "@/lib/finanzas/data";
import { money } from "@/lib/finanzas/format";
import { getTodayHabits, getGamification } from "@/lib/habits/data";
import { getTasksSnapshot } from "@/lib/personal-tasks/data";
import { getCodeSnapshot } from "@/lib/code-board/data";
import { DarkShell } from "@/components/DarkShell";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function HubPage() {
  const me = await requireUser();
  const [fin, todayHabits, gam, tasks, code] = await Promise.all([
    getDashboard(me.id),
    getTodayHabits(me.id),
    getGamification(me.id),
    getTasksSnapshot(me.id),
    getCodeSnapshot(me.id),
  ]);

  const pendingHabits = todayHabits.filter((h) => !h.doneToday).length;

  return (
    <DarkShell>
      <header className="mb-8">
        <p className="text-sm text-[var(--h-text-secondary)]">{greeting()},</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--h-text)]">
          {me.name.split(" ")[0]}
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pendientes — recuadro grande, lista a la vista */}
        <Link
          href="/pendientes"
          className="group flex flex-col rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6 transition-colors hover:border-[var(--h-blue)] lg:col-span-2 lg:row-span-2"
        >
          <div className="flex items-center gap-2">
            <ListChecks className="size-5 text-[var(--h-blue)]" />
            <span className="text-sm font-semibold text-[var(--h-text)]">Pendientes</span>
            <ArrowUpRight className="ml-auto size-4 text-[var(--h-text-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold text-[var(--h-text)]">{tasks.open}</span>
            <span className="text-sm text-[var(--h-text-secondary)]">
              abiertos{tasks.doing > 0 ? ` · ${tasks.doing} haciendo` : ""}
            </span>
          </div>
          <div className="mt-5 flex-1 space-y-2">
            {tasks.peek.length === 0 ? (
              <p className="text-sm text-[var(--h-text-faint)]">Sin pendientes. Todo en orden.</p>
            ) : (
              tasks.peek.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-[var(--h-text-secondary)]">
                  <span className="size-1.5 rounded-full bg-[var(--h-blue)]" />
                  <span className="truncate">{t}</span>
                </div>
              ))
            )}
          </div>
        </Link>

        {/* Finanzas — numérico, mantiene verde/rojo */}
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

        {/* Hábitos */}
        <Link
          href="/habitos"
          className="group flex flex-col rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6 transition-colors hover:border-[var(--h-streak)]"
        >
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-[var(--h-streak)]" />
            <span className="text-sm font-semibold text-[var(--h-text)]">Hábitos</span>
            <ArrowUpRight className="ml-auto size-4 text-[var(--h-text-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-[var(--h-text)]">{pendingHabits}</span>
            <span className="text-sm text-[var(--h-text-secondary)]">para hoy</span>
          </div>
          <p className="mt-3 text-xs text-[var(--h-text-faint)]">Nivel {gam.level}</p>
        </Link>

        {/* Código — banda ancha */}
        <Link
          href="/codigo"
          className="group flex items-center gap-6 rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-6 transition-colors hover:border-[var(--h-violet)] lg:col-span-3"
        >
          <div className="flex items-center gap-2">
            <Code2 className="size-5 text-[var(--h-violet)]" />
            <span className="text-sm font-semibold text-[var(--h-text)]">Código</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-[var(--h-text)]">{code.inProgress}</span>
            <span className="text-sm text-[var(--h-text-secondary)]">en curso</span>
          </div>
          {code.blocked > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[var(--alert)]">{code.blocked}</span>
              <span className="text-sm text-[var(--h-text-secondary)]">bloqueadas</span>
            </div>
          ) : null}
          <ArrowUpRight className="ml-auto size-4 text-[var(--h-text-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </DarkShell>
  );
}
