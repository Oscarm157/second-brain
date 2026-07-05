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
  streak_14: "💪",
  streak_30: "⚡",
  streak_100: "💯",
  perfect_week: "🏆",
  century: "🎯",
};

export function AchievementsStrip({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-faint">
        Logros
      </h2>
      <div className="flex flex-wrap gap-3">
        {achievements.map((a) => (
          <div
            key={a.key}
            className="flex items-center gap-2.5 rounded-md bg-secondary px-3 py-2.5"
            style={{ opacity: a.unlocked ? 1 : 0.45 }}
            title={a.desc}
          >
            <span className="text-xl">{ICONS[a.key] ?? "🏅"}</span>
            <div>
              <p className="text-sm font-semibold text-navy">{a.label}</p>
              <p className="text-xs text-faint">{a.desc}</p>
            </div>
            {a.unlocked && (
              <span
                className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-brand"
                style={{ background: "color-mix(in srgb, var(--brand) 13%, transparent)" }}
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
