"use client";

import { ErrorState } from "@/components/states";

export default function HabitDetailError({ reset }: { reset: () => void }) {
  return (
    <ErrorState hint="No se pudo cargar el hábito. Intenta de nuevo." reset={reset} />
  );
}
