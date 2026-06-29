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
    <div className="rounded-2xl border border-[#322f4a] bg-[#1f1e30] px-5 py-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6d82]">
          Nivel
        </span>
        <span className="font-display text-4xl font-bold tabular-nums text-[#a6ff00]">
          {level}
        </span>
        <span className="ml-auto text-xs tabular-nums text-[#6f6d82]">
          {xpInLevel} / {xpToNext} XP
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#29273f]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "#a6ff00" }}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-[#6f6d82]">{xp} XP totales</p>
    </div>
  );
}
