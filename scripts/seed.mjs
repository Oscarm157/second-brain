import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

// Crea un usuario admin inicial + categorías por defecto + cuenta Nu. Idempotente.
// Hash compatible con src/lib/auth.ts: pbkdf2$iter$saltB64$hashB64 (SHA-256, 32 bytes).
const sql = neon(process.env.DATABASE_URL);

function hashPassword(pw) {
  const iter = 100_000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(pw, salt, iter, 32, "sha256");
  return `pbkdf2$${iter}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");

let userId;
const existing = await sql`select id from users where email = ${email}`;
if (existing.length) {
  userId = existing[0].id;
  console.log(`Ya existe ${email}.`);
} else {
  const rows = await sql`
    insert into users (email, name, password_hash, role, must_change_password)
    values (${email}, 'Oscar', ${hashPassword(password)}, 'admin', true)
    returning id
  `;
  userId = rows[0].id;
  console.log(`Admin creado: ${email} / ${password}`);
  console.log("Cámbiala en el primer inicio de sesión.");
}

// Categorías por defecto. Un color estable por categoría (ver DESIGN.md).
const CATEGORIES = [
  { name: "Comida y restaurantes", kind: "expense", color: "#e8694a", icon: "utensils" },
  { name: "Súper y abarrotes", kind: "expense", color: "#0f9d58", icon: "shopping-cart" },
  { name: "Transporte y gasolina", kind: "expense", color: "#2456e6", icon: "car" },
  { name: "Servicios", kind: "expense", color: "#0fa3a3", icon: "plug" },
  { name: "Suscripciones", kind: "expense", color: "#7a5af0", icon: "repeat" },
  { name: "Salud y farmacia", kind: "expense", color: "#d4548a", icon: "heart-pulse" },
  { name: "Transferencias a personas", kind: "expense", color: "#64748b", icon: "users" },
  { name: "Donaciones", kind: "expense", color: "#e8a33d", icon: "hand-heart" },
  { name: "Entretenimiento", kind: "expense", color: "#7a5af0", icon: "party-popper" },
  { name: "Compras", kind: "expense", color: "#e8694a", icon: "bag" },
  { name: "Hogar", kind: "expense", color: "#0fa3a3", icon: "home" },
  { name: "Otros gastos", kind: "expense", color: "#8a94a6", icon: "circle" },
  { name: "Nómina e ingresos", kind: "income", color: "#0f9d58", icon: "wallet" },
  { name: "Depósitos recibidos", kind: "income", color: "#2456e6", icon: "arrow-down" },
  { name: "Reembolsos", kind: "income", color: "#0fa3a3", icon: "rotate-ccw" },
  { name: "Sin categoría", kind: "expense", color: "#cbd2dd", icon: "help-circle" },
  { name: "Omitido", kind: "expense", color: "#cbd2dd", icon: "eye-off" },
];

const existingCats = await sql`select name from categories where owner_id = ${userId}`;
const haveCats = new Set(existingCats.map((c) => c.name));
let added = 0;
for (const c of CATEGORIES) {
  if (haveCats.has(c.name)) continue;
  await sql`
    insert into categories (owner_id, name, kind, color, icon)
    values (${userId}, ${c.name}, ${c.kind}, ${c.color}, ${c.icon})
  `;
  added++;
}
// "Omitido" no cuenta en los totales (excludeFromFlow).
await sql`update categories set exclude_from_flow = true where owner_id = ${userId} and name = 'Omitido'`;
console.log(`Categorías: ${added} nuevas, ${haveCats.size} ya existían.`);

// Reglas base de categorización (comercios comunes en MX). El import las aplica
// antes de la IA, así auto-categoriza buena parte sin costo. `pattern` hace match
// por "contiene" sobre el nombre limpio del movimiento.
const RULES = [
  ["OXXO", "Súper y abarrotes"],
  ["RAPIMART", "Súper y abarrotes"],
  ["SORIANA", "Súper y abarrotes"],
  ["WALMART", "Súper y abarrotes"],
  ["CALIMAX", "Súper y abarrotes"],
  ["SMART", "Súper y abarrotes"],
  ["CAFFENIO", "Comida y restaurantes"],
  ["STARBUCKS", "Comida y restaurantes"],
  ["UBER EATS", "Comida y restaurantes"],
  ["RAPPI", "Comida y restaurantes"],
  ["DIDI FOOD", "Comida y restaurantes"],
  ["TAP ROOM", "Comida y restaurantes"],
  ["BAR", "Comida y restaurantes"],
  ["UBER RIDES", "Transporte y gasolina"],
  ["UBER", "Transporte y gasolina"],
  ["DIDI", "Transporte y gasolina"],
  ["CAR WASH", "Transporte y gasolina"],
  ["ESTA SERV", "Transporte y gasolina"],
  ["GASOLIN", "Transporte y gasolina"],
  ["AUTOZONE", "Transporte y gasolina"],
  ["TELCEL", "Servicios"],
  ["CFE", "Servicios"],
  ["IZZI", "Servicios"],
  ["TELMEX", "Servicios"],
  ["TOTALPLAY", "Servicios"],
  ["VERCEL", "Suscripciones"],
  ["ELEVENLABS", "Suscripciones"],
  ["OPENAI", "Suscripciones"],
  ["NETFLIX", "Suscripciones"],
  ["SPOTIFY", "Suscripciones"],
  ["GOOGLE", "Suscripciones"],
  ["APPLE", "Suscripciones"],
  ["ANTHROPIC", "Suscripciones"],
  ["FARM", "Salud y farmacia"],
  ["FARMACIA", "Salud y farmacia"],
  ["SIMILARES", "Salud y farmacia"],
  ["GUADALAJARA", "Salud y farmacia"],
  ["ZONKEYS", "Entretenimiento"],
  ["CINEPOLIS", "Entretenimiento"],
  ["FUNDACI", "Donaciones"],
  ["DONDE", "Donaciones"],
];
const existingRules = await sql`select pattern from category_rules where owner_id = ${userId}`;
const haveRules = new Set(existingRules.map((r) => r.pattern));
let addedRules = 0;
for (const [pattern, catName] of RULES) {
  if (haveRules.has(pattern)) continue;
  const cat = await sql`select id from categories where owner_id = ${userId} and name = ${catName}`;
  if (!cat.length) continue;
  await sql`
    insert into category_rules (owner_id, pattern, category_id, source)
    values (${userId}, ${pattern}, ${cat[0].id}, 'manual')
  `;
  addedRules++;
}
console.log(`Reglas base: ${addedRules} nuevas.`);

// Cuenta Nu por defecto.
const existingAcct = await sql`select id from accounts where owner_id = ${userId} and bank = 'nu'`;
if (!existingAcct.length) {
  await sql`
    insert into accounts (owner_id, name, bank, currency)
    values (${userId}, 'Nu', 'nu', 'MXN')
  `;
  console.log("Cuenta Nu creada.");
} else {
  console.log("Cuenta Nu ya existía.");
}
