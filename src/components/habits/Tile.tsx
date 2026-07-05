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
    <div className="rounded-xl border border-line bg-card p-3 sm:p-4">
      <p className="text-[11px] uppercase tracking-wide text-faint sm:text-xs">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl ${accent}`}>{value}</p>
      {sub ? <p className="mt-0.5 truncate text-xs text-faint">{sub}</p> : null}
    </div>
  );
}
