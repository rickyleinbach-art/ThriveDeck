"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notificationPrefsSchema,
  profileSchema,
  type NotificationPrefs,
  type ProfileInput,
} from "@/lib/validations/profile";
import {
  hasHealthData,
  healthProfileSchema,
  PEPTIDE_CATEGORIES,
  type HealthProfile,
  type PeptideCategory,
} from "@/lib/validations/onboarding";

type ActionResult = { success: true } | { success: false; error: string };

// The profile feeds cross-module reads (BMI on Weight, the macro calculator
// on Nutrition, unit display everywhere, AI Coach context), so refresh those.
function revalidateProfileConsumers() {
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/nutrition");
  revalidatePath("/ai-coach");
}

// Full-profile editor semantics: the form always submits every field, so we
// write every column. `onboarded` flips true the first time a profile is saved.
export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName ?? null,
      date_of_birth: parsed.data.dateOfBirth || null,
      sex: parsed.data.sex ?? null,
      height_cm: parsed.data.heightCm ?? null,
      timezone: parsed.data.timezone,
      unit_system: parsed.data.unitSystem,
      goal_weight_kg: parsed.data.goalWeightKg ?? null,
      activity_level: parsed.data.activityLevel ?? null,
      primary_goal: parsed.data.primaryGoal ?? null,
      training_experience: parsed.data.trainingExperience ?? null,
      training_days_per_week: parsed.data.trainingDaysPerWeek ?? null,
      dietary_pattern: parsed.data.dietaryPattern ?? null,
      allergies: parsed.data.allergies || null,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not save profile" };

  revalidateProfileConsumers();
  return { success: true };
}

// Focused updater for the Settings "Track peptides" toggle. This is the single
// flag that gates the Peptides module app-wide (Phase 5 § 5.2), so it's kept
// separate from the full-profile save and never clobbered by it. Flipping it on
// reveals the module immediately — no re-onboarding. The category is only kept
// when tracking is on.
export async function updatePeptideTracking(
  tracksPeptides: boolean,
  peptideCategory: PeptideCategory | null
): Promise<ActionResult> {
  if (typeof tracksPeptides !== "boolean") {
    return { success: false, error: "Invalid value" };
  }
  if (peptideCategory !== null && !PEPTIDE_CATEGORIES.includes(peptideCategory)) {
    return { success: false, error: "Invalid peptide category" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      tracks_peptides: tracksPeptides,
      peptide_category: tracksPeptides ? peptideCategory : null,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not save preference" };

  // Nav, dashboard, analytics, and the peptides route all read this flag.
  revalidateProfileConsumers();
  revalidatePath("/analytics");
  revalidatePath("/peptides");
  return { success: true };
}

// Focused updater for sensitive Screen-4 health data (injuries, conditions).
// Stamps consent server-side the first time real data is present so the
// timestamp reflects an actual acknowledgement, not an empty save.
export async function updateHealthProfile(
  input: HealthProfile
): Promise<ActionResult> {
  const parsed = healthProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid health details" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const value: HealthProfile = {
    ...parsed.data,
    consentAt: hasHealthData(parsed.data)
      ? parsed.data.consentAt ?? new Date().toISOString()
      : null,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ health_profile: value })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not save health details" };

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/ai-coach");
  return { success: true };
}

// Focused updater for the Settings units toggle — avoids clobbering the rest
// of the profile when only the unit preference changes.
export async function updateUnitSystem(
  unitSystem: "METRIC" | "IMPERIAL"
): Promise<ActionResult> {
  if (unitSystem !== "METRIC" && unitSystem !== "IMPERIAL") {
    return { success: false, error: "Invalid unit system" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ unit_system: unitSystem })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not save units" };

  revalidateProfileConsumers();
  return { success: true };
}

// Per-user notification preferences. Stored as a jsonb bag on the profile so
// they persist across devices.
export async function updateNotificationPrefs(
  input: NotificationPrefs
): Promise<ActionResult> {
  const parsed = notificationPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid notification preferences" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: parsed.data })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not save preferences" };

  revalidatePath("/settings");
  return { success: true };
}
