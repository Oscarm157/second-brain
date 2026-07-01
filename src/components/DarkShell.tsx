import type { ReactNode } from "react";

/**
 * Lienzo a sangre completa para los módulos gamificados (hub, Pendientes, Código).
 * Cancela el padding del layout para llenar el área de contenido. Usa los tokens
 * --h-* (light por default, dark cuando `.dark` está en <html>).
 */
export function DarkShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="-mx-4 -my-6 min-h-[calc(100dvh-3rem)] sm:-mx-6 lg:-mx-12 lg:-my-10"
      style={{ background: "var(--h-canvas)", color: "var(--h-text)" }}
    >
      <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </div>
    </div>
  );
}
