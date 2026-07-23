import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAndParseEvent } from "@/lib/subscription/stripe";

// Stripe subscription webhook. Verifies the signature, then updates the user's
// subscription row via the service role. Scaffolded and env-gated: without
// STRIPE_WEBHOOK_SECRET / the service role it returns 501 so Stripe shows it as
// not-yet-configured rather than silently succeeding. Node runtime is required
// for the crypto-based signature check and the raw body.
export const runtime = "nodejs";

type StripeObject = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

// Map a Stripe subscription status onto our enum (both share most names).
function mapStatus(s: string | null): string {
  switch (s) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
      return s;
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return "past_due";
    default:
      return "none";
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = createAdminClient();
  if (!secret || !admin) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 501 });
  }

  const payload = await request.text();
  const event = verifyAndParseEvent(
    payload,
    request.headers.get("stripe-signature"),
    secret
  );
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const type = str(event.type);
  const object = (event.data as StripeObject | undefined)?.object as
    | StripeObject
    | undefined;
  if (!object) return NextResponse.json({ received: true });

  // Resolve which user this event belongs to.
  const metadata = (object.metadata as StripeObject | undefined) ?? {};
  const userId =
    str(object.client_reference_id) ?? str(metadata.user_id) ?? null;
  const customerId = str(object.customer);

  async function applyByUser(patch: StripeObject) {
    if (userId) {
      await admin!.from("subscriptions").update(patch).eq("user_id", userId);
    } else if (customerId) {
      await admin!
        .from("subscriptions")
        .update(patch)
        .eq("stripe_customer_id", customerId);
    }
  }

  const periodEndRaw = object.current_period_end;
  const currentPeriodEnd =
    typeof periodEndRaw === "number"
      ? new Date(periodEndRaw * 1000).toISOString()
      : undefined;

  switch (type) {
    case "checkout.session.completed":
      await applyByUser({
        plan: "PRO",
        status: "trialing",
        stripe_customer_id: customerId ?? undefined,
        stripe_subscription_id: str(object.subscription) ?? undefined,
        cancel_at_period_end: false,
      });
      break;

    case "customer.subscription.updated":
      await applyByUser({
        plan: mapStatus(str(object.status)) === "canceled" ? "FREE" : "PRO",
        status: mapStatus(str(object.status)),
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: Boolean(object.cancel_at_period_end),
      });
      break;

    case "customer.subscription.deleted":
      await applyByUser({
        plan: "FREE",
        status: "canceled",
        cancel_at_period_end: false,
        current_period_end: null,
      });
      break;

    default:
      // Unhandled event types are acknowledged so Stripe doesn't retry.
      break;
  }

  return NextResponse.json({ received: true });
}
