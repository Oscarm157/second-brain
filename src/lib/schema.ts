import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  date,
  unique,
} from "drizzle-orm/pg-core";

export type UserRole = "admin" | "member" | "viewer";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().default("member").notNull(),
  active: boolean("active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;

// Cuentas bancarias del usuario. Por ahora solo Nu, pero el modelo permite varias.
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  bank: text("bank").notNull().default("nu"),
  clabeLast4: text("clabe_last4"),
  currency: text("currency").notNull().default("MXN"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Account = typeof accounts.$inferSelect;

export type StatementStatus = "parsing" | "review" | "ready" | "error";

// Cada PDF de estado de cuenta importado. Los totales son los del resumen (pág 1)
// y sirven para cuadrar contra la suma de movimientos parseados.
export const statements = pgTable(
  "statements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    blobUrl: text("blob_url"),
    saldoInicial: numeric("saldo_inicial", { precision: 14, scale: 2 }),
    saldoFinal: numeric("saldo_final", { precision: 14, scale: 2 }),
    depositos: numeric("depositos", { precision: 14, scale: 2 }),
    gastos: numeric("gastos", { precision: 14, scale: 2 }),
    comisiones: numeric("comisiones", { precision: 14, scale: 2 }),
    status: text("status").$type<StatementStatus>().notNull().default("review"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("statements_period_unique").on(t.accountId, t.periodStart, t.periodEnd)],
);

export type Statement = typeof statements.$inferSelect;

export type CategoryKind = "income" | "expense";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  kind: text("kind").$type<CategoryKind>().notNull().default("expense"),
  color: text("color").notNull().default("#2456e6"),
  icon: text("icon").notNull().default("circle"),
  // Categorías que no cuentan como gasto ni ingreso real (ej. "Entre mis cuentas":
  // dinero propio moviéndose entre cuentas). Visibles, pero fuera de los totales.
  excludeFromFlow: boolean("exclude_from_flow").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Category = typeof categories.$inferSelect;

// Reglas aprendidas: si la descripción contiene `pattern`, asignar `categoryId`.
// Cachea lo que la IA ya resolvió para no volver a pagar en el siguiente import.
export const categoryRules = pgTable("category_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  pattern: text("pattern").notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  source: text("source").$type<"ai" | "manual">().notNull().default("ai"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type CategoryRule = typeof categoryRules.$inferSelect;

export type TxSource = "statement" | "manual";
export type TxDirection = "in" | "out";
export type TxKind =
  | "compra"
  | "transfer_out"
  | "transfer_in"
  | "deposito"
  | "cajita"
  | "devolucion"
  | "comision";

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
  statementId: uuid("statement_id").references(() => statements.id, {
    onDelete: "cascade",
  }),
  source: text("source").$type<TxSource>().notNull().default("statement"),
  date: date("date").notNull(),
  description: text("description").notNull(),
  rawDetail: text("raw_detail"),
  // Monto siempre positivo; el signo vive en `direction`.
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  direction: text("direction").$type<TxDirection>().notNull(),
  kind: text("kind").$type<TxKind>().notNull(),
  // Cajitas (apartados de Nu): dinero propio moviéndose, no gasto ni ingreso real.
  isInternal: boolean("is_internal").notNull().default(false),
  counterparty: text("counterparty"),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  currency: text("currency").notNull().default("MXN"),
  fxRate: numeric("fx_rate", { precision: 12, scale: 6 }),
  fxAmount: numeric("fx_amount", { precision: 14, scale: 2 }),
  // Para deduplicar reimportaciones: clave de rastreo SPEI o hash determinista.
  dedupeKey: text("dedupe_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;

export type DebtType = "i_owe" | "owed_to_me";
export type DebtStatus = "open" | "paid";

// Préstamos y deudas que Oscar lleva aparte de los movimientos del banco.
export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").$type<DebtType>().notNull(),
  counterparty: text("counterparty").notNull(),
  principal: numeric("principal", { precision: 14, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
  description: text("description"),
  status: text("status").$type<DebtStatus>().notNull().default("open"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Debt = typeof debts.$inferSelect;

// Tabla de ejemplo del starter. Se mantiene fuera del producto pero no estorba.
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Item = typeof items.$inferSelect;
