"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { challengeKeySchema, type ChallengeKeyInput } from "@/lib/validations/challenge";
import { CHALLENGES_BY_KEY } from "@/lib/challenges/catalog";
import { computeChallengeProgress } from "@/lib/challenges/progress";

// Join / leave / sync. Progress is recomputed from the user's own logged data
// and written back as a snapshot so shared leaderboards can rank participants
// without reading anyone's raw health logs.

type ActionResult = { success: true } | { success: false; error: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function displayName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const full = (data?.full_name as string | null)?.trim();
  if (full) return full;
  return ((data?.email as string | null) ?? "").split("@")[0] || "Member";
}

export async function joinChallenge(input: ChallengeKeyInput): Promise<ActionResult> {
  const parsed = challengeKeySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Unknown challenge" };

  const def = CHALLENGES_BY_KEY[parsed.data.challengeKey];
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const analytics = await getAnalyticsData();
  const today = analytics.today;
  const name = await displayName(supabase, user.id);
  // Compute an initial standing from today's start so the user appears on the
  // board immediately (usually 0%).
  const p = computeChallengeProgress(def, today, today, analytics);

  const { error } = await supabase.from("challenge_participants").upsert(
    {
      user_id: user.id,
      display_name: name,
      challenge_key: def.key,
      start_date: today,
      progress_value: p.value,
      progress_pct: p.pct,
      completed: p.completed,
      completed_at: p.completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,challenge_key", ignoreDuplicates: true }
  );
  if (error) return { success: false, error: "Could not join challenge" };

  revalidatePath("/challenges");
  return { success: true };
}

export async function leaveChallenge(input: ChallengeKeyInput): Promise<ActionResult> {
  const parsed = challengeKeySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Unknown challenge" };

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("challenge_participants")
    .delete()
    .eq("user_id", user.id)
    .eq("challenge_key", parsed.data.challengeKey);
  if (error) return { success: false, error: "Could not leave challenge" };

  revalidatePath("/challenges");
  return { success: true };
}

// Recomputes the current user's standing for every challenge they've joined
// and writes the snapshot back. Called on page load so the leaderboard the
// user sees reflects their latest logs.
export async function syncMyChallenges(): Promise<
  { success: true; changed: boolean } | { success: false; error: string }
> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { data } = await supabase
    .from("challenge_participants")
    .select("challenge_key, start_date, progress_pct, completed")
    .eq("user_id", user.id);

  const mine = data ?? [];
  if (mine.length === 0) return { success: true, changed: false };

  const analytics = await getAnalyticsData();
  const today = analytics.today;
  const nowIso = new Date().toISOString();

  let changed = false;
  for (const row of mine) {
    const def = CHALLENGES_BY_KEY[row.challenge_key as string];
    if (!def) continue;
    const p = computeChallengeProgress(def, row.start_date as string, today, analytics);
    // Only write when something actually moved.
    if (p.pct === row.progress_pct && p.completed === row.completed) continue;
    changed = true;
    await supabase
      .from("challenge_participants")
      .update({
        progress_value: p.value,
        progress_pct: p.pct,
        completed: p.completed,
        completed_at: p.completed
          ? (row.completed ? undefined : nowIso)
          : null,
      })
      .eq("user_id", user.id)
      .eq("challenge_key", row.challenge_key as string);
  }

  if (changed) revalidatePath("/challenges");
  return { success: true, changed };
}
