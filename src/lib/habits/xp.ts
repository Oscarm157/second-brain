export const XP_PER_COMPLETION = 10;

/** Compute level info from total accumulated XP.
 *  Level formula: level = floor(sqrt(totalXp / 100))
 *  xpForLevel(n) = n * n * 100
 *  xpInLevel: XP acumulada dentro del nivel actual.
 *  xpToNext: XP que cabe en este nivel (delta del nivel actual al siguiente).
 */
export function computeLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpToNext: number;
} {
  const level = Math.floor(Math.sqrt(totalXp / 100));
  const xpInLevel = totalXp - level * level * 100;
  const xpToNext = (level + 1) * (level + 1) * 100 - level * level * 100;
  return { level, xpInLevel, xpToNext };
}
