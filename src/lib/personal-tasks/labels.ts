/** Parsea "casa, Urgente" -> ["casa","urgente"]: trim, minúsculas, dedup, máx 24/label y 8 labels.
 *  Fuente única usada por la server action y el cliente. */
export function parseLabels(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((l) => l.trim().toLowerCase().slice(0, 24))
        .filter(Boolean),
    ),
  ).slice(0, 8);
}
