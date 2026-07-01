export function Tile({
  label,
  value,
  sub,
  accent = "text-navy",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub ? <p className="mt-0.5 truncate text-xs text-faint">{sub}</p> : null}
    </div>
  );
}
