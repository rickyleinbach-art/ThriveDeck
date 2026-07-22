"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);

  // The /auth/callback route exchanges the emailed code for a session before
  // redirecting here, so an authenticated session should already exist.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
      setReady(true);
    });
  }, []);

  async function handleSubmit() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>

      {ready && !validSession ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-destructive">
            This reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block font-medium text-primary hover:underline"
          >
            Request a new link
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              placeholder="Re-enter your password"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !ready}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </div>
      )}
    </main>
  );
}
