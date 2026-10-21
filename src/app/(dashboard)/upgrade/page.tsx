import { getSubscription } from "@/lib/subscription/queries";
import { Crown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UpgradeClient } from "./upgrade-client";

export const metadata = { title: "Upgrade · ThriveDeck" };

export default async function UpgradePage() {
  const sub = await getSubscription();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon={Crown}
        title={sub.plan === "PRO" ? "Your membership" : "Go further with Pro"}
        description="Everything you need to track your day is free, forever. Pro unlocks the insight, automation, and coaching that turn tracking into results."
      />

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
