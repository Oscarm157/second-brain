"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const allItems = sections.flatMap((s) => s.items);

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

      {/* Móvil: barra superior + nav horizontal */}
      <div className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
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
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink transition-colors hover:text-alert"
              >
                <LogOut className="size-3.5" strokeWidth={1.8} />
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {allItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
