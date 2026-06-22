import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, statements, transactions } from "@/lib/schema";

const n = (v: string | null) => (v ? parseFloat(v) : 0);

export type TxRow = {
  id: string;
  date: string;
  description: string;
  counterparty: string | null;
  amount: number;
  direction: "in" | "out";
  kind: string;
  isInternal: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  currency: string;
};

export async function listStatements(ownerId: string) {
  const rows = await db
    .select()
    .from(statements)
    .where(eq(statements.ownerId, ownerId))
    .orderBy(desc(statements.periodEnd));
  return rows.map((s) => ({
    id: s.id,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    status: s.status,
    depositos: n(s.depositos),
    gastos: n(s.gastos),
    saldoFinal: n(s.saldoFinal),
  }));
}

export async function getStatementTransactions(
  ownerId: string,
  statementId: string,
): Promise<TxRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      counterparty: transactions.counterparty,
      amount: transactions.amount,
      direction: transactions.direction,
      kind: transactions.kind,
      isInternal: transactions.isInternal,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      currency: transactions.currency,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(eq(transactions.ownerId, ownerId), eq(transactions.statementId, statementId)),
    )
    .orderBy(desc(transactions.date));
  return rows.map((r) => ({ ...r, amount: n(r.amount) }));
}

// Movimientos de flujo (sin cajitas internas) para categorizar manualmente.
export async function getTransactions(ownerId: string): Promise<TxRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      counterparty: transactions.counterparty,
      amount: transactions.amount,
      direction: transactions.direction,
      kind: transactions.kind,
      isInternal: transactions.isInternal,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      currency: transactions.currency,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.ownerId, ownerId), eq(transactions.isInternal, false)))
    .orderBy(desc(transactions.date));
  return rows.map((r) => ({ ...r, amount: n(r.amount) }));
}

export async function getStatement(ownerId: string, statementId: string) {
  const rows = await db
    .select()
    .from(statements)
    .where(and(eq(statements.ownerId, ownerId), eq(statements.id, statementId)));
  return rows[0] ?? null;
}

export async function listCategories(ownerId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.ownerId, ownerId))
    .orderBy(categories.kind, categories.name);
}

// Datos del dashboard para un statement (o el más reciente listo/en revisión).
export async function getDashboard(ownerId: string, statementId?: string) {
  let stmt;
  if (statementId) {
    stmt = await getStatement(ownerId, statementId);
  } else {
    const rows = await db
      .select()
      .from(statements)
      .where(eq(statements.ownerId, ownerId))
      .orderBy(desc(statements.periodEnd))
      .limit(1);
    stmt = rows[0] ?? null;
  }
  if (!stmt) return null;

  const txs = await getStatementTransactions(ownerId, stmt.id);
  const flow = txs.filter((t) => !t.isInternal);

  const ingresos = flow.filter((t) => t.direction === "in").reduce((a, t) => a + t.amount, 0);
  const gastos = flow.filter((t) => t.direction === "out").reduce((a, t) => a + t.amount, 0);

  // Gasto por categoría (solo egresos no internos).
  const byCat = new Map<string, { name: string; color: string; total: number }>();
  for (const t of flow.filter((t) => t.direction === "out")) {
    const key = t.categoryId ?? "none";
    const name = t.categoryName ?? "Sin categoría";
    const color = t.categoryColor ?? "#cbd2dd";
    const cur = byCat.get(key) ?? { name, color, total: 0 };
    cur.total += t.amount;
    byCat.set(key, cur);
  }
  const spendByCategory = [...byCat.values()]
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ ...c, pct: gastos ? Math.round((c.total / gastos) * 100) : 0 }));

  // Ingreso por categoría (solo entradas no internas).
  const inByCat = new Map<string, { name: string; color: string; total: number }>();
  for (const t of flow.filter((t) => t.direction === "in")) {
    const key = t.categoryId ?? "none";
    const cur = inByCat.get(key) ?? {
      name: t.categoryName ?? "Sin categoría",
      color: t.categoryColor ?? "#cbd2dd",
      total: 0,
    };
    cur.total += t.amount;
    inByCat.set(key, cur);
  }
  const incomeByCategory = [...inByCat.values()]
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ ...c, pct: ingresos ? Math.round((c.total / ingresos) * 100) : 0 }));

  // Cashflow por día (entradas vs salidas, sin internos).
  const byDay = new Map<string, { date: string; in: number; out: number }>();
  for (const t of flow) {
    const cur = byDay.get(t.date) ?? { date: t.date, in: 0, out: 0 };
    if (t.direction === "in") cur.in += t.amount;
    else cur.out += t.amount;
    byDay.set(t.date, cur);
  }
  const cashflow = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  const internos = txs.filter((t) => t.isInternal).length;

  return {
    statement: {
      id: stmt.id,
      periodStart: stmt.periodStart,
      periodEnd: stmt.periodEnd,
      status: stmt.status,
      saldoInicial: n(stmt.saldoInicial),
      saldoFinal: n(stmt.saldoFinal),
      comisiones: n(stmt.comisiones),
    },
    kpis: { ingresos, gastos, balance: ingresos - gastos, saldoFinal: n(stmt.saldoFinal) },
    spendByCategory,
    incomeByCategory,
    cashflow,
    recent: flow.slice(0, 12),
    counts: { total: txs.length, internos, flujo: flow.length },
  };
}
