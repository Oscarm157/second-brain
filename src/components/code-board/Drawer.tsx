"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
      />
      <aside
        className="relative flex h-full w-full max-w-xl flex-col border-l border-[var(--h-border)] shadow-2xl"
        style={{ background: "var(--h-canvas-alt)", color: "var(--h-text)" }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--h-border)] px-6 py-4">
          <div className="min-w-0">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--h-text-secondary)] transition-colors hover:bg-[var(--h-surface-2)] hover:text-[var(--h-text)]"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}
