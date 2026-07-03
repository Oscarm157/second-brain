import { and, asc, desc, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { personalTasks, type PersonalTask } from "@/lib/schema";

export async function listTasks(ownerId: string): Promise<PersonalTask[]> {
  return db
    .select()
    .from(personalTasks)
    .where(eq(personalTasks.ownerId, ownerId))
    .orderBy(
      desc(personalTasks.priority),
      asc(personalTasks.position),
      asc(personalTasks.createdAt),
    );
}

/** Resumen para el hub: pendientes abiertos + peek de títulos por hacer / haciendo. */
export async function getTasksSnapshot(ownerId: string): Promise<{
  open: number;
  doing: number;
  peek: string[];
}> {
  const rows = await db
    .select({ title: personalTasks.title, status: personalTasks.status })
    .from(personalTasks)
    .where(and(eq(personalTasks.ownerId, ownerId), ne(personalTasks.status, "done")))
    .orderBy(asc(personalTasks.position), asc(personalTasks.createdAt));
  return {
    open: rows.length,
    doing: rows.filter((r) => r.status === "doing").length,
    peek: rows.slice(0, 3).map((r) => r.title),
  };
}
