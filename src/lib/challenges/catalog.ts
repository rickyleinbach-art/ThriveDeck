import type { MetricKey } from "@/lib/analytics/types";

// Challenge definitions (PRD § Challenges). These are the app's fixed catalog,
// kept in code like habit presets — no challenges table. Each challenge's
// progress is computed from a metric the user already logs (see
// src/lib/challenges/progress.ts), so joining a challenge needs no extra
// logging: it reads weight, steps, workouts, etc. straight from Analytics.

// How a challenge measures progress:
//  - days_hit:   count days in the window whose daily value ≥ threshold
//                (target = number of qualifying days needed)
//  - cumulative: sum the metric across the window toward a total (target)
//  - count:      like cumulative but for count metrics (workouts, minutes)
//  - any_log:    count days with anything logged (consistency); target = days
//  - weight_loss: reduction in the weight series toward target (in kg)
export type ChallengeMode =
  | { kind: "days_hit"; series: MetricKey; threshold: number }
  | { kind: "cumulative"; series: MetricKey }
  | { kind: "count"; series: MetricKey }
  | { kind: "any_log" }
  | { kind: "weight_loss" };

export type ChallengeCategory =
  | "Steps"
  | "Nutrition"
  | "Strength"
  | "Consistency"
  | "Weight";

export interface ChallengeDef {
  key: string;
  title: string;
  blurb: string;
  category: ChallengeCategory;
  durationDays: number;
  target: number; // qualifying days, cumulative total, or kg lost
  unit: string; // for display of value/target
  icon: string; // lucide icon name, resolved in the UI
  mode: ChallengeMode;
}

export const CHALLENGES: ChallengeDef[] = [
  {
    key: "steps_10k_30",
    title: "10K Steps a Day",
    blurb: "Hit 10,000 steps on 30 days. Build the daily-movement habit that quietly burns the most calories.",
    category: "Steps",
    durationDays: 45,
    target: 30,
    unit: "days",
    icon: "footprints",
    mode: { kind: "days_hit", series: "steps", threshold: 10000 },
  },
  {
    key: "walk_100k",
    title: "Walking Club: 100K",
    blurb: "Rack up 100,000 total steps in 30 days, at your own pace. Every walk counts toward the group goal.",
    category: "Steps",
    durationDays: 30,
    target: 100000,
    unit: "steps",
    icon: "map",
    mode: { kind: "cumulative", series: "steps" },
  },
  {
    key: "hydration_21",
    title: "Hydration Hero",
    blurb: "Drink at least 64 oz of water on 21 days over three weeks. Consistency, not perfection.",
    category: "Nutrition",
    durationDays: 28,
    target: 21,
    unit: "days",
    icon: "droplet",
    mode: { kind: "days_hit", series: "water", threshold: 64 },
  },
  {
    key: "protein_30",
    title: "30-Day Protein",
    blurb: "Log 120 g of protein or more on 30 days. Protect muscle and stay full while you train.",
    category: "Nutrition",
    durationDays: 45,
    target: 30,
    unit: "days",
    icon: "beef",
    mode: { kind: "days_hit", series: "protein", threshold: 120 },
  },
  {
    key: "consistency_30",
    title: "Consistency Streak",
    blurb: "Log something — anything — on 30 separate days. The habit of showing up is the whole game.",
    category: "Consistency",
    durationDays: 45,
    target: 30,
    unit: "days",
    icon: "flame",
    mode: { kind: "any_log" },
  },
  {
    key: "strength_12",
    title: "Strength 12",
    blurb: "Complete 12 workouts in 30 days — three a week. Progressive, repeatable, and enough to see change.",
    category: "Strength",
    durationDays: 30,
    target: 12,
    unit: "workouts",
    icon: "dumbbell",
    mode: { kind: "count", series: "workouts" },
  },
  {
    key: "active_600",
    title: "600 Active Minutes",
    blurb: "Bank 600 active minutes in a month — the ~150/week guideline, with room to spare.",
    category: "Strength",
    durationDays: 30,
    target: 600,
    unit: "min",
    icon: "timer",
    mode: { kind: "count", series: "workoutMinutes" },
  },
  {
    key: "weight_kick",
    title: "Weight Loss Kickstart",
    blurb: "Trend down 2 kg over 30 days at a steady, sustainable pace. Progress is measured from your weigh-ins.",
    category: "Weight",
    durationDays: 30,
    target: 2,
    unit: "kg",
    icon: "trending-down",
    mode: { kind: "weight_loss" },
  },
];

export const CHALLENGE_KEYS = CHALLENGES.map((c) => c.key);

export const CHALLENGES_BY_KEY: Record<string, ChallengeDef> = Object.fromEntries(
  CHALLENGES.map((c) => [c.key, c])
);
