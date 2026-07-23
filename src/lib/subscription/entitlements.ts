import type { BillingPeriod, Plan } from "@/lib/validations/subscription";

// Single source of truth for what each plan unlocks (Phase: Subscriptions).
// Core tracking is always free and is intentionally NOT listed here — only the
// Pro-gated capabilities are. Gate features by asking hasFeature(plan, feature)
// both server-side (enforcement) and client-side (UI), the same pattern used for
// the tracks_peptides module gate.

export const FEATURES = [
  "analytics_full", // all charts, ranges, projections (Free gets a basic view)
  "analytics_export", // CSV / PDF progress reports
  "ai_coach", // the AI Coach
  "label_scanner", // nutrition label camera scan
  "auto_targets", // auto-calculated calorie/macro targets
  "peptide_suite", // reminders, adherence, side-effect trends (logging stays free)
  "unlimited_history", // beyond the free history window
  "challenges", // challenges & gamification
  "recipes", // recipe library
  "priority_support",
] as const;

export type Feature = (typeof FEATURES)[number];

const PLAN_FEATURES: Record<Plan, ReadonlySet<Feature>> = {
  FREE: new Set<Feature>(),
  PRO: new Set<Feature>(FEATURES),
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

// Master switch for whether Pro gates actually restrict anything. Kept OFF by
// default so the gating can ship to a live app without stripping features from
// existing (all-Free) users before billing is activated. Flip BILLING_ENFORCED
// to "true" in the environment once upgrades work (service-role key / Stripe are
// set) to turn real gating on. When off, everyone is treated as fully entitled.
export function isBillingEnforced(): boolean {
  return process.env.BILLING_ENFORCED === "true";
}

// Enforcement-aware check — the one gates should call.
export function entitled(plan: Plan, feature: Feature): boolean {
  return !isBillingEnforced() || hasFeature(plan, feature);
}

// Free history window (days). Pro is unlimited.
export const FREE_HISTORY_DAYS = 90;

// SAFETY: peptide/GLP-1 LOGGING is record-only and free on every plan — never
// gate it. Only the *analysis* layer (peptide_suite) is Pro. This mirrors the
// health rule that ThriveDeck records what the user enters and never advises.

// Pricing shown in the UI and used to pick the Stripe price at checkout. Amounts
// are display-only; the real charge comes from the Stripe Price the env points
// to. Positioned well under the category leader.
export interface PlanPrice {
  period: BillingPeriod;
  amountLabel: string;
  per: string;
  note: string;
  save?: string;
  stripePriceEnv: string; // env var holding the Stripe Price ID
}

export const PRO_PRICING: Record<BillingPeriod, PlanPrice> = {
  monthly: {
    period: "monthly",
    amountLabel: "$4.99",
    per: "/ month",
    note: "Billed monthly · 7-day free trial",
    stripePriceEnv: "STRIPE_PRICE_MONTHLY",
  },
  annual: {
    period: "annual",
    amountLabel: "$39.99",
    per: "/ year",
    note: "$3.33/mo, billed annually · 7-day free trial",
    save: "Save 33%",
    stripePriceEnv: "STRIPE_PRICE_ANNUAL",
  },
};

export const TRIAL_DAYS = 7;
