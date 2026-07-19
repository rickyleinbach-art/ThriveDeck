// SAFETY CRITICAL (CLAUDE.md § Health & safety — non-negotiable).
//
// The AI Coach NEVER prescribes medication, suggests peptide/medication
// dosing, interprets lab results, or diagnoses. Because this coach is
// deterministic, every word it can emit lives in this codebase — so we can
// *guarantee* no dose or medical instruction is ever produced. This module
// is the gate: any message that trips it is answered with a fixed
// educational response that always redirects to a licensed provider.
//
// The classifier is intentionally broad and fail-safe: when a message looks
// even loosely medical, we prefer the guardrail response over a coaching
// answer. Precision loss here is acceptable; a missed dosing question is not.

export type MedicalTopic = "dosing" | "medical";

// Nothing user-entered is logged here (no console output of message text),
// consistent with the no-health-data-in-logs rule.

// Dosing / medication-management intent. Peptide + medication names are
// included so "how much tirzepatide" or "when do I inject" is caught before
// any coaching path can see it.
const DOSING_PATTERNS: RegExp[] = [
  /\b(dose|doses|dosage|dosing|titrat\w*|microdos\w*)\b/i,
  /\bhow\s+(much|many)\b[\s\S]*\b(take|inject|use|dose|mg|mcg|iu|units?)\b/i,
  /\bhow\s+(much|many)\s+(should|do|can|of)\b/i,
  /\b(should|can|do)\s+i\s+(take|inject|increase|decrease|up|lower|raise|stop|start|split|stack|cycle)\b/i,
  /\b(increase|decrease|raise|lower|adjust|change|split|ramp|taper)\b[\s\S]*\b(dose|dosage|mg|mcg|iu|units?|injection|shot)\b/i,
  /\b\d+(\.\d+)?\s?(mg|mcg|iu|units?|ml|cc)\b/i,
  /\b(mg|mcg|iu)\s+(per|a|each)\s+(day|week|dose|injection)\b/i,
  /\b(stack|cycle|protocol|reconstitut\w*|bac\s?water|bacteriostatic)\b/i,
  /\b(how|when|where)\s+(to|do i|should i)\s+(inject|reconstitute|mix|pin)\b/i,
  /\b(tirzepatide|semaglutide|retatrutide|ozempic|wegovy|mounjaro|zepbound|liraglutide|saxenda|bpc[\s-]?157|tb[\s-]?500|ipamorelin|cjc[\s-]?1295|sermorelin|tesamorelin|ghrp|hcg|mk[\s-]?677|metformin|testosterone|trt)\b/i,
];

// Broader medical-advice intent: diagnosis, symptom interpretation, lab
// reading, drug interactions, or whether to start/stop a treatment.
const MEDICAL_PATTERNS: RegExp[] = [
  /\b(diagnos\w*|prescrib\w*|prescription)\b/i,
  /\b(is|are)\s+(this|these|it|that|my)\b[\s\S]*\b(normal|dangerous|serious|safe|harmful|bad)\b/i,
  /\b(interpret|read|explain|understand)\b[\s\S]*\b(lab|labs|bloodwork|blood work|results?|panel|a1c|cholesterol|tsh|testosterone|hormone)\b/i,
  /\b(side\s?effect|reaction|interaction|contraindicat\w*)\b/i,
  /\b(should i)\s+(be worried|see a doctor|go to|stop|start|take)\b/i,
  /\b(symptom|nausea|dizzy|dizziness|chest pain|heart palpitations|fainting|vomit\w*|rash|swelling)\b/i,
  /\b(medication|medicine|drug|peptide|supplement)\b[\s\S]*\b(safe|dangerous|interact\w*|mix|combine|with)\b/i,
  /\b(treat|cure|heal)\b[\s\S]*\b(condition|disease|illness|diabetes|thyroid|pcos)\b/i,
];

// Returns the medical topic a message trips, or null if it is safe to
// answer through the normal coaching paths. Dosing takes priority because
// it is the highest-risk category.
export function classifyMedical(message: string): MedicalTopic | null {
  const text = message.normalize("NFKC");
  if (DOSING_PATTERNS.some((re) => re.test(text))) return "dosing";
  if (MEDICAL_PATTERNS.some((re) => re.test(text))) return "medical";
  return null;
}

export interface GuardrailResponse {
  text: string;
  bullets?: string[];
  // Rendered with the prominent safety styling in the chat.
  safety: true;
}

// Fixed, dose-free responses. These strings are the ONLY thing the coach
// says to a medical/dosing question — there are no numbers, amounts, or
// instructions anywhere in them, by construction.
export function medicalGuardrailResponse(topic: MedicalTopic): GuardrailResponse {
  if (topic === "dosing") {
    return {
      safety: true,
      text:
        "I can't help with medication or peptide dosing — how much to take, " +
        "when to inject, or how to adjust a protocol. That's a decision only a " +
        "licensed healthcare provider can make for you safely.",
      bullets: [
        "Bring this question to the provider who prescribed your medication or peptide.",
        "Never change a dose, schedule, or protocol on your own.",
        "Use the Peptides section only to record what your provider has already prescribed.",
      ],
    };
  }
  return {
    safety: true,
    text:
      "I'm not able to give medical advice, interpret lab results, or tell you " +
      "whether a symptom is normal or serious. For anything medical, please " +
      "consult a licensed healthcare provider who can review your full history.",
    bullets: [
      "If a symptom feels urgent or severe, contact your provider or emergency services now.",
      "Share lab results and side effects with your provider — they can interpret them in context.",
      "I'm happy to help with the everyday lifestyle side: nutrition, training, sleep, and consistency.",
    ],
  };
}

// A one-line reminder appended wherever the coach touches health-adjacent
// territory without tripping the full guardrail (e.g. general education).
export const CONSULT_PROVIDER_NOTE =
  "This is general educational information, not medical advice. Talk to a licensed healthcare provider about your individual situation.";
