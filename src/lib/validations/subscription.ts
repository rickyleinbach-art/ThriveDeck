import { z } from "zod";

// Mirrors prisma/schema.prisma Plan / SubscriptionStatus / BillingPeriod and the
// text CHECK constraints in 0015_subscriptions.sql.
export const PLANS = ["FREE", "PRO"] as const;
export type Plan = (typeof PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_PERIODS = ["monthly", "annual"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const billingPeriodSchema = z.enum(BILLING_PERIODS);
