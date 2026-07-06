import { and, asc, desc, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { personalTasks, personalSubtasks, type PersonalTask, type PersonalSubtask } from "@/lib/schema";

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

/** Todas las subtareas del usuario, para agrupar por tarea en el cliente. */
export async function listSubtasks(ownerId: string): Promise<PersonalSubtask[]> {
  return db
    .select()
    .from(personalSubtasks)
    .where(eq(personalSubtasks.ownerId, ownerId))
    .orderBy(asc(personalSubtasks.position), asc(personalSubtasks.createdAt));
}

export type TaskPeekItem = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: number;
  position: number;
};

/** Resumen para el hub: pendientes abiertos + los primeros items para actuar. */
export async function getTasksSnapshot(ownerId: string): Promise<{
  open: number;
  doing: number;
  items: TaskPeekItem[];
}> {
  const rows = await db
    .select({
      id: personalTasks.id,
      title: personalTasks.title,
      status: personalTasks.status,
      priority: personalTasks.priority,
      position: personalTasks.position,
    })
    .from(personalTasks)
    .where(and(eq(personalTasks.ownerId, ownerId), ne(personalTasks.status, "done")))
    .orderBy(desc(personalTasks.priority), asc(personalTasks.position), asc(personalTasks.createdAt));
  return {
    open: rows.length,
    doing: rows.filter((r) => r.status === "doing").length,
    items: rows.slice(0, 6),
  };
}
