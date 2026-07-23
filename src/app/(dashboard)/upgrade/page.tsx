import { getSubscription } from "@/lib/subscription/queries";
import { UpgradeClient } from "./upgrade-client";

export const metadata = { title: "Upgrade · ThriveDeck" };

export default async function UpgradePage() {
  const sub = await getSubscription();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {sub.plan === "PRO" ? "Your membership" : "Go further with Pro"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Everything you need to track your day is free, forever. Pro unlocks the
          insight, automation, and coaching that turn tracking into results.
        </p>
      </div>

      <UpgradeClient
        plan={sub.plan}
        status={sub.status}
        billingPeriod={sub.billingPeriod}
        currentPeriodEnd={sub.currentPeriodEnd}
        trialEndsAt={sub.trialEndsAt}
      />
    </div>
  );
}
