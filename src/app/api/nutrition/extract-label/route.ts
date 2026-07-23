import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  extractLabelRequestSchema,
  extractedLabelSchema,
} from "@/lib/validations/nutrition";

// This is the project's first Anthropic integration. A single structured
// vision-extraction call is a good fit for a fast, cheap model — defaults to
// claude-haiku-4-5, overridable via ANTHROPIC_MODEL. Requires ANTHROPIC_API_KEY
// in the environment (never commit it).
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

const EXTRACTION_PROMPT = `You will be shown a photo of a food nutrition facts label. Extract the values into
JSON only, no other text. Use null for any field not visible or not present on this label.

{
  "serving_size": string | null,
  "servings_per_container": number | null,
  "calories": number | null,
  "total_fat_g": number | null,
  "saturated_fat_g": number | null,
  "trans_fat_g": number | null,
  "cholesterol_mg": number | null,
  "sodium_mg": number | null,
  "total_carb_g": number | null,
  "fiber_g": number | null,
  "total_sugars_g": number | null,
  "added_sugars_g": number | null,
  "protein_g": number | null,
  "confidence": "high" | "medium" | "low"
}

Set "confidence" to "low" if the image is blurry, cropped, glare-heavy, or if you
are unsure of the reading. Respond with the JSON object only.`;

// Pull the first {...} block out of the model's text, tolerating stray prose or
// code fences even though the prompt asks for JSON only.
function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Require an authenticated user (RLS-consistent with the rest of nutrition).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Label scanning isn't configured yet.", code: "not_configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = extractLabelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Send a valid image (jpeg, png, webp, or gif)." },
      { status: 400 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let responseText: string;
  try {
    const message = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: parsed.data.mediaType,
                  data: parsed.data.imageBase64,
                },
              },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
      },
      { timeout: 30_000 }
    );
    responseText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      // Don't leak upstream detail; log server-side only.
      console.error("Label extraction API error:", err.status);
    } else {
      console.error("Label extraction failed:", err);
    }
    return NextResponse.json(
      { error: "Couldn't read the label. Try again or enter it manually.", code: "upstream" },
      { status: 502 }
    );
  }

  const raw = extractJsonObject(responseText);
  const validated = extractedLabelSchema.safeParse(raw);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "We couldn't read that clearly. Please fill in the values below.",
        code: "low_confidence",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ data: validated.data });
}
