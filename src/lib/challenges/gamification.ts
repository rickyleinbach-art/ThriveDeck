import type { AnalyticsData } from "@/lib/analytics/types";
import { addDays, toDay } from "@/lib/analytics/ranges";

// Gamification (PRD § Gamification). Everything is derived at read time from
// what the user logged plus how many challenges they've completed — no XP is
// stored, so it can never drift from reality. XP rewards showing up: logged
// days, workouts, and finished challenges.

const XP_PER_ACTIVE_DAY = 10;
const XP_PER_WORKOUT = 25;
const XP_PER_CHALLENGE = 200;

// Cumulative XP required to reach a level: 250·(L−1)². Level 1 = 0 XP,
// L2 = 250, L3 = 1000, L4 = 2250 … a gentle quadratic curve.
function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 250)) + 1;
}
function xpForLevel(level: number): number {
  return 250 * (level - 1) ** 2;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string; // lucide name
  unlocked: boolean;
}

export interface GamificationSummary {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelPct: number; // 0–100 toward next level
  activeDays: number;
  currentStreak: number;
  totalWorkouts: number;
  completedChallenges: number;
  achievements: Achievement[];
}

// Distinct days with anything logged, and the current run ending today.
function activity(data: AnalyticsData): { activeDays: number; currentStreak: number } {
  const present = new Set<string>();
  for (const points of Object.values(data.series)) {
    for (const p of points ?? []) present.add(toDay(p.date));
  }
  let streak = 0;
  for (let i = 0; ; i++) {
    if (present.has(addDays(data.today, -i))) streak++;
    else break;
  }
  return { activeDays: present.size, currentStreak: streak };
}

export function computeGamification(
  data: AnalyticsData,
  completedChallenges: number
): GamificationSummary {
  const { activeDays, currentStreak } = activity(data);
  const totalWorkouts = (data.series.workouts ?? []).reduce((n, p) => n + p.value, 0);

  const xp =
    activeDays * XP_PER_ACTIVE_DAY +
    totalWorkouts * XP_PER_WORKOUT +
    completedChallenges * XP_PER_CHALLENGE;

  const level = levelForXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpIntoLevel = xp - base;
  const xpForNextLevel = next - base;
  const levelPct = Math.round((xpIntoLevel / xpForNextLevel) * 100);

  const achievements: Achievement[] = [
    { key: "first_log", title: "First Steps", description: "Log your first day", icon: "sparkles", unlocked: activeDays >= 1 },
    { key: "streak_7", title: "One Week Strong", description: "7-day logging streak", icon: "flame", unlocked: currentStreak >= 7 },
    { key: "streak_30", title: "Unstoppable", description: "30-day logging streak", icon: "flame", unlocked: currentStreak >= 30 },
    { key: "days_30", title: "Regular", description: "Log on 30 different days", icon: "calendar-check", unlocked: activeDays >= 30 },
    { key: "days_100", title: "Centurion", description: "Log on 100 different days", icon: "medal", unlocked: activeDays >= 100 },
    { key: "workouts_10", title: "Getting Strong", description: "Complete 10 workouts", icon: "dumbbell", unlocked: totalWorkouts >= 10 },
    { key: "workouts_50", title: "Iron Habit", description: "Complete 50 workouts", icon: "dumbbell", unlocked: totalWorkouts >= 50 },
    { key: "challenge_1", title: "Challenger", description: "Finish your first challenge", icon: "trophy", unlocked: completedChallenges >= 1 },
    { key: "challenge_3", title: "Competitor", description: "Finish 3 challenges", icon: "trophy", unlocked: completedChallenges >= 3 },
  ];

  return {
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    levelPct,
    activeDays,
    currentStreak,
    totalWorkouts,
    completedChallenges,
    achievements,
  };
}
