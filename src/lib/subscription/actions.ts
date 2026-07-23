"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/subscription/stripe";
import { PRO_PRICING, TRIAL_DAYS } from "@/lib/subscription/entitlements";
import {
  billingPeriodSchema,
  type BillingPeriod,
} from "@/lib/validations/subscription";

type ActionResult = { success: true } | { success: false; error: string };
type CheckoutResult =
  | { success: true; url: string }
  | { success: true; simulate: true } // Stripe not configured — use simulate flow
  | { success: false; error: string };

// The dev "simulate upgrade" path is allowed outside production, or anywhere the
// ALLOW_BILLING_SIMULATION flag is explicitly set. Turn the flag OFF once real
// Stripe billing is live so the plan can only change through the webhook.
function simulationAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_BILLING_SIMULATION === "true"
  );
}

function revalidateBillingConsumers() {
  revalidatePath("/upgrade");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  // Gated modules read entitlements; refresh them too.
  revalidatePath("/analytics");
  revalidatePath("/ai-coach");
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

// Dev/stub upgrade: flips the caller's plan to PRO without a real charge. Writes
// via the service role so RLS can stay read-only for users (no self-upgrade from
// the client). Returns a clear message when billing isn't configured yet.
export async function simulateUpgrade(
  period: BillingPeriod
): Promise<ActionResult> {
  const parsed = billingPeriodSchema.safeParse(period);
  if (!parsed.success) return { success: false, error: "Invalid billing period" };

  if (!simulationAllowed()) {
    return { success: false, error: "Simulated upgrades are disabled here." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const admin = createAdminClient();
  if (!admin) {
    return {
      success: false,
      error:
        "Billing isn't configured yet — add SUPABASE_SERVICE_ROLE_KEY to enable upgrades.",
    };
  }

  const periodDays = parsed.data === "annual" ? 365 : 30;
  const { error } = await admin
    .from("subscriptions")
    .update({
      plan: "PRO",
      status: "trialing",
      billing_period: parsed.data,
      trial_ends_at: daysFromNow(TRIAL_DAYS),
      current_period_end: daysFromNow(periodDays),
      cancel_at_period_end: false,
    })
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not update your plan" };

  revalidateBillingConsumers();
  return { success: true };
}

// Cancels the current plan. With real Stripe wired we'd cancel at period end via
// the API and let the webhook downgrade; in the simulate/stub phase we downgrade
// immediately via the service role.
export async function cancelSubscription(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, error: "Billing isn't configured yet." };
  }

  const { error } = await admin
    .from("subscriptions")
    .update({
      plan: "FREE",
      status: "canceled",
      billing_period: null,
      trial_ends_at: null,
      current_period_end: null,
      cancel_at_period_end: false,
    })
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not cancel your plan" };

  revalidateBillingConsumers();
  return { success: true };
}

// Starts real checkout when Stripe is configured; otherwise signals the client
// to use the simulate flow so the whole surface is testable pre-Stripe.
export async function startCheckout(
  period: BillingPeriod
): Promise<CheckoutResult> {
  const parsed = billingPeriodSchema.safeParse(period);
  if (!parsed.success) return { success: false, error: "Invalid billing period" };

  if (!isStripeConfigured()) {
    return { success: true, simulate: true };
  }

  const priceId = process.env[PRO_PRICING[parsed.data].stripePriceEnv];
  if (!priceId) {
    return { success: false, error: "This plan isn't available right now." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thrivedeck.netlify.app";
  try {
    const { url } = await createCheckoutSession({
      priceId,
      userId: user.id,
      customerEmail: user.email ?? undefined,
      successUrl: `${base}/settings?upgraded=1`,
      cancelUrl: `${base}/upgrade`,
      trialDays: TRIAL_DAYS,
    });
    return { success: true, url };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not start checkout",
    };
  }
}
