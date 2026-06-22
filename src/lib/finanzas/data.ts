import { and, desc, eq, gte, ilike, isNull, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, debts, scenarios, statements, transactions } from "@/lib/schema";

const n = (v: string | null) => (v ? parseFloat(v) : 0);

export type TxRow = {
  id: string;
  date: string;
  description: string;
  counterparty: string | null;
  rawDetail: string | null;
  amount: number;
  direction: "in" | "out";
  kind: string;
  isInternal: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryExcluded: boolean;
  debtId: string | null;
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
      rawDetail: transactions.rawDetail,
      amount: transactions.amount,
      direction: transactions.direction,
      kind: transactions.kind,
      isInternal: transactions.isInternal,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryExcluded: categories.excludeFromFlow,
      debtId: transactions.debtId,
      currency: transactions.currency,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(eq(transactions.ownerId, ownerId), eq(transactions.statementId, statementId)),
    )
    .orderBy(desc(transactions.date));
  return rows.map((r) => ({ ...r, amount: n(r.amount), categoryExcluded: !!r.categoryExcluded }));
}

// Movimientos de flujo (sin cajitas internas) de un mes (statement), para categorizar.
export async function getTransactions(
  ownerId: string,
  statementId: string,
): Promise<TxRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      counterparty: transactions.counterparty,
      rawDetail: transactions.rawDetail,
      amount: transactions.amount,
      direction: transactions.direction,
      kind: transactions.kind,
      isInternal: transactions.isInternal,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryExcluded: categories.excludeFromFlow,
      debtId: transactions.debtId,
      currency: transactions.currency,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.ownerId, ownerId),
        eq(transactions.statementId, statementId),
        eq(transactions.isInternal, false),
      ),
    )
    .orderBy(desc(transactions.date));
  return rows.map((r) => ({ ...r, amount: n(r.amount), categoryExcluded: !!r.categoryExcluded }));
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

export async function listScenarios(ownerId: string, statementId: string) {
  return db
    .select()
    .from(scenarios)
    .where(and(eq(scenarios.ownerId, ownerId), eq(scenarios.statementId, statementId)))
    .orderBy(desc(scenarios.createdAt));
}

// Categorías con el número de movimientos que tienen (para la página de gestión).
export async function listCategoriesWithCounts(ownerId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      kind: categories.kind,
      color: categories.color,
      parentId: categories.parentId,
      excludeFromFlow: categories.excludeFromFlow,
      count: sql<number>`count(${transactions.id})::int`,
      total: sql<number>`coalesce(sum(${transactions.amount}), 0)::float`,
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(eq(categories.ownerId, ownerId))
    .groupBy(categories.id)
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
  const flow = txs.filter((t) => !t.isInternal && !t.categoryExcluded);

  const ingresos = flow.filter((t) => t.direction === "in").reduce((a, t) => a + t.amount, 0);
  const gastos = flow.filter((t) => t.direction === "out").reduce((a, t) => a + t.amount, 0);

  // Categorías del usuario para hacer rollup de subcategorías a su padre.
  const cats = await db
    .select({
      id: categories.id,
      parentId: categories.parentId,
      name: categories.name,
      color: categories.color,
    })
    .from(categories)
    .where(eq(categories.ownerId, ownerId));
  const catMap = new Map(cats.map((c) => [c.id, c]));

  type Child = { name: string; color: string; total: number };
  type Item = { description: string; amount: number; date: string };
  type Parent = {
    id: string;
    name: string;
    color: string;
    total: number;
    children: Map<string, Child>;
    items: Item[];
  };

  // Agrupa por categoría de nivel superior; las subcategorías quedan como `children`
  // (incluye un bucket "Directo" para lo asignado al padre mismo).
  function rollup(list: TxRow[], denom: number) {
    const parents = new Map<string, Parent>();
    for (const t of list) {
      const c = t.categoryId ? catMap.get(t.categoryId) : undefined;
      const top = c?.parentId ? catMap.get(c.parentId) : c;
      const topId = top?.id ?? "none";
      const p =
        parents.get(topId) ??
        {
          id: topId,
          name: top?.name ?? "Sin categoría",
          color: top?.color ?? "#cbd2dd",
          total: 0,
          children: new Map<string, Child>(),
          items: [],
        };
      p.total += t.amount;
      p.items.push({ description: t.description, amount: t.amount, date: t.date });
      if (c?.parentId) {
        const ch = p.children.get(c.id) ?? { name: c.name, color: c.color, total: 0 };
        ch.total += t.amount;
        p.children.set(c.id, ch);
      } else if (c) {
        const ch = p.children.get("_direct") ?? { name: "Directo", color: p.color, total: 0 };
        ch.total += t.amount;
        p.children.set("_direct", ch);
      }
      parents.set(topId, p);
    }
    return [...parents.values()]
      .sort((a, b) => b.total - a.total)
      .map((p) => {
        const children = [...p.children.values()]
          .filter((c) => c.total > 0)
          .sort((a, b) => b.total - a.total)
          .map((c) => ({
            name: c.name,
            color: c.color,
            total: c.total,
            pct: p.total ? Math.round((c.total / p.total) * 100) : 0,
          }));
        const hasSubs = children.some((c) => c.name !== "Directo");
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          total: p.total,
          pct: denom ? Math.round((p.total / denom) * 100) : 0,
          children: hasSubs ? children : [],
          items: [...p.items].sort((a, b) => b.amount - a.amount),
        };
      });
  }

  const spendByCategory = rollup(flow.filter((t) => t.direction === "out"), gastos);
  const incomeByCategory = rollup(flow.filter((t) => t.direction === "in"), ingresos);

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

// ── Deudas ────────────────────────────────────────────────────────────────

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Hoy como YYYY-MM-DD (zona del server; suficiente para vencimientos).
function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

// Próxima ocurrencia de un día de pago (este mes si aún no pasa, si no el siguiente).
function nextPaymentDate(day: number): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (day < now.getDate()) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dd = Math.min(day, lastDay);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export type DebtRow = {
  id: string;
  kind: string | null;
  counterparty: string;
  principal: number;
  saldo: number;
  pagadoTotal: number;
  progreso: number;
  monthlyPayment: number | null;
  paymentDay: number | null;
  interestRate: number | null;
  termMonths: number | null;
  startDate: string | null;
  dueDate: string | null;
  description: string | null;
  status: "open" | "paid";
  proximoPago: string | null;
  vencida: boolean;
  linkedCount: number;
};

export async function listDebts(ownerId: string): Promise<DebtRow[]> {
  const rows = await db
    .select()
    .from(debts)
    .where(and(eq(debts.ownerId, ownerId), eq(debts.type, "i_owe")))
    .orderBy(desc(debts.createdAt));

  const agg = await db
    .select({
      debtId: transactions.debtId,
      paid: sql<string>`coalesce(sum(case when ${transactions.direction} = 'out' then ${transactions.amount} else 0 end), 0)`,
      borrowed: sql<string>`coalesce(sum(case when ${transactions.direction} = 'in' then ${transactions.amount} else 0 end), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(and(eq(transactions.ownerId, ownerId), isNotNull(transactions.debtId)))
    .groupBy(transactions.debtId);

  const aggMap = new Map(agg.map((a) => [a.debtId, a]));
  const today = todayISO();

  return rows.map((d) => {
    const a = aggMap.get(d.id);
    const principal = n(d.principal);
    const balance0 = n(d.balance);
    const paid = a ? n(a.paid) : 0;
    const borrowed = a ? n(a.borrowed) : 0;
    const saldo = balance0 - paid + borrowed;
    const pagadoTotal = principal - balance0 + paid;
    const proximoPago = d.paymentDay
      ? nextPaymentDate(d.paymentDay)
      : d.dueDate ?? null;
    return {
      id: d.id,
      kind: d.kind,
      counterparty: d.counterparty,
      principal,
      saldo,
      pagadoTotal,
      progreso: principal > 0 ? clamp01(pagadoTotal / principal) : 0,
      monthlyPayment: d.monthlyPayment ? n(d.monthlyPayment) : null,
      paymentDay: d.paymentDay,
      interestRate: d.interestRate ? n(d.interestRate) : null,
      termMonths: d.termMonths,
      startDate: d.startDate,
      dueDate: d.dueDate,
      description: d.description,
      status: d.status,
      proximoPago,
      vencida: d.status === "open" && saldo > 0 && !!d.dueDate && d.dueDate < today,
      linkedCount: a ? Number(a.count) : 0,
    };
  });
}

export type DebtOption = { id: string; counterparty: string };

// Deudas activas para el selector inline en Movimientos.
export async function listDebtOptions(ownerId: string): Promise<DebtOption[]> {
  return db
    .select({ id: debts.id, counterparty: debts.counterparty })
    .from(debts)
    .where(
      and(eq(debts.ownerId, ownerId), eq(debts.type, "i_owe"), eq(debts.status, "open")),
    )
    .orderBy(debts.counterparty);
}

// Pagos del mes en curso sobre deudas (movimientos vinculados, tipo gasto).
export async function paidOnDebtsThisMonth(ownerId: string): Promise<number> {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [r] = await db
    .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.ownerId, ownerId),
        isNotNull(transactions.debtId),
        eq(transactions.direction, "out"),
        gte(transactions.date, firstOfMonth),
      ),
    );
  return n(r?.total ?? null);
}

export type DebtLinkedTx = {
  id: string;
  date: string;
  description: string;
  amount: number;
  direction: "in" | "out";
};

export async function getDebt(ownerId: string, debtId: string) {
  const [d] = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.ownerId, ownerId)));
  if (!d) return null;

  const linked = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
      direction: transactions.direction,
    })
    .from(transactions)
    .where(and(eq(transactions.ownerId, ownerId), eq(transactions.debtId, debtId)))
    .orderBy(desc(transactions.date));

  const movimientos: DebtLinkedTx[] = linked.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: n(t.amount),
    direction: t.direction,
  }));

  const paid = movimientos
    .filter((m) => m.direction === "out")
    .reduce((s, m) => s + m.amount, 0);
  const borrowed = movimientos
    .filter((m) => m.direction === "in")
    .reduce((s, m) => s + m.amount, 0);
  const principal = n(d.principal);
  const balance0 = n(d.balance);
  const saldo = balance0 - paid + borrowed;
  const pagadoTotal = principal - balance0 + paid;

  return {
    debt: {
      id: d.id,
      kind: d.kind,
      counterparty: d.counterparty,
      principal,
      balance: balance0,
      monthlyPayment: d.monthlyPayment ? n(d.monthlyPayment) : null,
      paymentDay: d.paymentDay,
      interestRate: d.interestRate ? n(d.interestRate) : null,
      termMonths: d.termMonths,
      startDate: d.startDate,
      dueDate: d.dueDate,
      description: d.description,
      status: d.status,
    },
    movimientos,
    saldo,
    pagadoTotal,
    progreso: principal > 0 ? clamp01(pagadoTotal / principal) : 0,
  };
}

// Movimientos sin deuda asignada, para el buscador del detalle.
export async function listUnassignedDebtTx(
  ownerId: string,
  q?: string,
): Promise<DebtLinkedTx[]> {
  const filters = [
    eq(transactions.ownerId, ownerId),
    isNull(transactions.debtId),
    eq(transactions.isInternal, false),
  ];
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    filters.push(
      or(ilike(transactions.description, like), ilike(transactions.counterparty, like))!,
    );
  }
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
      direction: transactions.direction,
    })
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.date))
    .limit(40);
  return rows.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: n(t.amount),
    direction: t.direction,
  }));
}
