import { requireUser } from "@/lib/session";
import { listCategoriesWithCounts } from "@/lib/finanzas/data";
import { money } from "@/lib/finanzas/format";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";
import { MoveCategory } from "./move-category";

export const dynamic = "force-dynamic";

type Cat = Awaited<ReturnType<typeof listCategoriesWithCounts>>[number];

export default async function CategoriesPage() {
  const me = await requireUser();
  const cats = await listCategoriesWithCounts(me.id);

  const roots = cats.filter((c) => !c.parentId);
  const childrenOf = (id: string) =>
    cats.filter((c) => c.parentId === id).sort((a, b) => b.total - a.total);
  const rootTotal = (c: Cat) =>
    c.total + childrenOf(c.id).reduce((s, x) => s + x.total, 0);

  // Para el form y el control de mover: categorías padre (raíz) por tipo.
  const parents = roots.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  const tree = (kind: "income" | "expense") => {
    const list = roots
      .filter((c) => c.kind === kind)
      .sort((a, b) => rootTotal(b) - rootTotal(a));
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {kind === "income" ? "Ingresos" : "Gastos"}
        </h3>
        {list.length === 0 ? (
          <p className="text-sm text-ink">Ninguna todavía.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
            {list.map((c) => {
              const subs = childrenOf(c.id);
              const total = rootTotal(c);
              return (
                <li key={c.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="flex-1 truncate text-sm font-medium text-navy">{c.name}</span>
                    {c.excludeFromFlow && (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink">No cuenta</span>
                    )}
                    <span className="text-sm tabular-nums text-navy">{money(total)}</span>
                    <MoveCategory
                      id={c.id}
                      parentId={null}
                      isParent
                      hasChildren={subs.length > 0}
                      parents={parents}
                    />
                    <DeleteCategoryButton id={c.id} name={c.name} />
                  </div>
                  {subs.length > 0 && (
                    <ul className="mt-2 space-y-1.5 border-l-2 border-line pl-4">
                      {subs.map((s) => (
                        <li key={s.id} className="flex items-center gap-3">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="flex-1 truncate text-sm text-ink">{s.name}</span>
                          <span className="text-xs tabular-nums text-ink">{money(s.total)}</span>
                          <span className="w-9 text-right text-xs tabular-nums text-faint">
                            {total ? Math.round((s.total / total) * 100) : 0}%
                          </span>
                          <MoveCategory
                            id={s.id}
                            parentId={c.id}
                            isParent={false}
                            hasChildren={false}
                            parents={parents}
                          />
                          <DeleteCategoryButton id={s.id} name={s.name} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
          Categorías
        </h1>
        <p className="text-sm text-ink">
          Crea categorías de ingreso y gasto, agrúpalas en subcategorías (ej. Suscripciones →
          Netflix, Vercel) y mira cuánto suma cada una. Las marcadas como &quot;no contar&quot;
          quedan fuera de los totales.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-navy">Nueva categoría</h2>
        <CategoryForm parents={parents} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tree("expense")}
        {tree("income")}
      </div>
    </div>
  );
}
