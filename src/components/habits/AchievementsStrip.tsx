"use client";

type Achievement = {
  key: string;
  label: string;
  desc: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

const ICONS: Record<string, string> = {
  first_habit: "🌱",
  streak_7: "🔥",
  streak_30: "⚡",
  perfect_week: "🏆",
};

export function AchievementsStrip({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="rounded-2xl border border-[var(--h-border)] bg-[var(--h-surface)] p-5">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.14em] text-[var(--h-text-faint)]">
        Logros
      </h2>
      <div className="flex flex-wrap gap-3">
        {achievements.map((a) => (
          <div
            key={a.key}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{
              background: a.unlocked ? "var(--h-surface-2)" : "var(--h-canvas-alt)",
              opacity: a.unlocked ? 1 : 0.45,
            }}
            title={a.desc}
          >
            <span className="text-xl">{ICONS[a.key] ?? "🏅"}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--h-text)]">{a.label}</p>
              <p className="text-xs text-[var(--h-text-faint)]">{a.desc}</p>
            </div>
            {a.unlocked && (
              <span
                className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: "color-mix(in srgb, var(--h-xp) 13%, transparent)",
                  color: "var(--h-xp)",
                }}
              >
                ✓
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
