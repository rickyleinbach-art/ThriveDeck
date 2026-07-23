import { z } from "zod";

// First-time onboarding questionnaire (Phase 5). Screen 1 is required (it
// drives every downstream calculation); everything else is optional/skippable
// and editable later from Profile/Settings. Enum string values mirror the
// text CHECK constraints in prisma/migrations/0013_onboarding.sql.

// ---------------------------------------------------------------------------
// Option sets + human labels (single source of truth for the wizard + editors)
// ---------------------------------------------------------------------------
export const PRIMARY_GOALS = [
  "LOSE_FAT",
  "BUILD_MUSCLE",
  "IMPROVE_PERFORMANCE",
  "GENERAL_HEALTH",
  "RECOVERY_REHAB",
  "MAINTAIN",
] as const;
export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

export const PRIMARY_GOAL_LABELS: Record<PrimaryGoal, string> = {
  LOSE_FAT: "Lose fat",
  BUILD_MUSCLE: "Build muscle",
  IMPROVE_PERFORMANCE: "Improve performance",
  GENERAL_HEALTH: "General health & longevity",
  RECOVERY_REHAB: "Recovery or rehab",
  MAINTAIN: "Maintain current",
};

// Goals that involve a target bodyweight — the wizard only shows the target
// weight field for these.
export const WEIGHT_CHANGE_GOALS: PrimaryGoal[] = ["LOSE_FAT", "BUILD_MUSCLE"];

export const TRAINING_EXPERIENCES = ["NEW", "SOME", "ADVANCED"] as const;
export type TrainingExperience = (typeof TRAINING_EXPERIENCES)[number];

export const TRAINING_EXPERIENCE_LABELS: Record<TrainingExperience, string> = {
  NEW: "New to training",
  SOME: "Some experience",
  ADVANCED: "Advanced",
};

export const DIETARY_PATTERNS = [
  "NONE",
  "VEGETARIAN",
  "VEGAN",
  "KETO",
  "PALEO",
  "OTHER",
] as const;
export type DietaryPattern = (typeof DIETARY_PATTERNS)[number];

export const DIETARY_PATTERN_LABELS: Record<DietaryPattern, string> = {
  NONE: "No specific pattern",
  VEGETARIAN: "Vegetarian",
  VEGAN: "Vegan",
  KETO: "Keto",
  PALEO: "Paleo",
  OTHER: "Other",
};

export const PEPTIDE_CATEGORIES = [
  "RECOVERY",
  "PERFORMANCE",
  "WEIGHT_MGMT",
  "LONGEVITY",
  "OTHER",
] as const;
export type PeptideCategory = (typeof PEPTIDE_CATEGORIES)[number];

export const PEPTIDE_CATEGORY_LABELS: Record<PeptideCategory, string> = {
  RECOVERY: "Recovery / healing",
  PERFORMANCE: "Performance",
  WEIGHT_MGMT: "Weight management",
  LONGEVITY: "Longevity / anti-aging",
  OTHER: "Other",
};

export const INJURY_FLAGS = [
  "JOINT_BACK",
  "POST_SURGERY",
  "PREGNANCY",
  "OTHER",
] as const;
export type InjuryFlag = (typeof INJURY_FLAGS)[number];

export const INJURY_FLAG_LABELS: Record<InjuryFlag, string> = {
  JOINT_BACK: "Joint or back issue",
  POST_SURGERY: "Post-surgery",
  PREGNANCY: "Pregnancy",
  OTHER: "Other",
};

const SEX_VALUES = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;
const ACTIVITY_VALUES = [
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "ACTIVE",
  "VERY_ACTIVE",
] as const;

// ---------------------------------------------------------------------------
// Sensitive health bag (Screen 4). Stored as jsonb on profiles, same pattern
// as notification_prefs. `consentAt` records when the user acknowledged the
// Screen-4 consent line; set server-side, never trusted from the client.
// ---------------------------------------------------------------------------
export const healthProfileSchema = z.object({
  injuryFlags: z.array(z.enum(INJURY_FLAGS)).default([]),
  injuryNotes: z.string().max(1000).default(""),
  conditions: z.string().max(1000).default(""),
  consentAt: z.string().nullable().default(null),
});

export type HealthProfile = z.infer<typeof healthProfileSchema>;
export const DEFAULT_HEALTH_PROFILE: HealthProfile = healthProfileSchema.parse({});

// True when the user actually entered any sensitive health data.
export function hasHealthData(h: HealthProfile): boolean {
  return h.injuryFlags.length > 0 || h.injuryNotes.trim() !== "" || h.conditions.trim() !== "";
}

// ---------------------------------------------------------------------------
// Full onboarding payload. All weights/heights are already normalized to
// metric (kg / cm) by the client before submit; unitSystem records the user's
// display preference. Screen 1 fields are required; the rest are optional.
// ---------------------------------------------------------------------------
export const onboardingSchema = z.object({
  // Screen 1 — Basics (required)
  fullName: z.string().max(120).optional(), // personalizes greeting + coach
  unitSystem: z.enum(["METRIC", "IMPERIAL"]),
  sex: z.enum(SEX_VALUES),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth"),
  heightCm: z.number().positive("Enter your height").max(300),
  currentWeightKg: z.number().positive("Enter your current weight").max(500),

  // Screen 2 — Goals & activity (skippable)
  primaryGoal: z.enum(PRIMARY_GOALS).optional(),
  goalWeightKg: z.number().positive().max(500).optional(),
  activityLevel: z.enum(ACTIVITY_VALUES).optional(),
  trainingExperience: z.enum(TRAINING_EXPERIENCES).optional(),
  trainingDaysPerWeek: z.number().int().min(0).max(7).optional(),

  // Screen 3 — Nutrition & substances (skippable). tracksPeptides always has a
  // value (the wizard defaults it to false) so the gate is never ambiguous.
  dietaryPattern: z.enum(DIETARY_PATTERNS).optional(),
  allergies: z.string().max(1000).optional(),
  tracksPeptides: z.boolean(),
  peptideCategory: z.enum(PEPTIDE_CATEGORIES).optional(),

  // Screen 4 — Optional but valuable (sensitive; skippable)
  healthProfile: healthProfileSchema.optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
