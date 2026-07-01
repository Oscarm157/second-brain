"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { money } from "@/lib/finanzas/format";

export function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 850;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);

  return <span className="tabular-nums">{money(display)}</span>;
}

// Banda héroe: el Balance domina (display grande sobre navy). Ingresos y gastos
// se leen como las dos fuerzas que lo forman, con una barra de proporción
// entrada/salida. Saldo final queda como dato secundario.
export function KpiRow({
  ingresos,
  gastos,
  balance,
  saldoFinal,
}: {
  ingresos: number;
  gastos: number;
  balance: number;
  saldoFinal: number;
}) {
  const reduce = useReducedMotion();
  const flujo = ingresos + gastos;
  const inShare = flujo > 0 ? (ingresos / flujo) * 100 : 0;
  const positivo = balance >= 0;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-2xl bg-hero px-6 py-7 text-hero-foreground sm:px-8 sm:py-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-hero-foreground/45">
            Balance del periodo
          </span>
          <div
            className="mt-2 font-display text-4xl font-bold leading-none sm:text-5xl"
            style={{ color: positivo ? "var(--hero-positive)" : "var(--hero-negative)" }}
          >
            {!positivo && "-"}
            <CountUp value={Math.abs(balance)} />
          </div>
          <p className="mt-3 text-sm text-hero-foreground/55">
            Saldo final del periodo{" "}
            <span className="font-medium tabular-nums text-hero-foreground/85">
              {money(saldoFinal)}
            </span>
          </p>
        </div>

        <div className="lg:border-l lg:border-hero-foreground/10 lg:pl-12">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-hero-foreground/10">
            <motion.div
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${inShare}%` }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: "var(--hero-in)" }}
            />
            <div className="flex-1" style={{ backgroundColor: "var(--hero-out)" }} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-hero-foreground/45">
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--hero-positive)" }} />
                Entró
              </div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums">
                <CountUp value={ingresos} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-hero-foreground/45">
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--hero-out)" }} />
                Salió
              </div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums text-hero-foreground/90">
                <CountUp value={gastos} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
