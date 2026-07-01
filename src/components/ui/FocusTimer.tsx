"use client";

import { useEffect, useState, useTransition } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";

const SESSION = 1500; // 25:00 en segundos

function fmtClock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtTotal(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function FocusTimer({
  focusSeconds,
  onLog,
}: {
  focusSeconds: number;
  onLog: (seconds: number) => Promise<void>;
}) {
  const [remaining, setRemaining] = useState(SESSION);
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();

  const elapsed = SESSION - remaining;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Al agotar la cuenta de forma natural: registra la sesión completa.
  useEffect(() => {
    if (remaining > 0) return;
    setRunning(false);
    setRemaining(SESSION);
    startTransition(async () => {
      await onLog(SESSION);
    });
  }, [remaining, onLog]);

  function toggle() {
    if (remaining <= 0) return;
    setRunning((r) => !r);
  }

  // Detener: registra el tiempo corrido real y vuelve a 25:00.
  function stop() {
    setRunning(false);
    setRemaining(SESSION);
    if (elapsed <= 0) return;
    startTransition(async () => {
      await onLog(elapsed);
    });
  }

  // Reiniciar: descarta la sesión en curso sin registrarla.
  function reset() {
    setRunning(false);
    setRemaining(SESSION);
  }

  return (
    <div className="rounded-lg border border-line bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Enfoque</p>
          <p className="mt-0.5 text-xs text-ink">{fmtTotal(focusSeconds)} de enfoque</p>
        </div>
        <span
          className={`font-display text-4xl font-bold tracking-tight tabular-nums ${
            running ? "text-brand" : "text-navy"
          }`}
        >
          {fmtClock(remaining)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={remaining <= 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pausar" : elapsed > 0 ? "Reanudar" : "Iniciar"}
        </button>
        <button
          onClick={stop}
          disabled={elapsed <= 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:text-navy disabled:opacity-50"
        >
          <Square className="size-3.5" /> Detener
        </button>
        <button
          onClick={reset}
          disabled={elapsed <= 0}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-faint transition-colors hover:text-ink disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" /> Reiniciar
        </button>
      </div>
    </div>
  );
}
