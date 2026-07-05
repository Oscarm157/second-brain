import {
  Sparkles,
  Check,
  Dumbbell,
  BookOpen,
  Droplet,
  Moon,
  Brain,
  Heart,
  Coffee,
  Apple,
  Bike,
  Footprints,
  PenLine,
  Music,
  Leaf,
  Flame,
  Target,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { createElement, type CSSProperties } from "react";
import { HABIT_ICON_KEYS, type HabitIconKey } from "@/lib/habits/icon-keys";

const COMPONENTS: Record<HabitIconKey, LucideIcon> = {
  sparkles: Sparkles,
  check: Check,
  dumbbell: Dumbbell,
  book: BookOpen,
  water: Droplet,
  moon: Moon,
  brain: Brain,
  heart: Heart,
  coffee: Coffee,
  apple: Apple,
  bike: Bike,
  steps: Footprints,
  write: PenLine,
  music: Music,
  leaf: Leaf,
  flame: Flame,
  target: Target,
  sun: Sun,
};

/** Catálogo de iconos (key + componente). La `key` se guarda en DB (`habits.icon`). */
export const HABIT_ICONS = HABIT_ICON_KEYS.map((key) => ({ key, Icon: COMPONENTS[key] }));

const MAP = new Map<string, LucideIcon>(HABIT_ICONS.map((i) => [i.key, i.Icon]));

/** Pinta el icono del hábito por su key; cae a Sparkles si no existe. */
export function HabitIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const icon = MAP.get(name) ?? Sparkles;
  return createElement(icon, { className, style });
}
