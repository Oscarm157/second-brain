import { requireUser } from "@/lib/session";
import { listTasks, listSubtasks } from "@/lib/personal-tasks/data";
import type { PersonalSubtask } from "@/lib/schema";
import { PersonalBoard } from "@/components/personal-tasks/PersonalBoard";
import { TaskFormTrigger } from "@/components/personal-tasks/TaskForm";

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const me = await requireUser();
  const [tasks, subtasks] = await Promise.all([listTasks(me.id), listSubtasks(me.id)]);

  const subtasksByTask: Record<string, PersonalSubtask[]> = {};
  for (const s of subtasks) (subtasksByTask[s.taskId] ??= []).push(s);

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
              Pendientes
            </h1>
            <p className="mt-1 text-sm text-ink">
              Tus pendientes personales, a la vista para no olvidarlos.
            </p>
          </div>
          <TaskFormTrigger />
        </header>
        <PersonalBoard tasks={tasks} subtasksByTask={subtasksByTask} />
      </div>
    </div>
  );
}
