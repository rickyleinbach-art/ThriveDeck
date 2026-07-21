import { z } from "zod";
import { CHALLENGE_KEYS } from "@/lib/challenges/catalog";

// Challenges (Module 10). The only user input is which challenge to join or
// leave; everything else (progress, standings) is computed server-side.

export const challengeKeySchema = z.object({
  challengeKey: z.string().refine((k) => CHALLENGE_KEYS.includes(k), {
    message: "Unknown challenge",
  }),
});

export type ChallengeKeyInput = z.infer<typeof challengeKeySchema>;
