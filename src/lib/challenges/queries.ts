import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { CHALLENGES } from "@/lib/challenges/catalog";
import { computeChallengeProgress } from "@/lib/challenges/progress";
import { computeGamification } from "@/lib/challenges/gamification";
import type {
  ChallengeView,
  ChallengesData,
  LeaderboardEntry,
  ParticipantRow,
} from "@/lib/challenges/types";

const LEADERBOARD_SIZE = 10;

// Assembles the challenges page: the fixed catalog, the current user's
// participation + live progress, per-challenge leaderboards (from the shared
// snapshot), and the derived gamification summary.
export async function getChallengesData(): Promise<ChallengesData> {
  const analytics = await getAnalyticsData();
  const today = analytics.today;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let all: ParticipantRow[] = [];
  if (user) {
    const { data } = await supabase
      .from("challenge_participants")
      .select("*")
      .order("progress_pct", { ascending: false });
    all = (data ?? []) as ParticipantRow[];
  }

  const byChallenge = new Map<string, ParticipantRow[]>();
  for (const row of all) {
    const list = byChallenge.get(row.challenge_key) ?? [];
    list.push(row);
    byChallenge.set(row.challenge_key, list);
  }

  const myCompleted = all.filter((r) => r.user_id === user?.id && r.completed).length;

  const challenges: ChallengeView[] = CHALLENGES.map((def) => {
    const participants = byChallenge.get(def.key) ?? [];
    const mine = participants.find((p) => p.user_id === user?.id) ?? null;

    // Rank by stored snapshot (completed first, then pct, then earliest finish).
    const ranked = [...participants].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? -1 : 1;
      if (b.progress_pct !== a.progress_pct) return b.progress_pct - a.progress_pct;
      return (a.completed_at ?? "").localeCompare(b.completed_at ?? "");
    });

    const leaderboard: LeaderboardEntry[] = ranked
      .slice(0, LEADERBOARD_SIZE)
      .map((p, i) => ({
        displayName: p.display_name,
        progressPct: p.progress_pct,
        progressValue: p.progress_value,
        completed: p.completed,
        isMe: p.user_id === user?.id,
        rank: i + 1,
      }));

    return {
      def,
      joined: mine !== null,
      startDate: mine?.start_date ?? null,
      // Live progress for the current user (accurate to their latest logs).
      progress: mine ? computeChallengeProgress(def, mine.start_date, today, analytics) : null,
      participantCount: participants.length,
      leaderboard,
    };
  });

  return {
    today,
    challenges,
    gamification: computeGamification(analytics, myCompleted),
  };
}
