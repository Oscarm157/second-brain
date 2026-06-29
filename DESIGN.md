# DESIGN.md — Super-app de desarrollo personal

Dirección visual congelada para mantener consistencia entre módulos (Hábitos, Finanzas, y los que
vengan). Es una app in-app de datos personales, dark y gamificada tipo HabitKit. El "wow" lo dan
los heatmaps de colores, los números display grandes y la recompensa al completar, no la decoración.

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
Dark, vivo, jugable pero legible. Pensado para TDAH: claridad instantánea, memoria visual externa
(el heatmap), recompensa inmediata al completar, y perdón al fallar. Nada de ruido gratuito.

## Paleta (roles semánticos)
- **Canvas / fondo:** `#141320` (deep). Banda/sección alterna: `#191826`.
- **Superficies:** card `#1f1e30`; elevada (surface-2) `#29273f`.
- **Bordes / líneas:** sutil `#322f4a`.
- **Texto:** primario `#f7f7ff`; secundario `#a5a3b8`; tenue `#6f6d82`. Nunca negro puro sobre dark.
- **Acento por hábito (el usuario elige uno al crear):** paleta curada de 8 —
  emerald `#34d399`, cyan `#22d3ee`, blue `#60a5fa`, violet `#a78bfa`, pink `#f472b6`,
  orange `#fb923c`, amber `#fbbf24`, lime `#a3e635`. El heatmap de ese hábito usa intensidades de SU
  color (de tenue sobre canvas a saturado al 100%). Un hábito = un color estable en toda la app.
- **Racha / fuego:** naranja-ámbar cálido `#ff7a1a`.
- **XP / nivel / recompensa:** neón `#a6ff00` (solo para XP, nivel y celebración; no como fondo grande).
- **Semánticos finanzas (preservar, solo dinero):** ingreso verde `#34d399`, gasto rojo `#fb7185`,
  aviso ámbar `#fbbf24`, alerta `#f43f5e`. Adaptados a contraste sobre dark. Verde solo dinero que
  entra; rojo solo gasto/alerta real.

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
- **Navegación:** sidebar fija oscura, agrupada por secciones (Desarrollo personal / Finanzas), con
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
- Dark consistente; no romper con fondos claros. Nunca negro puro (#000) ni texto negro puro.
- Color con disciplina: cada hábito su color; neón solo para XP/recompensa; verde/rojo solo dinero.
- Sin gradientes morados genéricos de slop, sin sombras pesadas, sin cards anidadas en exceso.
- Copy factual en español, sin AI-slop, sin frases huecas, sin em-dashes.
- Claridad de un vistazo por encima de densidad. Cada vista nace con loading / empty / error.
- Persistir todo en DB; nada que se pierda al recargar (clave TDAH).

## Responsive
- Desktop: sidebar + grid de cards (2-3 col en hábitos, según ancho).
- Móvil: una columna; sidebar colapsa a barra superior; heatmaps a ancho completo; vista "Hoy" primero.

## Transición (sequencing)
El módulo Hábitos y el Hub nacen dark con estos tokens. Las pantallas de Finanzas siguen en su tema
actual hasta el paso de propagación (retheme dark global), que preserva verde/rojo semánticos. Durante
el piloto puede haber convivencia temporal claro/oscuro: es secuencia, no el estado final (todo dark).
