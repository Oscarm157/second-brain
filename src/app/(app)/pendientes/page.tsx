import { requireUser } from "@/lib/session";
import { listTasks } from "@/lib/personal-tasks/data";
import { PersonalBoard } from "@/components/personal-tasks/PersonalBoard";

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const me = await requireUser();
  const tasks = await listTasks(me.id);

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            Pendientes
          </h1>
          <p className="mt-1 text-sm text-ink">
            Tus pendientes personales, a la vista para no olvidarlos.
          </p>
        </header>
        <PersonalBoard tasks={tasks} />
      </div>
    </div>
  );
}
