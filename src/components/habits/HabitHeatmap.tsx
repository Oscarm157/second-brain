"use client";

import { motion, useReducedMotion } from "motion/react";
import type { GridCell } from "@/lib/habits/data";

function cellBackground(hex: string, intensity: 0 | 1 | 2 | 3 | 4): string {
  // Celda vacía: superficie neutra (token), para que se lea tanto en claro como en oscuro.
  if (intensity === 0) return "var(--h-surface-2)";
  const alphas: Record<number, number> = { 1: 0.25, 2: 0.5, 3: 0.75, 4: 1 };
  const a = alphas[intensity];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function HabitHeatmap({
  cells,
  color,
  justToggledDate,
}: {
  cells: GridCell[];
  color: string;
  justToggledDate?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className="grid grid-flow-col grid-rows-7 gap-[3px]"
      style={{ gridTemplateColumns: "repeat(17, 1fr)" }}
    >
      {cells.map((cell) => {
        const isToggled = cell.date === justToggledDate;
        return (
          <motion.div
            key={cell.date}
            className="aspect-square rounded-[3px]"
            style={{ background: cellBackground(color, cell.intensity) }}
            animate={isToggled && !reduced ? { scale: [1, 1.5, 1] } : {}}
            transition={{ duration: 0.3 }}
            title={cell.date}
          />
        );
      })}
    </div>
  );
}
