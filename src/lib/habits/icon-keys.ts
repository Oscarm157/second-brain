/** Keys canónicas de iconos de hábito. Fuente única para el catálogo y la validación Zod. */
export const HABIT_ICON_KEYS = [
  "sparkles",
  "check",
  "dumbbell",
  "book",
  "water",
  "moon",
  "brain",
  "heart",
  "coffee",
  "apple",
  "bike",
  "steps",
  "write",
  "music",
  "leaf",
  "flame",
  "target",
  "sun",
] as const;

export type HabitIconKey = (typeof HABIT_ICON_KEYS)[number];
