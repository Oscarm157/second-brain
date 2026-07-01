import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getTodayHabits } from "@/lib/habits/data";
import { sendEmail } from "@/lib/email";

// Dispara a las 03:00 UTC (8pm Tijuana en horario de verano; 8pm queda 04:00 UTC
// en horario estándar, ~1h de drift en invierno: aceptable para un recordatorio).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const activeUsers = await db.select().from(users).where(eq(users.active, true));

  let sent = 0;
  for (const user of activeUsers) {
    const todayHabits = await getTodayHabits(user.id);
    const pending = todayHabits.filter((h) => !h.doneToday);
    if (pending.length === 0) continue;

    const items = pending.map((h) => `<li>${h.name}</li>`).join("");
    try {
      await sendEmail({
        to: user.email,
        subject: "Hábitos pendientes hoy",
        html: `<p>Todavía no marcas estos hábitos hoy:</p><ul>${items}</ul>`,
      });
      sent++;
    } catch (err) {
      console.error(`habit-reminder: fallo el envío a ${user.email}`, err);
    }
  }

  return NextResponse.json({ ok: true, checked: activeUsers.length, sent });
}
