import { z } from "zod";

// Validation pattern used across the app: define schema, infer type, validate at boundaries.
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
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Per-user notification preferences (stored as jsonb on profiles). Each field
// defaults so parsing a partial/empty stored value fills in the app defaults.
export const notificationPrefsSchema = z.object({
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
