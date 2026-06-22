import { requireUser } from "@/lib/session";
import { listCategoriesWithCounts } from "@/lib/finanzas/data";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const me = await requireUser();
  const cats = await listCategoriesWithCounts(me.id);
  const income = cats.filter((c) => c.kind === "income");
  const expense = cats.filter((c) => c.kind === "expense");

  const group = (title: string, list: typeof cats) => (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">{title}</h3>
      {list.length === 0 ? (
        <p className="text-sm text-ink">Ninguna todavía.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="flex-1 truncate text-sm text-navy">{c.name}</span>
              {c.excludeFromFlow && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink">
                  No cuenta
                </span>
              )}
              <span className="text-xs tabular-nums text-faint">{c.count} movs</span>
              <DeleteCategoryButton id={c.id} name={c.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
          Categorías
        </h1>
        <p className="text-sm text-ink">
          Crea tus categorías de ingreso y gasto. Las que marques como &quot;no contar&quot;
          (ej. Omitido) se quedan registradas pero quedan fuera de todos los totales.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-navy">Nueva categoría</h2>
        <CategoryForm />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {group("Ingresos", income)}
        {group("Gastos", expense)}
      </div>
    </div>
  );
}
