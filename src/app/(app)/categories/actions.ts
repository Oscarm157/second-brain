"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { categories } from "@/lib/schema";

const createSchema = z.object({
  name: z.string().trim().min(1, "Ponle nombre.").max(40, "Máximo 40 caracteres."),
  kind: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido."),
  exclude: z.boolean(),
});

export async function createCategory(
  formData: FormData,
): Promise<{ error: string } | void> {
  const me = await requireUser();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
    exclude: formData.get("exclude") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const dup = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.ownerId, me.id), eq(categories.name, parsed.data.name)));
  if (dup[0]) return { error: "Ya tienes una categoría con ese nombre." };

  await db.insert(categories).values({
    ownerId: me.id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    color: parsed.data.color,
    icon: "circle",
    excludeFromFlow: parsed.data.exclude,
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

const idSchema = z.string().uuid();

export async function deleteCategory(id: string) {
  const me = await requireUser();
  if (!idSchema.safeParse(id).success) return;
  // Los movimientos quedan sin categoría por el FK onDelete set null.
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.ownerId, me.id)));
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
