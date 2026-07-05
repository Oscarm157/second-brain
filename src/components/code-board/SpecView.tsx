"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Parte una línea por backticks: los tramos impares son `código` inline. */
function renderInline(text: string, keyBase: string) {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={`${keyBase}-${i}`}
        className="rounded bg-card px-1 py-0.5 font-mono text-[12px] text-brand"
      >
        {part}
      </code>
    ) : (
      <span key={`${keyBase}-${i}`}>{part}</span>
    ),
  );
}

/** Render ligero del spec/PRD: headings, viñetas y código inline. Sin HTML crudo. */
export function SpecView({ spec }: { spec: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(spec);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible: sin acción */
    }
  }

  const lines = spec.split(/\r?\n/);

  return (
    <div className="relative rounded-lg border border-line bg-secondary p-4 pr-11">
      <button
        onClick={copy}
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-card hover:text-navy"
        aria-label="Copiar spec"
        title="Copiar"
      >
        {copied ? <Check className="size-4 text-income" /> : <Copy className="size-4" />}
      </button>
      <div className="space-y-1 text-[13px] leading-relaxed text-navy">
        {lines.map((line, i) => {
          const bullet = line.match(/^(\s*)[-*•]\s+(.*)$/);
          const heading = /^#{1,3}\s+/.test(line) || (/:\s*$/.test(line) && line.length < 60);
          if (bullet) {
            return (
              <div key={i} className="flex gap-2">
                <span className="select-none text-brand">•</span>
                <span className="flex-1">{renderInline(bullet[2], `l${i}`)}</span>
              </div>
            );
          }
          if (heading && line.trim()) {
            return (
              <p key={i} className="pt-1 font-semibold text-navy">
                {renderInline(line.replace(/^#{1,3}\s+/, ""), `l${i}`)}
              </p>
            );
          }
          if (!line.trim()) return <div key={i} className="h-2" />;
          return (
            <p key={i} className="font-mono">
              {renderInline(line, `l${i}`)}
            </p>
          );
        })}
      </div>
    </div>
  );
}
