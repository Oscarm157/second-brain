"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // En SSR y primer render cliente resolvedTheme es undefined (no hay localStorage):
  // ambos rinden el estado light, sin mismatch. next-themes corrige tras montar.
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink transition-colors hover:bg-surface hover:text-navy",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-3.5" strokeWidth={1.8} />
      ) : (
        <Moon className="size-3.5" strokeWidth={1.8} />
      )}
      {isDark ? "Claro" : "Oscuro"}
    </button>
  );
}
