// Curated educational content for the coach (PRD § AI Coach: "provides
// educational content"). Every entry is general lifestyle/nutrition/training
// information — never medical advice and never dosing. Topics that drift
// toward medication are handled by the guardrail, not here.

export interface EducationTopic {
  id: string;
  title: string;
  keywords: string[]; // matched against the user's question, lowercased
  body: string;
  bullets?: string[];
}

export const EDUCATION_TOPICS: EducationTopic[] = [
  {
    id: "protein",
    title: "Why protein matters",
    keywords: ["protein", "muscle", "macros", "amino"],
    body:
      "Protein helps preserve and build lean muscle, keeps you full, and has the highest thermic effect of the macros. A common general guideline for active people is roughly 1.6–2.2 g per kg of body weight per day, spread across meals.",
    bullets: [
      "Anchor each meal with a protein source (eggs, poultry, fish, dairy, legumes, tofu).",
      "Spreading protein across 3–4 meals supports muscle repair better than one large hit.",
      "Track it in the Nutrition tab against your target to see your weekly average.",
    ],
  },
  {
    id: "hydration",
    title: "Hydration basics",
    keywords: ["water", "hydrate", "hydration", "drink", "thirsty"],
    body:
      "Staying hydrated supports energy, appetite regulation, and workout performance. Needs vary with body size, climate, and activity, but a practical habit is to drink consistently through the day rather than all at once.",
    bullets: [
      "Keep a bottle visible — a cue makes the habit automatic.",
      "Thirst, dark urine, and afternoon energy dips are simple signals to drink more.",
      "Log water as a habit to watch your daily average trend up.",
    ],
  },
  {
    id: "sleep",
    title: "Sleep and recovery",
    keywords: ["sleep", "recovery", "rest", "tired", "insomnia", "recover"],
    body:
      "Sleep is when most recovery, hormone regulation, and appetite balancing happen. Most adults do best with 7–9 hours. Consistency of sleep and wake times matters as much as total duration.",
    bullets: [
      "Keep a steady schedule, even on weekends.",
      "Dim screens and lights in the hour before bed.",
      "Poor sleep often shows up as higher hunger and lower training output the next day.",
    ],
  },
  {
    id: "deficit",
    title: "Weight loss and calorie balance",
    keywords: ["deficit", "lose weight", "weight loss", "fat loss", "cut", "calorie", "calories"],
    body:
      "Fat loss comes down to a sustained, moderate energy deficit. A modest deficit (often around 0.5–1% of body weight per week) tends to be more sustainable and better protects muscle than aggressive cuts.",
    bullets: [
      "Keep protein high and strength-train to preserve lean mass while losing fat.",
      "Weigh trends over weeks, not day to day — daily weight is noisy.",
      "Set a weight goal in the Weight tab so your projected pace shows up in Analytics.",
    ],
  },
  {
    id: "muscle",
    title: "Building muscle",
    keywords: ["gain muscle", "build muscle", "bulk", "hypertrophy", "grow", "gains", "stronger"],
    body:
      "Muscle growth needs a progressive training stimulus, enough protein, and adequate recovery. Gradually increasing reps, weight, or sets over time (progressive overload) is the core driver.",
    bullets: [
      "Train each muscle group with enough weekly volume and add a little over time.",
      "Eat at maintenance or a slight surplus with sufficient protein.",
      "Log your sets so PRs and volume trends are visible in Exercise and Analytics.",
    ],
  },
  {
    id: "steps",
    title: "Steps and daily movement",
    keywords: ["steps", "walking", "walk", "neat", "movement", "active"],
    body:
      "Everyday movement (NEAT) is a large and often overlooked part of total energy expenditure. Steps are an easy, low-impact way to raise it without formal cardio.",
    bullets: [
      "A step target you can hit most days beats an occasional big walk.",
      "Short walks after meals are an easy way to accumulate volume.",
      "Track steps as a habit to see your daily average.",
    ],
  },
  {
    id: "fiber",
    title: "Fiber and whole foods",
    keywords: ["fiber", "fibre", "vegetables", "veggies", "whole foods", "gut", "digestion", "full"],
    body:
      "Fiber supports fullness, steadier energy, and digestive health. Most people fall short of general targets (often ~25–38 g/day). Whole plants — vegetables, fruit, legumes, whole grains — are the easiest sources.",
    bullets: [
      "Add a vegetable or fruit to each meal as a default.",
      "Higher-fiber meals tend to keep you fuller on fewer calories.",
      "Increase fiber gradually and drink water alongside it.",
    ],
  },
  {
    id: "consistency",
    title: "Consistency over perfection",
    keywords: ["consistency", "motivation", "habit", "stuck", "give up", "fell off", "restart", "discipline"],
    body:
      "Long-term results come from a routine you can repeat, not from perfect weeks. Missing a day matters far less than what you do the next day. Small, tracked habits compound.",
    bullets: [
      "Aim to log something every day — the streak itself builds the habit.",
      "Make the next healthy choice easy rather than trying to be perfect.",
      "Review your weekly scores here to see the trend, not the noise.",
    ],
  },
  {
    id: "plateau",
    title: "Breaking a plateau",
    keywords: ["plateau", "stall", "stalled", "not losing", "stopped losing", "no progress"],
    body:
      "Plateaus are normal. Before changing anything drastic, confirm the data: check whether logging has slipped, weight is truly flat over 2–3 weeks, and activity has dropped. Small, consistent adjustments usually restart progress.",
    bullets: [
      "Tighten food logging for a week to see your real intake.",
      "Add daily steps before cutting calories further.",
      "Make sure sleep and protein haven't slipped — both affect the scale.",
    ],
  },
  {
    id: "stress",
    title: "Stress and appetite",
    keywords: ["stress", "stressed", "cortisol", "emotional eating", "cravings", "overwhelmed"],
    body:
      "Stress can raise appetite and cravings and disrupt sleep, which makes healthy routines harder. Managing stress is part of managing weight and energy, not separate from it.",
    bullets: [
      "Short walks, breathing, and a consistent sleep schedule all help.",
      "Plan for high-stress days with easy, pre-decided healthy meals.",
      "Track mood, energy, and stress as habits to spot patterns.",
    ],
  },
];

// Best-matching topic for a free-text question, or null. Scores by the number
// of distinct keyword hits so the most specific topic wins.
export function matchEducationTopic(message: string): EducationTopic | null {
  const text = message.toLowerCase();
  let best: EducationTopic | null = null;
  let bestScore = 0;
  for (const topic of EDUCATION_TOPICS) {
    const score = topic.keywords.reduce(
      (n, kw) => (text.includes(kw) ? n + 1 : n),
      0
    );
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}
