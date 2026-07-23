import crypto from "crypto";

// Minimal Stripe integration over the REST API — no SDK dependency. Everything
// here is gated on env: without STRIPE_SECRET_KEY the checkout path reports
// "not configured" and the app falls back to the dev simulate flow. Add the
// Stripe keys + Price IDs to env to switch real billing on:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//   STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL

const STRIPE_API = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function form(params: Record<string, string | number | undefined>): string {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") body.append(k, String(v));
  }
  return body.toString();
}

export interface CheckoutParams {
  priceId: string;
  userId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

// Creates a Stripe Checkout Session and returns its hosted URL. Throws on a
// Stripe error so the caller can surface a message.
export async function createCheckoutSession(
  p: CheckoutParams
): Promise<{ url: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form({
      mode: "subscription",
      "line_items[0][price]": p.priceId,
      "line_items[0][quantity]": 1,
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      client_reference_id: p.userId,
      customer_email: p.customerEmail,
      "subscription_data[trial_period_days]": p.trialDays,
      "subscription_data[metadata][user_id]": p.userId,
    }),
  });

  const json = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !json.url) {
    throw new Error(json.error?.message ?? "Could not start checkout");
  }
  return { url: json.url };
}

// Verifies a Stripe webhook signature (t=…,v1=… header) without the SDK, using a
// constant-time compare. Returns the parsed event on success, or null on any
// verification failure.
export function verifyAndParseEvent(
  payload: string,
  signatureHeader: string | null,
  secret: string | undefined
): Record<string, unknown> | null {
  if (!secret || !signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => kv.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}
