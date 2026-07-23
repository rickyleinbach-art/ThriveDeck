import { z } from "zod";
import {
  DIETARY_PATTERNS,
  PRIMARY_GOALS,
  TRAINING_EXPERIENCES,
} from "@/lib/validations/onboarding";

// Validation pattern used across the app: define schema, infer type, validate at boundaries.
// The profile editor lets users change onboarding answers later (Phase 5 § 5.5);
// the onboarding-specific fields are appended here so the Profile form can edit
// them. Peptide tracking + sensitive health data have their own focused updaters
// (see actions.ts) so they're intentionally NOT part of this "write every field"
// schema and can't be clobbered by a generic profile save.
export const profileSchema = z.object({
  fullName: z.string().min(1, "Please enter your name").max(120).optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  heightCm: z.number().positive().max(300).optional(),
  timezone: z.string().default("UTC"),
  unitSystem: z.enum(["METRIC", "IMPERIAL"]).default("METRIC"),
  goalWeightKg: z.number().positive().max(500).optional(),
  activityLevel: z
    .enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"])
    .optional(),
  primaryGoals: z.array(z.enum(PRIMARY_GOALS)).max(6).optional(),
  trainingExperience: z.enum(TRAINING_EXPERIENCES).optional(),
  trainingDaysPerWeek: z.number().int().min(0).max(7).optional(),
  dietaryPattern: z.enum(DIETARY_PATTERNS).optional(),
  allergies: z.string().max(1000).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Per-user notification preferences (stored as jsonb on profiles). Each field
// defaults so parsing a partial/empty stored value fills in the app defaults.
export const notificationPrefsSchema = z.object({
  mealLogReminders: z.boolean().default(true),
  workoutReminders: z.boolean().default(true),
  peptideReminders: z.boolean().default(true),
  habitNudges: z.boolean().default(true),
  weeklyReport: z.boolean().default(true),
  communityReplies: z.boolean().default(false),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

// Canonical defaults, derived from the schema so the two never drift.
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs =
  notificationPrefsSchema.parse({});

export const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthInput = z.infer<typeof authSchema>;
