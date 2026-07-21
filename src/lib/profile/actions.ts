"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notificationPrefsSchema,
  profileSchema,
  type NotificationPrefs,
  type ProfileInput,
} from "@/lib/validations/profile";

type ActionResult = { success: true } | { success: false; error: string };

// The profile feeds cross-module reads (BMI on Weight, the macro calculator
// on Nutrition, unit display everywhere), so refresh those too.
function revalidateProfileConsumers() {
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/nutrition");
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
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not save profile" };

  revalidateProfileConsumers();
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
