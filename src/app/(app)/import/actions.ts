"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  accounts,
  categories,
  categoryRules,
  statements,
  transactions,
} from "@/lib/schema";
import { parseNuStatement } from "@/lib/parsers/nu";
import { categorizeDescriptions } from "@/lib/ai/categorize";
import { uploadStatementPdf } from "@/lib/finanzas/blob";

// Cuenta Nu del usuario (la crea el seed; si falta, la crea aquí).
async function getNuAccount(ownerId: string) {
  const found = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.ownerId, ownerId), eq(accounts.bank, "nu")));
  if (found[0]) return found[0];
  const created = await db
    .insert(accounts)
    .values({ ownerId, name: "Nu", bank: "nu", currency: "MXN" })
    .returning();
  return created[0];
}

// El nombre "limpio" que se categoriza: contraparte si existe, si no la descripción.
function cleanName(counterparty: string | null, description: string) {
  return (counterparty ?? description).trim();
}

export async function importStatement(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sube el PDF del estado de cuenta." };
  }
  if (file.type !== "application/pdf") {
    return { error: "El archivo debe ser un PDF." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let parsed;
  try {
    parsed = await parseNuStatement(bytes);
  } catch {
    return { error: "No se pudo leer el PDF. ¿Es un estado de cuenta de Nu?" };
  }
  if (!parsed.transactions.length || !parsed.periodStart) {
    return { error: "El PDF no parece un estado de cuenta de Nu válido." };
  }

  const account = await getNuAccount(me.id);

  // Evitar reimportar el mismo periodo.
  const dup = await db
    .select({ id: statements.id })
    .from(statements)
    .where(
      and(
        eq(statements.accountId, account.id),
        eq(statements.periodStart, parsed.periodStart),
        eq(statements.periodEnd, parsed.periodEnd),
      ),
    );
  if (dup[0]) {
    return { error: `Ya importaste el periodo ${parsed.periodStart} a ${parsed.periodEnd}.` };
  }

  // Guardar el PDF en Blob (opcional: solo si hay token configurado).
  let blobUrl: string | null = null;
  const uploaded = await uploadStatementPdf(me.id, file);
  if (uploaded && "url" in uploaded) blobUrl = uploaded.url;

  // Categorización: reglas primero (gratis), IA para lo que falte.
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.ownerId, me.id));
  const catByName = new Map(cats.map((c) => [c.name, c]));
  const rules = await db
    .select()
    .from(categoryRules)
    .where(eq(categoryRules.ownerId, me.id));

  function ruleMatch(name: string): string | null {
    const lower = name.toLowerCase();
    for (const r of rules) {
      if (lower.includes(r.pattern.toLowerCase())) return r.categoryId;
    }
    return null;
  }

  // Resolver categoría por nombre limpio para los movimientos no internos.
  const categorizable = parsed.transactions.filter((t) => !t.isInternal);
  const resolved = new Map<string, string>(); // cleanName -> categoryId
  const pendingForAi: string[] = [];
  for (const t of categorizable) {
    const name = cleanName(t.counterparty, t.description);
    if (resolved.has(name)) continue;
    const ruleId = ruleMatch(name);
    if (ruleId) resolved.set(name, ruleId);
    else pendingForAi.push(name);
  }

  // IA solo para los nombres únicos sin regla.
  if (pendingForAi.length) {
    const aiMap = await categorizeDescriptions(
      pendingForAi,
      cats.map((c) => ({ name: c.name, kind: c.kind })),
    );
    const newRules: { ownerId: string; pattern: string; categoryId: string; source: "ai" }[] = [];
    for (const [name, catName] of aiMap) {
      const cat = catByName.get(catName);
      if (!cat) continue;
      resolved.set(name, cat.id);
      newRules.push({ ownerId: me.id, pattern: name, categoryId: cat.id, source: "ai" });
    }
    if (newRules.length) await db.insert(categoryRules).values(newRules);
  }

  // Crear el statement en estado de revisión.
  const [stmt] = await db
    .insert(statements)
    .values({
      ownerId: me.id,
      accountId: account.id,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      blobUrl,
      saldoInicial: parsed.summary.saldoInicial,
      saldoFinal: parsed.summary.saldoFinal,
      depositos: parsed.summary.depositos,
      gastos: parsed.summary.gastos,
      comisiones: parsed.summary.comisiones,
      status: "review",
    })
    .returning();

  // Insertar transacciones (en lotes para no exceder el payload).
  const rows = parsed.transactions.map((t) => ({
    ownerId: me.id,
    accountId: account.id,
    statementId: stmt.id,
    source: "statement" as const,
    date: t.date,
    description: t.description,
    rawDetail: t.rawDetail,
    amount: t.amount,
    direction: t.direction,
    kind: t.kind,
    isInternal: t.isInternal,
    counterparty: t.counterparty,
    categoryId: t.isInternal ? null : resolved.get(cleanName(t.counterparty, t.description)) ?? null,
    currency: t.currency,
    fxRate: t.fxRate,
    fxAmount: t.fxAmount,
    dedupeKey: t.dedupeKey,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(transactions).values(rows.slice(i, i + 200));
  }

  revalidatePath("/import");
  redirect(`/import/${stmt.id}`);
}

const uuid = z.string().uuid();

export async function updateTransactionCategory(txId: string, categoryId: string | null) {
  const me = await requireUser();
  if (!uuid.safeParse(txId).success) return;
  const catId = categoryId && uuid.safeParse(categoryId).success ? categoryId : null;

  // Verificar que la categoría sea del usuario.
  if (catId) {
    const owned = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, catId), eq(categories.ownerId, me.id)));
    if (!owned[0]) return;
  }

  const updated = await db
    .update(transactions)
    .set({ categoryId: catId })
    .where(and(eq(transactions.id, txId), eq(transactions.ownerId, me.id)))
    .returning({ counterparty: transactions.counterparty, description: transactions.description });

  // Aprender la corrección como regla manual para futuros imports.
  if (updated[0] && catId) {
    const name = cleanName(updated[0].counterparty, updated[0].description);
    const exists = await db
      .select({ id: categoryRules.id })
      .from(categoryRules)
      .where(and(eq(categoryRules.ownerId, me.id), eq(categoryRules.pattern, name)));
    if (exists[0]) {
      await db.update(categoryRules).set({ categoryId: catId, source: "manual" }).where(eq(categoryRules.id, exists[0].id));
    } else {
      await db.insert(categoryRules).values({ ownerId: me.id, pattern: name, categoryId: catId, source: "manual" });
    }
  }
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/import", "layout");
}

export async function confirmStatement(statementId: string) {
  const me = await requireUser();
  if (!uuid.safeParse(statementId).success) return;
  await db
    .update(statements)
    .set({ status: "ready" })
    .where(and(eq(statements.id, statementId), eq(statements.ownerId, me.id)));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteStatement(statementId: string) {
  const me = await requireUser();
  if (!uuid.safeParse(statementId).success) return;
  await db
    .delete(statements)
    .where(and(eq(statements.id, statementId), eq(statements.ownerId, me.id)));
  revalidatePath("/import");
  redirect("/import");
}
