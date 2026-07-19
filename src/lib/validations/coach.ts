import { z } from "zod";

// AI Coach (Module 8). The coach is a deterministic, data-driven assistant:
// it reviews what the user has logged and answers lifestyle questions about
// nutrition, training, and consistency. It NEVER prescribes medication or
// gives dosing instructions (CLAUDE.md § Health & safety). The only user
// input is a free-text chat message; everything else is derived server-side.

export const MAX_MESSAGE_LENGTH = 1000;

export const coachMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Ask the coach a question")
    .max(MAX_MESSAGE_LENGTH, "Message is too long"),
});

export type CoachMessageInput = z.infer<typeof coachMessageSchema>;
