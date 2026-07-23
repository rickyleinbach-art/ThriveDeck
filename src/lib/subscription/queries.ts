import { createClient } from "@/lib/supabase/server";
import { hasFeature, type Feature } from "@/lib/subscription/entitlements";
import type {
  BillingPeriod,
  Plan,
  SubscriptionStatus,
} from "@/lib/validations/subscription";

// Server-side reads. RLS scopes the subscriptions table to the signed-in user
// (select-only); we default to FREE when there's no row or no session so callers
// never have to special-case an unprovisioned account.
export interface Subscription {
  plan: Plan;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
}

const FREE_SUBSCRIPTION: Subscription = {
  plan: "FREE",
  status: "none",
  billingPeriod: null,
  currentPeriodEnd: null,
  trialEndsAt: null,
  cancelAtPeriodEnd: false,
};

export async function getSubscription(): Promise<Subscription> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FREE_SUBSCRIPTION;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, billing_period, current_period_end, trial_ends_at, cancel_at_period_end"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return FREE_SUBSCRIPTION;

  return {
    plan: data.plan === "PRO" ? "PRO" : "FREE",
    status: data.status ?? "none",
    billingPeriod: data.billing_period ?? null,
    currentPeriodEnd: data.current_period_end,
    trialEndsAt: data.trial_ends_at,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
  };
}

export interface Entitlements {
  plan: Plan;
  subscription: Subscription;
  has: (feature: Feature) => boolean;
  isPro: boolean;
}

// Convenience wrapper for gating: `const { has } = await getEntitlements()`.
export async function getEntitlements(): Promise<Entitlements> {
  const subscription = await getSubscription();
  return {
    plan: subscription.plan,
    subscription,
    has: (feature: Feature) => hasFeature(subscription.plan, feature),
    isPro: subscription.plan === "PRO",
  };
}
