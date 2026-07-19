import type { AnalyticsData } from "@/lib/analytics/types";
import type { DashboardScores, WeightInsights } from "@/lib/analytics/scores";

// AI Coach domain model (Module 8). The coach is deterministic: it reads the
// same data the Analytics module reads and turns it into plain-language
// review, suggestions, and chat answers. No medical scoring or advice — see
// src/lib/coach/guardrails.ts.

// Everything the coach reasons over, assembled once server-side per request.
export interface CoachContext {
  today: string; // UTC "YYYY-MM-DD"
  analytics: AnalyticsData;
  scores: DashboardScores;
  weight: WeightInsights | null;

  // Derived activity summary.
  streakDays: number; // consecutive days ending today with anything logged
  workouts30d: number;
  lastWorkoutDay: string | null;
  daysSinceWorkout: number | null;

  // Today's nutrition against target (for meal suggestions).
  consumedToday: Macros | null;
  nutritionTarget: Macros | null;

  // A few of the user's own high-protein foods, for concrete meal ideas.
  proteinFoods: SimpleFood[];

  // Workout templates available to start (guided programs + user's own).
  templates: SimpleTemplate[];
}

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface SimpleFood {
  name: string;
  proteinG: number;
  calories: number;
  servingSize: number;
  servingUnit: string;
}

export interface SimpleTemplate {
  name: string;
  difficulty: string | null;
  isCustom: boolean;
}

// A block shown on the coach dashboard (weekly review, milestones, etc.).
export type InsightTone = "win" | "focus" | "milestone" | "neutral";

export interface Insight {
  tone: InsightTone;
  title: string;
  detail: string;
}

export interface WeeklyReport {
  greeting: string;
  summary: string;
  wins: Insight[];
  focus: Insight[];
  milestones: Insight[];
}

// A single coach chat turn's reply. `safety` flags the medical guardrail so
// the UI renders it prominently; `note` is the softer educational reminder.
export type CoachIntent =
  | "safety"
  | "progress"
  | "weight"
  | "nutrition"
  | "meal"
  | "workout"
  | "motivation"
  | "education"
  | "greeting"
  | "fallback";

export interface CoachReply {
  intent: CoachIntent;
  text: string;
  bullets?: string[];
  note?: string; // educational "consult your provider" footnote
  safety?: boolean; // true only for guardrail replies
}
