import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile/queries";
import { getSubscription } from "@/lib/subscription/queries";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/validations/profile";
import { DEFAULT_HEALTH_PROFILE } from "@/lib/validations/onboarding";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, subscription] = await Promise.all([
    getProfile(),
    getSubscription(),
  ]);
  const isPro = subscription.plan === "PRO";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Membership, appearance, units, and notification preferences."
      />

      <Card title="Membership">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {isPro ? "ThriveDeck Pro" : "Starter (Free)"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isPro
                ? subscription.status === "trialing"
                  ? "Free trial active"
                  : "All Pro features unlocked"
                : "Core tracking, free forever"}
            </p>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {isPro ? "Manage" : "Upgrade to Pro"}
          </Link>
        </div>
      </Card>

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
