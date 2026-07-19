"use server";

import { createClient } from "@/lib/supabase/server";
import { coachMessageSchema, type CoachMessageInput } from "@/lib/validations/coach";
import { getCoachContext } from "@/lib/coach/queries";
import { coachReply } from "@/lib/coach/chat";
import type { CoachReply } from "@/lib/coach/types";

// Chat is ephemeral — no message history is stored, so no schema changes are
// needed and no health-adjacent text is persisted or logged. The guardrail
// runs server-side (in coachReply) so it can't be bypassed from the client.

type ChatResult =
  | { success: true; reply: CoachReply }
  | { success: false; error: string };

export async function askCoach(input: CoachMessageInput): Promise<ChatResult> {
  const parsed = coachMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const ctx = await getCoachContext();
  const reply = coachReply(parsed.data.message, ctx);
  return { success: true, reply };
}
