import { Trophy, Flame, Dumbbell, CalendarCheck } from "lucide-react";
import { getChallengesData } from "@/lib/challenges/queries";
import { ChallengeCard } from "./challenge-card";
import { AchievementBadge } from "./achievement-badge";
import { ChallengeAutoSync } from "./auto-sync";

export const metadata = { title: "Challenges · ThriveDeck" };

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-xl font-semibold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function ChallengesPage() {
  const { challenges, gamification: g } = await getChallengesData();
  const joined = challenges.filter((c) => c.joined);
  const available = challenges.filter((c) => !c.joined);
  const unlocked = g.achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <ChallengeAutoSync />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Trophy className="h-6 w-6 text-primary" />
          Challenges
        </h1>
        <p className="mt-1 text-muted-foreground">
          Join a challenge, track it automatically from what you log, and climb the leaderboard.
        </p>
      </div>

      {/* Level / XP */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-3xl font-semibold leading-none">{g.level}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {g.xp.toLocaleString()} XP · {g.xpForNextLevel - g.xpIntoLevel} to level {g.level + 1}
          </p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${g.levelPct}%` }}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Flame className="h-5 w-5" />} value={`${g.currentStreak}`} label="Day streak" />
        <Stat icon={<CalendarCheck className="h-5 w-5" />} value={`${g.activeDays}`} label="Days logged" />
        <Stat icon={<Dumbbell className="h-5 w-5" />} value={`${g.totalWorkouts}`} label="Workouts" />
        <Stat icon={<Trophy className="h-5 w-5" />} value={`${g.completedChallenges}`} label="Challenges won" />
      </div>

      {/* Achievements */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Achievements · {unlocked}/{g.achievements.length}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {g.achievements.map((a) => (
            <AchievementBadge key={a.key} achievement={a} />
          ))}
        </div>
      </section>

      {/* My challenges */}
      {joined.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My challenges
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {joined.map((c) => (
              <ChallengeCard key={c.def.key} view={c} />
            ))}
          </div>
        </section>
      )}

      {/* Available */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {joined.length > 0 ? "More challenges" : "Join a challenge"}
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {available.map((c) => (
            <ChallengeCard key={c.def.key} view={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
