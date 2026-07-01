"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { saveDebt } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { error: string } | { ok: true } | null;

export type DebtFormValues = {
  id: string;
  kind: string | null;
  counterparty: string;
  principal: number;
  balance: number;
  monthlyPayment: number | null;
  paymentDay: number | null;
  interestRate: number | null;
  termMonths: number | null;
  startDate: string | null;
  dueDate: string | null;
  description: string | null;
};

const KINDS = [
  { value: "prestamo", label: "Préstamo" },
  { value: "tarjeta", label: "Tarjeta de crédito" },
  { value: "persona", label: "Persona" },
  { value: "otro", label: "Otro" },
];

const inputCls =
  "h-9 w-full rounded-md border border-line bg-card px-2 text-sm text-navy outline-none focus-visible:border-brand";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-ink">{label}</span>
      {children}
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function DebtForm({
  debt,
  onDone,
}: {
  debt?: DebtFormValues;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const editing = !!debt;
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await saveDebt(formData)) ?? { ok: true },
    null,
  );

  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      toast.error(state.error);
      return;
    }
    toast.success(editing ? "Deuda actualizada." : "Deuda agregada.");
    if (!editing) formRef.current?.reset();
    onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {editing && <input type="hidden" name="id" value={debt.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="A quién le debes">
          <Input
            name="counterparty"
            defaultValue={debt?.counterparty}
            placeholder="Ej. BBVA, Fundación Rafael Donde, Juan"
            maxLength={80}
            required
          />
        </Field>
        <Field label="Tipo">
          <select name="kind" defaultValue={debt?.kind ?? "prestamo"} className={inputCls}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Monto original" hint="El total de la deuda completa.">
          <Input
            name="principal"
            type="number"
            step="0.01"
            min="0"
            defaultValue={debt?.principal}
            placeholder="0.00"
            required
          />
        </Field>
        <Field label="Saldo que debes hoy" hint="Lo ya pagado antes se calcula solo.">
          <Input
            name="balance"
            type="number"
            step="0.01"
            min="0"
            defaultValue={debt?.balance}
            placeholder="0.00"
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Pago mensual">
          <Input
            name="monthlyPayment"
            type="number"
            step="0.01"
            min="0"
            defaultValue={debt?.monthlyPayment ?? ""}
            placeholder="0.00"
          />
        </Field>
        <Field label="Día de pago" hint="Del 1 al 31.">
          <Input
            name="paymentDay"
            type="number"
            min="1"
            max="31"
            defaultValue={debt?.paymentDay ?? ""}
            placeholder="Ej. 5"
          />
        </Field>
        <Field label="Tasa de interés (%)">
          <Input
            name="interestRate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={debt?.interestRate ?? ""}
            placeholder="Ej. 24"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Plazo (meses)">
          <Input
            name="termMonths"
            type="number"
            min="1"
            defaultValue={debt?.termMonths ?? ""}
            placeholder="Ej. 48"
          />
        </Field>
        <Field label="Fecha de inicio">
          <Input name="startDate" type="date" defaultValue={debt?.startDate ?? ""} className={inputCls} />
        </Field>
        <Field label="Fecha límite">
          <Input name="dueDate" type="date" defaultValue={debt?.dueDate ?? ""} className={inputCls} />
        </Field>
      </div>

      <Field label="Notas (opcional)">
        <textarea
          name="description"
          defaultValue={debt?.description ?? ""}
          maxLength={500}
          rows={2}
          className="w-full rounded-md border border-line bg-card px-2 py-1.5 text-sm text-navy outline-none focus-visible:border-brand"
          placeholder="Detalle, número de cuenta, condiciones..."
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : editing ? "Guardar cambios" : "Agregar deuda"}
      </Button>
    </form>
  );
}
