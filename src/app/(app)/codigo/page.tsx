import { requireUser } from "@/lib/session";
import { listCards, listProjects } from "@/lib/code-board/data";
import { CodeBoard } from "@/components/code-board/CodeBoard";

export const dynamic = "force-dynamic";

export default async function CodigoPage() {
  const me = await requireUser();
  const [cards, projects] = await Promise.all([listCards(me.id), listProjects(me.id)]);

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            Código
          </h1>
          <p className="mt-1 text-sm text-ink">
            Tablero de desarrollo de todos tus repos. Claude entra a moverlo y dejar notas.
          </p>
        </header>
        <CodeBoard cards={cards} projects={projects} />
      </div>
    </div>
  );
}
