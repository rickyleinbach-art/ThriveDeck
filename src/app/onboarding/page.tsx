import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile/queries";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = { title: "Welcome · ThriveDeck" };

// Lives OUTSIDE the (dashboard) route group on purpose: it has no nav shell and
// isn't subject to the dashboard layout's onboarding redirect (which would
// loop). New users are sent here by that layout until `onboarded` is set.
export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/dashboard");

  return (
    <OnboardingWizard
      initialUnitSystem={profile.unitSystem}
      firstName={profile.fullName?.split(" ")[0] ?? null}
    />
  );
}
