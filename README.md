# Second Brain

Super-app personal con cuatro módulos: Hábitos, Finanzas, Pendientes y Código, bajo un mismo hub y
la misma sesión. Construida sobre un starter design-agnóstico (auth, DB, seguridad, estados, CI).

## Módulos
- **Hábitos**: hábitos con color e icono propio, heatmap tipo contribuciones de GitHub, racha y XP.
- **Finanzas**: dashboard, movimientos, escenarios, importación, deudas y categorías.
- **Pendientes**: tablero kanban de tareas personales.
- **Código**: tablero kanban de desarrollo multi-repo (`/codigo`), donde Oscar y los agentes coordinan
  tareas y se dejan notas (ver `npm run kanban` más abajo).

Tema light/dark global (`next-themes`, default light) que conmuta toda la app con un solo switch.

## Stack
Next 16 (App Router) · React 19 · Tailwind v4 · TypeScript · Drizzle + Neon · Zod ·
Vercel Blob · Resend · Sentry · Vercel BotID · Playwright.

## Desarrollo local
1. `cp .env.example .env.local` y rellena al menos `DATABASE_URL` (Neon) y `AUTH_SECRET`
   (`openssl rand -base64 32`, mínimo 16 chars).
2. ```bash
   npm install
   npm run db:generate && npm run db:migrate   # crea las tablas en tu Neon
   npm run db:seed                              # crea un admin e imprime su contraseña temporal
   ```
3. `npm run dev`, entra a `/login` con el admin del seed y cámbiale la contraseña.

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y arranque de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera la migración SQL desde `src/lib/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones a la DB |
| `npm run db:push` | Sincroniza el schema sin migración (solo dev) |
| `npm run db:seed` | Crea el usuario admin inicial (idempotente) |
| `npm run kanban` | CLI del tablero de Código (`npm run kanban -- board`) |
| `npm run test:e2e` | Smoke de Playwright (captura el login) |

## Qué incluye la plomería
- **Auth**: sesión por cookie firmada (PBKDF2 + HMAC), `requireUser`/`requireRole`, login / logout /
  cambio de contraseña. `src/lib/auth.ts`, `src/lib/session.ts`.
- **Datos**: Drizzle + Neon (`src/lib/db.ts`, `src/lib/schema.ts`), migraciones y seed.
- **Seguridad por default**: security headers (`next.config.ts`), validación Zod de inputs
  (`src/lib/validate.ts`), guards en cada action/route, BotID en endpoints caros
  (`src/app/api/expensive`). Env validado en `src/lib/env.ts`.
- **Estados por default**: `Loading` / `Empty` / `ErrorState` (`src/components/states.tsx`).
- **Infra**: Sentry guardado por DSN, CI en GitHub Actions (tsc + lint + build), Playwright smoke.
- **Extras**: `lib/blob.ts` (subida de imágenes), `lib/email.ts` (Resend).

## Variables de entorno
- `DATABASE_URL` (requerida): Postgres/Neon.
- `AUTH_SECRET` (requerida): firma de sesiones, mínimo 16 chars.
- `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`: opcionales según lo que uses.
- `NEXT_PUBLIC_SENTRY_DSN`: opcional. Sin DSN, Sentry queda inerte (no rompe nada).

## Deploy (Vercel)
Proyecto `second-brain` en Vercel. Pon las env vars ahí; BotID y los security headers funcionan en
el deploy. Para subir source maps a Sentry, envuelve `next.config.ts` con `withSentryConfig` y agrega
`SENTRY_AUTH_TOKEN`.
