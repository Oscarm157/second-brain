import { cn } from "@/lib/utils";

const LABELS: Record<string, { label: string; token?: string; text: string }> = {
  ready: { label: "Listo", token: "--income", text: "text-income" },
  review: { label: "En revisión", token: "--warn", text: "text-warn" },
  parsing: { label: "Procesando", text: "text-ink" },
  error: { label: "Con error", token: "--alert", text: "text-alert" },
};

export function StatusChip({ status }: { status: string }) {
  const s = LABELS[status] ?? { label: status, text: "text-ink" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.text,
        !s.token && "bg-surface",
      )}
      style={
        s.token
          ? { backgroundColor: `color-mix(in srgb, var(${s.token}) 16%, transparent)` }
          : undefined
      }
    >
      {s.label}
    </span>
  );
}
