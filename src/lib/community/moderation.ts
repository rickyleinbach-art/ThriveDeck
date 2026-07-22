import { classifyMedical } from "@/lib/coach/guardrails";

// Community moderation for unsafe medical content (PRD § Community: "strict
// moderation for unsafe medical advice"). Reuses the AI Coach's medical
// classifier so the app has a single, tested definition of what counts as
// dosing / medical advice — see src/lib/coach/guardrails.ts.
//
// Policy:
//   - Dosing content (how much to take, when to inject, protocols) is
//     BLOCKED before insert. It never reaches the database.
//   - Broader medical advice/claims are allowed but FLAGGED (is_flagged),
//     so they carry a visible caution and can be reviewed by admins later.

export type ModerationResult =
  | { action: "allow" }
  | { action: "flag" }
  | { action: "block"; reason: string };

const BLOCK_REASON =
  "This looks like it recommends medication or peptide dosing. To keep the community safe, ThriveDeck doesn't allow posts that tell others how much to take, when to inject, or how to run a protocol. Please share your experience without dosing instructions, and remind others to consult a licensed provider.";

// Runs the combined post text (title + body, or a comment body) through the
// classifier and returns what to do with it.
export function moderateCommunityText(text: string): ModerationResult {
  const topic = classifyMedical(text);
  if (topic === "dosing") return { action: "block", reason: BLOCK_REASON };
  if (topic === "medical") return { action: "flag" };
  return { action: "allow" };
}

// Shown on posts/comments that were flagged.
export const FLAGGED_NOTICE =
  "This post may contain health claims. It's personal experience, not medical advice — consult a licensed healthcare provider.";
