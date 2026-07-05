"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  Landmark,
  Tags,
  SlidersHorizontal,
  Flame,
  Home,
  ListChecks,
  Code2,
  LogOut,
  MoreHorizontal,
  X,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home };
type NavSection = { title?: string; items: NavItem[] };

const sections: NavSection[] = [
  { items: [{ href: "/", label: "Inicio", icon: Home }] },
  {
    title: "Finanzas",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
      { href: "/scenarios", label: "Escenarios", icon: SlidersHorizontal },
      { href: "/import", label: "Importar", icon: Upload },
      { href: "/debts", label: "Deudas", icon: Landmark },
      { href: "/categories", label: "Categorías", icon: Tags },
    ],
  },
  {
    title: "Personal",
    items: [
      { href: "/habitos", label: "Hábitos", icon: Flame },
      { href: "/pendientes", label: "Pendientes", icon: ListChecks },
      { href: "/codigo", label: "Código", icon: Code2 },
    ],
  },
];

// Tab bar móvil, derivada de `sections` (fuente única): Inicio + Personal abajo,
// Finanzas en el sheet "Más". El label de Finanzas en la barra sale de su primer item.
const finanzasItems = sections.find((s) => s.title === "Finanzas")?.items ?? [];
const personalItems = sections.find((s) => s.title === "Personal")?.items ?? [];
const mobilePrimary: NavItem[] = [sections[0].items[0], ...personalItems];
const mobileMore: NavItem[] = finanzasItems;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {sections.map((section, i) => (
        <div key={i} className={cn(i > 0 && "mt-5")}>
          {section.title ? (
            <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">
              {section.title}
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-brand"
                      : "text-ink hover:bg-surface hover:text-navy",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-card lg:flex">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-7 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-white">
            SB
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-navy">
            Second Brain
          </span>
        </Link>
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-3">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center justify-between gap-2 px-3 pb-1.5">
            <span className="text-xs text-faint">Sesión</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-1">
            <span className="truncate text-sm font-medium text-navy">{name}</span>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink transition-colors hover:bg-surface hover:text-alert"
              >
                <LogOut className="size-3.5" strokeWidth={1.8} />
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Móvil: barra superior slim + bottom tab bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
            SB
          </span>
          <span className="font-display text-base font-bold tracking-tight text-navy">
            Second Brain
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs text-ink transition-colors hover:text-alert"
            >
              <LogOut className="size-4" strokeWidth={1.8} />
              Salir
            </button>
          </form>
        </div>
      </div>

      <MobileTabBar pathname={pathname} />
    </>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = mobileMore.some((it) => isActive(pathname, it.href));

  return (
    <>
      {/* Sheet "Más": resto de Finanzas */}
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-card pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-faint">
                Finanzas
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex size-9 items-center justify-center rounded-md text-ink hover:bg-surface hover:text-navy"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-5">
              {mobileMore.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors",
                      active
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line text-ink hover:bg-surface hover:text-navy",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Bottom tab bar fija */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobilePrimary.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-brand" : "text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5" strokeWidth={active ? 2.3 : 1.8} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
            moreActive || moreOpen ? "text-brand" : "text-ink",
          )}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal className="size-5" strokeWidth={moreActive || moreOpen ? 2.3 : 1.8} />
          Más
        </button>
      </nav>
    </>
  );
}
