import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/lib/profile/queries";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          The basics that personalize your metrics — BMI, calorie targets, and
          how weights and distances are shown.
        </p>
      </div>

      {profile ? (
        <>
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Account</p>
                <p className="truncate text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
              <Link href="/settings" className="text-sm text-primary hover:underline">
                Settings
              </Link>
            </div>
            <ProfileForm profile={profile} />
          </Card>

          <p className="text-xs text-muted-foreground">
            Your health data is private to your account. See how it&apos;s handled
            in Settings.
          </p>
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your profile. Try signing out and back in.
          </p>
        </Card>
      )}
    </div>
  );
}
