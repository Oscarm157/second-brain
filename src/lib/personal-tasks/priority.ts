/** Niveles de prioridad de una tarea (0-2). Color por token de tema. */
export const PRIORITY_META: { value: number; label: string; color: string | null }[] = [
  { value: 0, label: "Normal", color: null },
  { value: 1, label: "Media", color: "var(--warn)" },
  { value: 2, label: "Alta", color: "var(--alert)" },
];
