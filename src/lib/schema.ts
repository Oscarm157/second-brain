import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  date,
  unique,
  jsonb,
  type AnyPgColumn,
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
  // Subcategoría: apunta a su categoría padre (un solo nivel). Null = categoría raíz.
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
    onDelete: "cascade",
  }),
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
  // Pago/préstamo asignado a una deuda (vínculo manual). Aparte de la categoría.
  debtId: uuid("debt_id").references((): AnyPgColumn => debts.id, {
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
export type DebtKind = "tarjeta" | "prestamo" | "persona" | "otro";

// Deudas que Oscar mapea. El saldo se deriva: `balance` es el saldo de arranque
// (al crear); los movimientos del banco vinculados por `transactions.debtId` lo
// ajustan (gastos = pagos, ingresos = préstamos nuevos). `principal` es el monto
// original total, para medir avance (principal − balance = ya pagado antes).
export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").$type<DebtType>().notNull(),
  kind: text("kind").$type<DebtKind>(),
  counterparty: text("counterparty").notNull(),
  principal: numeric("principal", { precision: 14, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
  monthlyPayment: numeric("monthly_payment", { precision: 14, scale: 2 }),
  paymentDay: integer("payment_day"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }),
  termMonths: integer("term_months"),
  startDate: date("start_date"),
  description: text("description"),
  status: text("status").$type<DebtStatus>().notNull().default("open"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Debt = typeof debts.$inferSelect;

export type ScenarioAdjustment = { key: string; included: boolean; amount: number };

// Escenarios "what-if": ajustes (omitir/cambiar monto) sobre las categorías de un mes.
export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  statementId: uuid("statement_id")
    .references(() => statements.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  adjustments: jsonb("adjustments").$type<ScenarioAdjustment[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Scenario = typeof scenarios.$inferSelect;

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

// ------- Módulo Hábitos -------

export type HabitFrequency = "daily" | "weekly" | "custom";

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("check"),
  color: text("color").notNull().default("#34d399"),
  frequency: text("frequency").$type<HabitFrequency>().notNull().default("daily"),
  targetPerWeek: integer("target_per_week"),
  weekdays: jsonb("weekdays").$type<number[]>(),
  targetPerDay: integer("target_per_day").notNull().default(1),
  gracePerWeek: integer("grace_per_week").notNull().default(1),
  goalPeriod: text("goal_period").$type<"week" | "month" | "year">(),
  goalTarget: integer("goal_target"),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Habit = typeof habits.$inferSelect;

export const habitEntries = pgTable(
  "habit_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    habitId: uuid("habit_id")
      .references(() => habits.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("habit_entries_habit_date_unique").on(t.habitId, t.date)],
);

export type HabitEntry = typeof habitEntries.$inferSelect;

export const habitAchievements = pgTable(
  "habit_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    habitId: uuid("habit_id").references(() => habits.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("habit_achievements_owner_key_unique").on(t.ownerId, t.key)],
);

export type HabitAchievement = typeof habitAchievements.$inferSelect;

// ------- Módulo Pendientes (kanban personal) -------

export type PersonalTaskStatus = "todo" | "doing" | "done";

export const personalTasks = pgTable("personal_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: date("due_date"),
  status: text("status").$type<PersonalTaskStatus>().notNull().default("todo"),
  priority: integer("priority").notNull().default(0),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type PersonalTask = typeof personalTasks.$inferSelect;

// ------- Módulo Código (kanban de desarrollo) -------

export type CodeCardStatus = "backlog" | "in_progress" | "blocked" | "done";
export type CodeCardPriority = "low" | "med" | "high";
export type CodeNoteAuthor = "oscar" | "claude";

export const codeCards = pgTable("code_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  project: text("project").notNull(),
  title: text("title").notNull(),
  spec: text("spec"),
  status: text("status").$type<CodeCardStatus>().notNull().default("backlog"),
  priority: text("priority").$type<CodeCardPriority>().notNull().default("med"),
  labels: jsonb("labels").$type<string[]>().notNull().default([]),
  repo: text("repo"),
  branch: text("branch"),
  prUrl: text("pr_url"),
  position: integer("position").notNull().default(0),
  focusSeconds: integer("focus_seconds").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type CodeCard = typeof codeCards.$inferSelect;

export const codeCardNotes = pgTable("code_card_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  cardId: uuid("card_id")
    .references(() => codeCards.id, { onDelete: "cascade" })
    .notNull(),
  author: text("author").$type<CodeNoteAuthor>().notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type CodeCardNote = typeof codeCardNotes.$inferSelect;
