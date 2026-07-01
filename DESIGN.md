# DESIGN.md — Second Brain

Dirección visual congelada para mantener consistencia entre módulos (Hábitos, Finanzas, y los que
vengan). Es una app in-app de datos personales, gamificada tipo HabitKit. El "wow" lo dan los heatmaps
de colores, los números display grandes y la recompensa al completar, no la decoración.

## Sistema de dos modos (light por default, dark por switch)
La app es **light como tema principal** y trae un switch a **dark** que conmuta toda la app (incluido
finanzas). Reglas:
- Una sola fuente de verdad: **tokens CSS** en `globals.css`. `:root` = valores light; `.dark` = override
  dark. La clase `.dark` vive en `<html>` y la maneja `next-themes` (default light, ignora el SO).
- **Nada de hex crudo en componentes.** Toda superficie/texto/borde sale de un token, para que el switch
  funcione solo. Los colores por hábito (8) son dato en DB y se usan como relleno o con alpha (heatmap),
  así que no necesitan variante por tema.
- El **heatmap es agnóstico de tema** por construcción: `rgba(color, 0.08→1)` sobre el canvas. Sobre
  canvas claro da el look "contribuciones de GitHub" en claro; sobre canvas oscuro, el look HabitKit.
- Roles que divergen en dark: el azul de marca y los semánticos de dinero se aclaran/saturan para
  contraste; el relleno de énfasis usa `primary`/`foreground`, nunca el token de texto.

## Referencias (reference lock)
- **Light (base) — superficies y densidad:** dashboards finanzas/productividad light tipo *Runey*
  (`runey.app`, canvas off-white cálido, cards blancas con borde hairline, un acento por superficie).
- **Light — heatmap:** *contribuciones de GitHub en claro* (celda vacía gris muy clara, intensidad creciente
  en el color del hábito).
- **Dark (alterno) — se preserva el lock original:** Superlist (superficies), Stryds (números display +
  neón de acción), Duolingo (estructura de gamificación), HabitKit (heatmap por color).

## Reference lock (de Refero)
- **Base / shell / superficies (primaria): Superlist** (`superlist.com`) — canvas violeta-negro
  profundo, cards charcoal con esquinas generosas (20px), botones pill, texto blanco de alto
  contraste, headings condensados + cuerpo Inter. Un solo acento por superficie, color reservado.
- **Energía gamificada (rachas, XP, recompensa): Stryds** (`stryds.com`) — números display enormes
  estilo "command center" con tracking negativo, un acento neón vivo para acción/estado activo,
  superficies oscuras con radios grandes.
- **Estructura de gamificación: Duolingo** (pantallas) — racha prominente con fuego, barra/contador
  de XP, fila de logros (badges), grid de stats. Patrón, no estética (Duolingo es claro; aquí dark).
- **Movimiento memorable (lo distintivo): HabitKit** — cada hábito es una card con SU propio color, y
  un **heatmap tipo contribuciones de GitHub** en intensidades de ese color. Ese es el corazón visual.

No promediar: la base es Superlist (mood + densidad + superficies). De Stryds solo el tratamiento de
números display y el neón de acción. De Duolingo solo la estructura de gamificación.

## Tema y atmósfera
Light es el default de sesión nueva; dark se activa por switch y persiste en localStorage. Ambos modos
usan los mismos tokens, con los overrides de la sección Paleta. Pensado para TDAH en ambos modos:
claridad instantánea, memoria visual externa (el heatmap), recompensa inmediata al completar, perdón al
fallar. Nada de ruido gratuito.

## Paleta (roles semánticos · light / dark)
Los nombres son roles de token; el valor cambia por modo. `light` es el default.
- **Canvas / fondo:** light `#ffffff` (banda alterna `#f6f8fb`) · dark `#141320` (alterna `#191826`).
- **Canvas gamificado (full-bleed `--h-canvas`):** light `#f6f7f9` · dark `#141320`.
- **Superficies (card):** light `#ffffff`; elevada `#f6f8fb` · dark `#1f1e30`; elevada `#29273f`.
- **Bordes / líneas:** light `#e7ecf4` · dark `#322f4a`.
- **Texto:** primario light `#16203a` / dark `#f7f7ff`; secundario `#5b6678` / `#a5a3b8`; tenue
  `#8a94a6` / `#6f6d82`. Nunca negro ni blanco puro.
- **Marca (azul, con disciplina):** light `#2456e6` · dark `#5b8cff` (más claro para contraste).
- **Acento por hábito (8, el usuario elige al crear):** mismos valores en ambos modos (son dato en DB):
  emerald `#34d399`, cyan `#22d3ee`, blue `#60a5fa`, violet `#a78bfa`, pink `#f472b6`, orange `#fb923c`,
  amber `#fbbf24`, lime `#a3e635`. El heatmap usa intensidades de SU color vía alpha sobre el canvas.
- **Racha / fuego (`--h-streak`):** light `#e2620a` · dark `#ff7a1a`.
- **XP / nivel / recompensa (`--h-xp`):** light lime profundo `#5a9e0e` (legible en claro) · dark neón
  `#a6ff00`. Solo para XP, nivel y celebración; no como fondo grande.
- **Semánticos finanzas (solo dinero):** ingreso verde light `#0f9d58` / dark `#34d399`; gasto rojo
  `#e85d2f` / `#fb7185`; aviso ámbar `#e8a33d` / `#fbbf24`; alerta `#d23f3f` / `#f43f5e`. Verde solo
  dinero que entra; rojo solo gasto/alerta real.

## Tipografía
- **Display / títulos / números grandes:** Space Grotesk, `tracking-tight`, escala grande para
  titulares, montos, contadores de racha y XP. Estilo "command center" en los números de gamificación.
- **Cuerpo / etiquetas:** Inter. Etiquetas tenues en mayúscula corta.
- **Números (tabulares):** `tabular-nums` para que rachas, montos y XP alineen.

## Componentes
- **Botones:** primario = pill con relleno de acento (en hábitos, el color del hábito o el neón XP);
  secundario = outline sobre superficie elevada; ghost para acciones menores. Radio pill (9999px).
- **Cards:** superficie `#1f1e30`, radio 20px, borde sutil, padding generoso. Sin tarjeta-dentro-de-
  tarjeta-dentro-de-tarjeta. Card de hábito = nombre + icono + color propio + heatmap + racha 🔥 + target.
- **Heatmap:** grid de celdas redondeadas (~5px), gap pequeño; intensidad por count del día en el color
  del hábito; días futuros y vacíos en superficie tenue. Es el elemento protagonista.
- **Vista "Hoy":** lista compacta de lo pendiente HOY, completar de un toque (checkbox grande / tap en
  card). Anti-overwhelm: muestra solo lo de hoy, no el catálogo completo.
- **Gamificación:** barra de XP con nivel (relleno neón), racha con fuego, fila de logros (badges
  desbloqueados vs bloqueados). Números display grandes.
- **Inputs / formularios:** fondo superficie, borde sutil, foco con anillo de acento; picker de color
  e icono al crear hábito.
- **Navegación:** sidebar fija oscura, agrupada por secciones (Finanzas / Personal), con
  link al Hub arriba; ruta activa marcada con el acento.

## Layout y espaciado
- Sidebar oscura izquierda + contenido a la derecha, buen aire.
- **Hub:** saludo + fecha → resumen del día (hábitos X/N + racha, snapshot finanzas) → grid de cards de
  módulos (Hábitos, Finanzas, y placeholders "próximamente" del roadmap). Diseñado para crecer a ~6.
- **Hábitos:** vista "Hoy" arriba → barra XP/nivel → grid de cards de hábito con heatmap → fila de logros.
- Densidad aireada; el heatmap respira.

## Motion
- Solo **Motion** (`motion/react`). Micro-recompensa al completar un hábito: pop/escala del check + el
  día se "prende" en el heatmap (transición de color). Entradas suaves de cards al montar; números de
  racha/XP que cuentan hacia su valor. Con propósito, respetando `prefers-reduced-motion`. Nada gratuito.

## Guardrails (qué NO hacer)
- Todo color sale de un token; nada de hex crudo en componentes (rompería el switch). Nunca negro
  (#000) ni blanco puro como texto.
- Color con disciplina: cada hábito su color; neón/lime solo para XP/recompensa; verde/rojo solo dinero.
- Sin gradientes morados genéricos de slop, sin sombras pesadas, sin cards anidadas en exceso.
- Copy factual en español, sin AI-slop, sin frases huecas, sin em-dashes.
- Claridad de un vistazo por encima de densidad. Cada vista nace con loading / empty / error.
- Persistir todo en DB; nada que se pierda al recargar (clave TDAH).

## Responsive
- Desktop: sidebar + grid de cards (2-3 col en hábitos, según ancho).
- Móvil: una columna; sidebar colapsa a barra superior; heatmaps a ancho completo; vista "Hoy" primero.

## Switch de tema
- `next-themes` (`attribute="class"`, `defaultTheme="light"`, sin `enableSystem`) pone/quita `.dark` en
  `<html>`. La preferencia persiste en localStorage. Toggle sol/luna en el Sidebar.
- Toda pantalla, incluida finanzas, conmuta con un solo click. El default en sesión nueva es light.
