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
  storageKey,
}: {
  focusSeconds: number;
  onLog: (seconds: number) => Promise<void>;
  storageKey: string;
}) {
  const [remaining, setRemaining] = useState(SESSION);
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();

  const elapsed = SESSION - remaining;

  // Persistencia: el reloj se ancla a un timestamp de fin (endsAt) para que un
  // refresh reconstruya el valor exacto en vez de volver a 25:00.
  function clearSaved() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }
  function saveRunning(rem: number) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running: true, endsAt: Date.now() + rem * 1000 }),
      );
    } catch {}
  }
  function savePaused(rem: number) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ running: false, remaining: rem }));
    } catch {}
  }

  // Restaurar al montar (en efecto, no en init perezoso, para no romper SSR).
  // Sincroniza estado desde localStorage: setState en efecto es intencional aquí.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let saved: { running?: boolean; endsAt?: number; remaining?: number } | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      saved = raw ? JSON.parse(raw) : null;
    } catch {}
    if (!saved) return;

    if (saved.running && typeof saved.endsAt === "number") {
      const rem = Math.round((saved.endsAt - Date.now()) / 1000);
      if (rem <= 0) {
        // Se completó estando fuera: registra la sesión y limpia.
        clearSaved();
        startTransition(async () => {
          await onLog(SESSION);
        });
      } else {
        setRemaining(rem);
        setRunning(true);
      }
    } else if (typeof saved.remaining === "number") {
      setRemaining(saved.remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    clearSaved();
    startTransition(async () => {
      await onLog(SESSION);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, onLog]);

  function toggle() {
    if (remaining <= 0) return;
    setRunning((r) => {
      const next = !r;
      if (next) saveRunning(remaining);
      else savePaused(remaining);
      return next;
    });
  }

  // Detener: registra el tiempo corrido real y vuelve a 25:00.
  function stop() {
    setRunning(false);
    setRemaining(SESSION);
    clearSaved();
    if (elapsed <= 0) return;
    startTransition(async () => {
      await onLog(elapsed);
    });
  }

  // Reiniciar: descarta la sesión en curso sin registrarla.
  function reset() {
    setRunning(false);
    setRemaining(SESSION);
    clearSaved();
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
