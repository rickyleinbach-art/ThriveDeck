import type { CoachContext, CoachReply } from "@/lib/coach/types";
import {
  classifyMedical,
  medicalGuardrailResponse,
  CONSULT_PROVIDER_NOTE,
} from "@/lib/coach/guardrails";
import { matchEducationTopic } from "@/lib/coach/education";
import {
  mealAnswer,
  motivationAnswer,
  progressAnswer,
  weightAnswer,
  workoutAnswer,
} from "@/lib/coach/insights";

// Deterministic coach chat. Given a user message and their context, classify
// intent and produce a reply. Order is deliberate and SAFETY CRITICAL:
// the medical/dosing guardrail is checked FIRST, before any coaching path,
// so a question like "how much semaglutide should I take" can never reach a
// weight- or nutrition-answer builder. See guardrails.ts.

type Matcher = { intent: CoachReply["intent"]; patterns: RegExp[] };

// Non-medical intent matchers, tried in order after the guardrail passes.
const MATCHERS: Matcher[] = [
  {
    intent: "greeting",
    patterns: [/^\s*(hi|hey|hello|yo|sup|good\s+(morning|afternoon|evening))\b/i, /^\s*(what'?s\s+up)\b/i],
  },
  {
    intent: "progress",
    patterns: [
      /\bhow\s+(am|'?m)\s+i\s+doing\b/i,
      /\b(my\s+)?(progress|report|summary|recap|check[\s-]?in|overview|how'?s?\s+my\s+week)\b/i,
      /\b(score|scores)\b/i,
    ],
  },
  {
    intent: "weight",
    patterns: [
      /\b(weight|weigh|scale|pounds?|lbs?|kilos?|kg)\b/i,
      /\b(on track|trend|trending|projection|goal\s+date)\b/i,
    ],
  },
  {
    intent: "meal",
    patterns: [
      /\bwhat\s+(should|can|do)\s+i\s+eat\b/i,
      /\b(meal|dinner|lunch|breakfast|snack|recipe|food\s+idea|what\s+to\s+eat|hungry|eat\s+today)\b/i,
      /\b(macros?\s+left|remaining\s+(calories|macros)|calories?\s+left)\b/i,
    ],
  },
  {
    intent: "workout",
    patterns: [
      /\b(workout|training|train|exercise|lift|gym|cardio|routine|program|what\s+should\s+i\s+do\s+(today|at\s+the\s+gym))\b/i,
    ],
  },
  {
    intent: "motivation",
    patterns: [
      /\b(motivat\w*|encourag\w*|streak|keep\s+going|struggling|hard\s+time|stay\s+on\s+track|pep\s+talk)\b/i,
    ],
  },
];

export function coachReply(message: string, ctx: CoachContext): CoachReply {
  // 1) SAFETY GATE — medical / dosing always wins.
  const medical = classifyMedical(message);
  if (medical) {
    const g = medicalGuardrailResponse(medical);
    return { intent: "safety", text: g.text, bullets: g.bullets, safety: true };
  }

  // 2) Education topics — general, non-medical knowledge. Checked before the
  // broader intent matchers so a specific "why does protein matter" question
  // gets the explainer rather than a meal suggestion.
  const topic = matchEducationTopic(message);
  const intentMatch = firstIntent(message);

  // Prefer an explicit action intent (progress/meal/workout/…) when the
  // message clearly asks for one; otherwise fall back to the education topic.
  if (intentMatch && intentMatch !== "greeting") {
    return buildIntentReply(intentMatch, ctx);
  }
  if (topic) {
    return {
      intent: "education",
      text: `${topic.title} — ${topic.body}`,
      bullets: topic.bullets,
      note: CONSULT_PROVIDER_NOTE,
    };
  }
  if (intentMatch === "greeting") {
    return {
      intent: "greeting",
      text: "Hey! I'm your coach. I can review your progress, suggest meals from your targets, plan out training, or explain the why behind a habit. What's on your mind?",
      bullets: [
        "\"How am I doing this week?\"",
        "\"What should I eat tonight?\"",
        "\"What workout should I do?\"",
        "\"Why does protein matter?\"",
      ],
    };
  }

  // 3) Fallback — orient the user without pretending to understand.
  return {
    intent: "fallback",
    text: "I can help most with your progress, nutrition, training, and building consistency. Try asking one of these:",
    bullets: [
      "\"How's my progress this week?\"",
      "\"What should I eat with my macros left?\"",
      "\"What workout should I do today?\"",
      "\"How do I break a plateau?\"",
    ],
  };
}

function firstIntent(message: string): CoachReply["intent"] | null {
  for (const m of MATCHERS) {
    if (m.patterns.some((re) => re.test(message))) return m.intent;
  }
  return null;
}

function buildIntentReply(intent: CoachReply["intent"], ctx: CoachContext): CoachReply {
  switch (intent) {
    case "progress": {
      const a = progressAnswer(ctx);
      return { intent, ...a };
    }
    case "weight": {
      const a = weightAnswer(ctx);
      return { intent, ...a };
    }
    case "meal": {
      const a = mealAnswer(ctx);
      return { intent, ...a, note: CONSULT_PROVIDER_NOTE };
    }
    case "workout": {
      const a = workoutAnswer(ctx);
      return { intent, ...a };
    }
    case "motivation": {
      const a = motivationAnswer(ctx);
      return { intent, ...a };
    }
    default:
      return { intent: "fallback", text: "" };
  }
}
