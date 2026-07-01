export function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <span
      className="flex items-center gap-1 font-display text-sm font-bold tabular-nums"
      style={{ color: "var(--h-streak)" }}
    >
      🔥 {streak}
    </span>
  );
}
