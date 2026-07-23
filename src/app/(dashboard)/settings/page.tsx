import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile/queries";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/validations/profile";
import { DEFAULT_HEALTH_PROFILE } from "@/lib/validations/onboarding";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Appearance, units, and notification preferences.
        </p>
      </div>

      <SettingsClient
        email={user.email ?? profile?.email ?? ""}
        initialUnitSystem={profile?.unitSystem ?? "METRIC"}
        initialNotificationPrefs={
          profile?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS
        }
        initialTracksPeptides={profile?.tracksPeptides ?? true}
        initialPeptideCategories={profile?.peptideCategories ?? []}
        initialHealthProfile={profile?.healthProfile ?? DEFAULT_HEALTH_PROFILE}
      />
    </div>
  );
}
