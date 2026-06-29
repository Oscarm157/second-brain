"use client";

import { ErrorState } from "@/components/states";

export default function HabitosError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      hint="No se pudieron cargar tus hábitos. Intenta de nuevo."
      reset={reset}
    />
  );
}
