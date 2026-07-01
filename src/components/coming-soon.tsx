import { Construction } from "lucide-react";

export function ComingSoon({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
        {title}
      </h1>
      <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface px-6 py-10">
        <span className="flex size-10 items-center justify-center rounded-lg bg-card text-brand">
          <Construction className="size-5" strokeWidth={1.8} />
        </span>
        <p className="text-sm font-medium text-navy">Próximamente</p>
        <p className="max-w-md text-sm text-ink">{hint}</p>
      </div>
    </div>
  );
}
