"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.string().email("Enter a valid email");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    // Always show the same confirmation so we don't reveal which emails exist.
    if (error && error.status && error.status >= 500) {
      setError("Something went wrong sending the email. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-muted-foreground">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      {sent ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-success">
            If an account exists for <span className="font-medium">{email}</span>,
            a reset link is on its way. Check your inbox (and spam folder).
          </p>
          <Link
            href="/login"
            className="inline-block font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
