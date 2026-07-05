import type { PersonalTaskStatus } from "@/lib/schema";

/** Columnas/estados de Pendientes. Fuente única para el board y el detalle. */
export const PERSONAL_COLUMNS: { id: PersonalTaskStatus; label: string; accent: string }[] = [
  { id: "todo", label: "Por hacer", accent: "#60a5fa" },
  { id: "doing", label: "Haciendo", accent: "#fbbf24" },
  { id: "done", label: "Hecho", accent: "#34d399" },
];
