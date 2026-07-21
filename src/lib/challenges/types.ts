import type { ChallengeDef } from "@/lib/challenges/catalog";
import type { ChallengeProgress } from "@/lib/challenges/progress";
import type { GamificationSummary } from "@/lib/challenges/gamification";

// Shared-read participant row (leaderboards). Progress is a snapshot the owner
// writes back; display_name is snapshotted so we never read others' profiles.
export interface ParticipantRow {
  id: string;
  user_id: string;
  display_name: string;
  challenge_key: string;
  start_date: string;
  progress_value: number;
  progress_pct: number;
  completed: boolean;
  completed_at: string | null;
  joined_at: string;
}

export interface LeaderboardEntry {
  displayName: string;
  progressPct: number;
  progressValue: number;
  completed: boolean;
  isMe: boolean;
  rank: number;
}

// A challenge as shown on the page: its definition, whether the current user
// has joined, their live-computed progress, and the standings.
export interface ChallengeView {
  def: ChallengeDef;
  joined: boolean;
  startDate: string | null;
  progress: ChallengeProgress | null; // live, for the current user
  participantCount: number;
  leaderboard: LeaderboardEntry[];
}

export interface ChallengesData {
  today: string;
  challenges: ChallengeView[];
  gamification: GamificationSummary;
}
