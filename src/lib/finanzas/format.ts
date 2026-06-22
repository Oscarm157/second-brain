const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function money(value: number) {
  return mxn.format(value);
}

const dayMonth = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

// Las fechas vienen 'YYYY-MM-DD'; se parsean a mano para no recorrer husos.
export function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return dayMonth.format(new Date(y, m - 1, d));
}

export function period(start: string, end: string) {
  return `${shortDate(start)} al ${shortDate(end)}`;
}

export type DetailField = { label: string; value: string };

// Desglosa el detalle SPEI corrido del estado de cuenta de Nu en campos legibles.
export function parseDetail(raw: string | null): DetailField[] {
  if (!raw) return [];
  const out: DetailField[] = [];
  const add = (label: string, value?: string | null) => {
    if (value) out.push({ label, value: value.trim() });
  };

  add("Tipo", raw.match(/^(Dep[óo]sito SPEI|Transferencia SPEI)/i)?.[1]);
  add("Hora", raw.match(/Hora:\s*([\d:]+)/i)?.[1]);

  const recibido = raw.match(/Recibido de\s+([^.]+?)\./i)?.[1];
  const enviado = raw.match(/Enviado a\s+([^.]+?)\./i)?.[1];
  if (recibido) add("Recibido de", recibido);
  if (enviado) add("Enviado a", enviado);

  add("Cliente", raw.match(/(?:Al cliente|Del cliente)\s+(.+?)\s*\(Dato no verificado/i)?.[1]);
  add("Concepto", raw.match(/por concepto\s+(.+?)\.\s*(?:A la cuenta|De la cuenta)/i)?.[1]);
  add(
    "Cuenta",
    raw.match(/(?:A la cuenta|De la cuenta)\s+(\d+)\s+(?:clabe|debit-card|debit card)/i)?.[1],
  );
  add("Clave de rastreo", raw.match(/Clave de rastreo\s+(\w+)/i)?.[1]);
  add("Clave de referencia", raw.match(/Clave de referencia\s+(\d+)/i)?.[1]);

  const fxRate = raw.match(/USD\s+1\.00\s*=\s*MXN\s+([\d.]+)/i)?.[1];
  if (fxRate) add("Tipo de cambio", `1 USD = ${fxRate} MXN`);

  return out;
}
