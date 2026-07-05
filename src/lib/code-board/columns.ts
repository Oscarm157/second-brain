import type { CodeCardStatus } from "@/lib/schema";

/** Columnas/estados del tablero de Código. Fuente única para el board y el detalle. */
export const CODE_COLUMNS: { id: CodeCardStatus; label: string; accent: string }[] = [
  { id: "backlog", label: "Backlog", accent: "#6f6d82" },
  { id: "in_progress", label: "En curso", accent: "#60a5fa" },
  { id: "blocked", label: "Bloqueado", accent: "#fb923c" },
  { id: "done", label: "Hecho", accent: "#34d399" },
];
