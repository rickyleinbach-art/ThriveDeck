import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_NOTIFICATION_PREFS,
  notificationPrefsSchema,
  type NotificationPrefs,
  type ProfileInput,
} from "@/lib/validations/profile";

// Server-side reads. RLS scopes the profiles table to the signed-in user
// (auth.uid() = id); the explicit id filter below is defense in depth.

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  dateOfBirth: string | null; // "YYYY-MM-DD"
  sex: NonNullable<ProfileInput["sex"]> | null;
  heightCm: number | null;
  timezone: string;
  unitSystem: NonNullable<ProfileInput["unitSystem"]>;
  goalWeightKg: number | null;
  activityLevel: NonNullable<ProfileInput["activityLevel"]> | null;
  notificationPrefs: NotificationPrefs;
  onboarded: boolean;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, date_of_birth, sex, height_cm, timezone, unit_system, goal_weight_kg, activity_level, notification_prefs, onboarded"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  // Stored value may be {} or partial; parse fills in defaults, and a malformed
  // value falls back to defaults rather than throwing.
  const notificationPrefs = notificationPrefsSchema.safeParse(
    data.notification_prefs ?? {}
  );

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    dateOfBirth: data.date_of_birth,
    sex: data.sex,
    heightCm: data.height_cm,
    timezone: data.timezone ?? "UTC",
    unitSystem: data.unit_system === "IMPERIAL" ? "IMPERIAL" : "METRIC",
    goalWeightKg: data.goal_weight_kg,
    activityLevel: data.activity_level,
    notificationPrefs: notificationPrefs.success
      ? notificationPrefs.data
      : DEFAULT_NOTIFICATION_PREFS,
    onboarded: data.onboarded,
  };
}
