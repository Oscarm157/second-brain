"use client";

import { ErrorState } from "@/components/states";

export default function DebtsError({ reset }: { reset: () => void }) {
  return <ErrorState hint="No se pudieron cargar tus deudas. Intenta de nuevo." reset={reset} />;
}
