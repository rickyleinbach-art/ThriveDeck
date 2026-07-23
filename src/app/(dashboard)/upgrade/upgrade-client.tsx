"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRO_PRICING } from "@/lib/subscription/entitlements";
import {
  cancelSubscription,
  simulateUpgrade,
  startCheckout,
} from "@/lib/subscription/actions";
import type {
  BillingPeriod,
  Plan,
  SubscriptionStatus,
} from "@/lib/validations/subscription";

const PRO_FEATURES = [
  "Full analytics, trends & projections",
  "Progress reports & CSV / PDF export",
  "AI Coach — full access",
  "Nutrition label scanner + auto targets",
  "Peptide & GLP-1 suite (reminders, adherence)",
  "Challenges, recipes & unlimited history",
  "Priority support",
];

const FREE_FEATURES = [
  "Weight & body measurements",
  "Food logging + food catalog",
  "Exercise, habits & health metrics",
  "Today dashboard & community",
  "90 days of history",
];

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function UpgradeClient({
  plan,
  status,
  billingPeriod,
  currentPeriodEnd,
  trialEndsAt,
}: {
  plan: Plan;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upgrade() {
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(period);
      if (!res.success) {
        setError(res.error);
        return;
      }
      if ("url" in res) {
        window.location.href = res.url;
        return;
      }
      // Stripe not configured — use the simulate flow.
      const sim = await simulateUpgrade(period);
      if (!sim.success) {
        setError(sim.error);
        return;
      }
      router.refresh();
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelSubscription();
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  // ---- Already on Pro ----
  if (plan === "PRO") {
    const renews = formatDate(currentPeriodEnd);
    const trialEnds = formatDate(trialEndsAt);
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">ThriveDeck Pro</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {status === "trialing" && trialEnds
                  ? `Free trial — ends ${trialEnds}`
                  : status === "active" && renews
                  ? `${billingPeriod === "annual" ? "Annual" : "Monthly"} · renews ${renews}`
                  : "Active"}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Active
            </span>
          </div>
        </Card>

        <Card title="Everything unlocked">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" onClick={cancel} disabled={pending}>
          {pending ? "Working…" : "Cancel plan"}
        </Button>
        <SafetyNote />
      </div>
    );
  }

  // ---- Free: show the offer ----
  const price = PRO_PRICING[period];
  return (
    <div className="space-y-5">
      {/* Billing toggle */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["monthly", "annual"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition " +
                (period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {p}
            </button>
          ))}
        </div>
        {price.save && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {price.save}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Free */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Starter
          </p>
          <p className="mt-2 text-3xl font-semibold">$0</p>
          <p className="mt-1 text-sm text-muted-foreground">Your current plan</p>
          <ul className="mt-4 space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Pro */}
        <Card className="border-primary shadow-[0_0_0_1px_hsl(var(--primary))]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              ThriveDeck Pro
            </p>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
              Most popular
            </span>
          </div>
          <p className="mt-2 text-3xl font-semibold">
            {price.amountLabel}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {price.per}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{price.note}</p>
          <Button className="mt-4 w-full" onClick={upgrade} disabled={pending}>
            {pending ? "Starting…" : "Start 7-day free trial"}
          </Button>
          <ul className="mt-4 space-y-2">
            <li className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Everything in Starter, plus
            </li>
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <SafetyNote />
    </div>
  );
}

function SafetyNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          A subscription never changes our health rules.
        </span>{" "}
        Peptide and GLP-1 logging stays record-only on every plan — ThriveDeck
        records what you enter and never recommends compounds or dosing. Pro adds
        analysis of your own data, not medical advice.
      </p>
    </div>
  );
}
