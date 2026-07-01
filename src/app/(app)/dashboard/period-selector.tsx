"use client";

import { useRouter } from "next/navigation";

import { period } from "@/lib/finanzas/format";

type Item = { id: string; periodStart: string; periodEnd: string };

export function PeriodSelector({
  statements,
  current,
  basePath = "/dashboard",
}: {
  statements: Item[];
  current: string;
  basePath?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) => router.push(`${basePath}?statement=${e.target.value}`)}
      aria-label="Periodo"
      className="h-9 rounded-md border border-line bg-card px-3 text-sm font-medium text-navy outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      {statements.map((s) => (
        <option key={s.id} value={s.id}>
          {period(s.periodStart, s.periodEnd)}
        </option>
      ))}
    </select>
  );
}
