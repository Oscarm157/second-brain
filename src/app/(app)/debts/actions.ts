"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { debts, transactions } from "@/lib/schema";
import { listUnassignedDebtTx, type DebtLinkedTx } from "@/lib/finanzas/data";

const uuid = z.string().uuid();

const numReq = z.coerce.number().refine((v) => Number.isFinite(v), "Número inválido.");
const numOpt = z
  .union([z.literal(""), z.coerce.number()])
  .transform((v) => (v === "" ? undefined : v))
  .optional();
const intOpt = z
  .union([z.literal(""), z.coerce.number().int()])
  .transform((v) => (v === "" ? undefined : v))
  .optional();
const dateOpt = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")])
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const schema = z
  .object({
    counterparty: z.string().trim().min(1, "Ponle a quién le debes.").max(80),
    kind: z.enum(["tarjeta", "prestamo", "persona", "otro"]),
    principal: numReq.refine((v) => v > 0, "El monto original debe ser mayor a 0."),
    balance: numReq.refine((v) => v >= 0, "El saldo no puede ser negativo."),
    monthlyPayment: numOpt,
    paymentDay: intOpt,
    interestRate: numOpt,
    termMonths: intOpt,
    startDate: dateOpt,
    dueDate: dateOpt,
    description: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.balance <= d.principal, {
    message: "El saldo actual no puede ser mayor al monto original.",
  })
  .refine((d) => d.paymentDay === undefined || (d.paymentDay >= 1 && d.paymentDay <= 31), {
    message: "El día de pago debe estar entre 1 y 31.",
  });

const numStr = (v: number | undefined) => (v === undefined ? null : String(v));

function revalidate() {
  revalidatePath("/debts");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function saveDebt(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();

  const idRaw = formData.get("id");
  const parsed = schema.safeParse({
    counterparty: formData.get("counterparty"),
    kind: formData.get("kind"),
    principal: formData.get("principal"),
    balance: formData.get("balance"),
    monthlyPayment: formData.get("monthlyPayment") ?? "",
    paymentDay: formData.get("paymentDay") ?? "",
    interestRate: formData.get("interestRate") ?? "",
    termMonths: formData.get("termMonths") ?? "",
    startDate: formData.get("startDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  const values = {
    kind: d.kind,
    counterparty: d.counterparty,
    principal: String(d.principal),
    balance: String(d.balance),
    monthlyPayment: numStr(d.monthlyPayment),
    paymentDay: d.paymentDay ?? null,
    interestRate: numStr(d.interestRate),
    termMonths: d.termMonths ?? null,
    startDate: d.startDate ?? null,
    dueDate: d.dueDate ?? null,
    description: d.description?.length ? d.description : null,
  };

  if (idRaw) {
    if (!uuid.safeParse(idRaw).success) return { error: "Deuda inválida." };
    await db
      .update(debts)
      .set(values)
      .where(and(eq(debts.id, String(idRaw)), eq(debts.ownerId, me.id)));
  } else {
    await db.insert(debts).values({ ...values, ownerId: me.id, type: "i_owe" });
  }

  revalidate();
}

export async function deleteDebt(id: string) {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  // Las transacciones vinculadas quedan con debt_id null (FK set null).
  await db.delete(debts).where(and(eq(debts.id, id), eq(debts.ownerId, me.id)));
  revalidate();
}

export async function toggleDebtStatus(id: string) {
  const me = await requireUser();
  if (!uuid.safeParse(id).success) return;
  const [d] = await db
    .select({ status: debts.status })
    .from(debts)
    .where(and(eq(debts.id, id), eq(debts.ownerId, me.id)));
  if (!d) return;
  await db
    .update(debts)
    .set({ status: d.status === "open" ? "paid" : "open" })
    .where(and(eq(debts.id, id), eq(debts.ownerId, me.id)));
  revalidate();
}

export async function searchUnassignedTx(q: string): Promise<DebtLinkedTx[]> {
  const me = await requireUser();
  return listUnassignedDebtTx(me.id, q);
}

export async function linkTransactionToDebt(txId: string, debtId: string | null) {
  const me = await requireUser();
  if (!uuid.safeParse(txId).success) return { error: "Movimiento inválido." };
  if (debtId !== null) {
    if (!uuid.safeParse(debtId).success) return { error: "Deuda inválida." };
    const [d] = await db
      .select({ id: debts.id })
      .from(debts)
      .where(and(eq(debts.id, debtId), eq(debts.ownerId, me.id)));
    if (!d) return { error: "Deuda inválida." };
  }
  await db
    .update(transactions)
    .set({ debtId })
    .where(and(eq(transactions.id, txId), eq(transactions.ownerId, me.id)));
  revalidate();
}
