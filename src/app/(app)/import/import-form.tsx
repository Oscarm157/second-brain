"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { importStatement } from "./actions";
import { Button } from "@/components/ui/button";

type State = { error: string } | null;

export function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await importStatement(formData)) ?? null,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <label
        htmlFor="pdf"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center transition-colors hover:border-brand hover:bg-brand-soft"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-card text-brand">
          <FileUp className="size-5" strokeWidth={1.8} />
        </span>
        <span className="text-sm font-medium text-navy">
          {fileName ?? "Selecciona tu estado de cuenta"}
        </span>
        <span className="text-xs text-ink">PDF de Nu, un periodo mensual</span>
        <input
          id="pdf"
          name="pdf"
          type="file"
          accept="application/pdf"
          required
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Leyendo el PDF...
          </>
        ) : (
          "Importar estado de cuenta"
        )}
      </Button>
    </form>
  );
}
