"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/**
 * Tema de la app: light por default, dark por switch. Pone/quita `.dark` en
 * <html>; la preferencia persiste en localStorage. Ignora la preferencia del SO
 * a propósito (Oscar: principal tema light).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
