"use client";

import { motion, useReducedMotion } from "motion/react";

export function XpBar({
  xp,
  level,
  xpInLevel,
  xpToNext,
}: {
  xp: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
}) {
  const reduced = useReducedMotion();
  const pct = xpToNext > 0 ? Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] px-5 py-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--h-text-faint)]">
          Nivel
        </span>
        <span className="font-display text-4xl font-bold tabular-nums text-[var(--h-xp)]">
          {level}
        </span>
        <span className="ml-auto text-xs tabular-nums text-[var(--h-text-faint)]">
          {xpInLevel} / {xpToNext} XP
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--h-surface-2)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--h-xp)" }}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-[var(--h-text-faint)]">{xp} XP totales</p>
    </div>
  );
}
