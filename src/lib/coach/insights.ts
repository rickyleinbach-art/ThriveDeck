import type { CoachContext, Insight, WeeklyReport } from "@/lib/coach/types";
import type { ScoreResult } from "@/lib/analytics/scores";
import {
  DIETARY_PATTERN_LABELS,
  PRIMARY_GOAL_LABELS,
} from "@/lib/validations/onboarding";

// Turns the coach context into plain-language review and suggestions. Every
// statement here is a summary of what the user logged or a general lifestyle
// tip — never medical advice, never dosing (see guardrails.ts). The chat
// layer reuses the answer builders below.

const round = (n: number) => Math.round(n);
const fmt1 = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

// A short "for your <goal>" phrase for coach copy, or "" if the goal is unset.
function goalPhrase(ctx: CoachContext): string {
  return ctx.goal ? ` for your ${PRIMARY_GOAL_LABELS[ctx.goal].toLowerCase()} goal` : "";
}

// Dietary constraints the coach should respect in meal suggestions.
function dietaryLine(ctx: CoachContext): string | null {
  const parts: string[] = [];
  if (ctx.dietaryPattern && ctx.dietaryPattern !== "NONE") {
    parts.push(`keeping it ${DIETARY_PATTERN_LABELS[ctx.dietaryPattern].toLowerCase()}`);
  }
  if (ctx.allergies && ctx.allergies.trim()) {
    parts.push(`avoiding ${ctx.allergies.trim()}`);
  }
  if (parts.length === 0) return null;
  const joined = parts.join(" and ");
  return joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
}

export interface Answer {
  text: string;
  bullets?: string[];
}

// ---- Weekly report (coach dashboard) ------------------------------------

export function buildWeeklyReport(ctx: CoachContext): WeeklyReport {
  const { scores } = ctx;
  const wins: Insight[] = [];
  const focus: Insight[] = [];
  const milestones: Insight[] = [];

  const scoreEntries: [string, ScoreResult][] = [
    ["Nutrition", scores.nutrition],
    ["Fitness", scores.fitness],
    ["Consistency", scores.consistency],
    ["Recovery", scores.recovery],
  ];

  for (const [label, s] of scoreEntries) {
    if (s.value === null) {
      focus.push({
        tone: "focus",
        title: `Start tracking ${label.toLowerCase()}`,
        detail: s.detail,
      });
    } else if (s.value >= 75) {
      wins.push({ tone: "win", title: `Strong ${label.toLowerCase()} week`, detail: `${s.value}/100 · ${s.detail}` });
    } else if (s.value < 50) {
      focus.push({ tone: "focus", title: `Room to grow: ${label.toLowerCase()}`, detail: `${s.value}/100 · ${s.detail}` });
    }
  }

  // Streak + activity milestones.
  if (ctx.streakDays >= 3) {
    milestones.push({
      tone: "milestone",
      title: `${ctx.streakDays}-day logging streak`,
      detail: "Consistency is the habit that drives every other result. Keep it going.",
    });
  }
  if (ctx.workouts30d >= 12) {
    milestones.push({
      tone: "milestone",
      title: `${ctx.workouts30d} workouts in the last 30 days`,
      detail: "That's a serious training volume — recovery and protein keep it productive.",
    });
  }

  // Weight progress milestone / win.
  if (ctx.weight) {
    const unit = ctx.weight.unit;
    if (ctx.weight.goalProgressPct !== null && ctx.weight.goalProgressPct >= 25) {
      milestones.push({
        tone: "milestone",
        title: `${round(ctx.weight.goalProgressPct)}% to your weight goal`,
        detail: ctx.weight.projectedGoalDate
          ? "You're trending toward your goal at your current pace."
          : "Real progress toward your target — keep the routine steady.",
      });
    }
    if (ctx.weight.changePerWeek !== null && Math.abs(ctx.weight.changePerWeek) >= 0.1) {
      const dir = ctx.weight.changePerWeek < 0 ? "down" : "up";
      wins.push({
        tone: "win",
        title: `Weight trending ${dir}`,
        detail: `About ${fmt1(Math.abs(ctx.weight.changePerWeek))} ${unit}/week over your logged range.`,
      });
    }
  }

  const overall = scores.wellness.value;
  const greeting = greetingFor(ctx.today);
  const gp = goalPhrase(ctx);
  const summary =
    overall === null
      ? `Log a few days of meals, workouts, or habits and I'll start summarizing your week${gp} and spotting trends.`
      : overall >= 75
      ? `You're having a strong week${gp} — an overall wellness score of ${overall}/100. Here's what stood out.`
      : overall >= 50
      ? `Solid week so far${gp}, with an overall wellness score of ${overall}/100. A couple of areas will move the needle most.`
      : `Your overall wellness score is ${overall}/100 this week. Small, consistent wins are the fastest way up${gp} — here's where to aim.`;

  return { greeting, summary, wins, focus, milestones };
}

function greetingFor(todayIso: string): string {
  // Hour isn't in context; keep it date-stable and time-neutral.
  const weekday = new Date(`${todayIso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  });
  return `Happy ${weekday} — here's your check-in`;
}

// ---- Chat answer builders (reused by chat.ts) ---------------------------

export function progressAnswer(ctx: CoachContext): Answer {
  const s = ctx.scores;
  if (s.wellness.value === null) {
    return {
      text: "I don't have enough logged yet to review your progress. Once you track meals, workouts, weight, or habits for a few days, I'll summarize trends and scores here.",
    };
  }
  const line = (label: string, r: ScoreResult) =>
    r.value === null ? `${label}: not tracked yet` : `${label}: ${r.value}/100 (${r.detail})`;
  return {
    text: `Here's your week at a glance — an overall wellness score of ${s.wellness.value}/100:`,
    bullets: [
      line("Nutrition", s.nutrition),
      line("Fitness", s.fitness),
      line("Consistency", s.consistency),
      line("Recovery", s.recovery),
    ],
  };
}

export function weightAnswer(ctx: CoachContext): Answer {
  const w = ctx.weight;
  if (!w || w.changePerWeek === null) {
    return {
      text: "I need a few weigh-ins before I can show a weight trend. Log your weight in the Weight tab and I'll track your weekly pace and project your goal date.",
    };
  }
  const dir = w.changePerWeek < 0 ? "losing" : w.changePerWeek > 0 ? "gaining" : "holding steady at";
  const bullets: string[] = [
    `Weekly pace: about ${fmt1(Math.abs(w.changePerWeek))} ${w.unit}/week (${dir}).`,
  ];
  if (w.projectedIn30Days !== null) {
    bullets.push(`Projected in 30 days: ~${fmt1(w.projectedIn30Days)} ${w.unit} at this pace.`);
  }
  if (w.goalProgressPct !== null) {
    bullets.push(`Goal progress: ${round(w.goalProgressPct)}% of the way there.`);
  }
  if (w.projectedGoalDate) {
    bullets.push(`Projected goal date: ${new Date(`${w.projectedGoalDate}T00:00:00Z`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.`);
  }
  return { text: "Here's your weight outlook from what you've logged:", bullets };
}

export function mealAnswer(ctx: CoachContext): Answer {
  const target = ctx.nutritionTarget;
  if (!target) {
    return {
      text: "Set your macro targets in the Nutrition tab and I'll tailor meal ideas to what's left in your day. In general, build each meal around a protein source, add vegetables for fiber and fullness, and round it out with a smart carb or healthy fat.",
    };
  }
  const eaten = ctx.consumedToday ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const remCal = Math.max(0, round(target.calories - eaten.calories));
  const remPro = Math.max(0, round(target.proteinG - eaten.proteinG));

  const bullets: string[] = [
    `Roughly ${remCal} kcal and ${remPro} g protein left for today.`,
    "Anchor your next meal with protein, then add vegetables and a carb or fat to fill the rest.",
  ];
  const diet = dietaryLine(ctx);
  if (diet) bullets.push(diet);
  if (ctx.proteinFoods.length > 0) {
    const picks = ctx.proteinFoods
      .slice(0, 3)
      .map((f) => `${f.name} (~${round(f.proteinG)} g protein / ${f.servingSize} ${f.servingUnit})`);
    bullets.push(`From your foods: ${picks.join("; ")}.`);
  }
  return {
    text: remCal > 0
      ? "Here's a simple way to spend what's left in your day:"
      : "You've hit your calorie target for today — nice work. If you're still hungry, lean on protein and vegetables:",
    bullets,
  };
}

export function workoutAnswer(ctx: CoachContext): Answer {
  const bullets: string[] = [];
  const since = ctx.daysSinceWorkout;

  let text: string;
  if (since === null) {
    text = "You haven't logged a workout yet. A simple start is 3 sessions this week — even short ones build the habit.";
  } else if (since <= 1) {
    text = "You trained today or yesterday — good cadence. Give worked muscles a day to recover and rotate focus.";
  } else if (since <= 3) {
    text = `It's been ${since} days since your last workout. A good window to get the next session in.`;
  } else {
    text = `It's been ${since} days since your last logged workout. No guilt — just start with an easy session to get rolling again.`;
  }

  const fit = ctx.scores.fitness;
  if (fit.value !== null) {
    bullets.push(`This week: ${fit.detail} (fitness score ${fit.value}/100).`);
  }
  if (ctx.trainingDaysPerWeek && ctx.trainingDaysPerWeek > 0) {
    bullets.push(
      `You set aside ${ctx.trainingDaysPerWeek} day${ctx.trainingDaysPerWeek === 1 ? "" : "s"}/week to train — spread them so no muscle group is worked two days running.`
    );
  } else {
    bullets.push("Aim for a mix across the week: strength, some cardio, and daily steps.");
  }
  if (ctx.experience === "NEW") {
    bullets.push("New to training? Start with the guided beginner program and focus on form over load.");
  } else if (ctx.experience === "ADVANCED") {
    bullets.push("With your experience, progressive overload and periodization will matter more than variety.");
  }

  if (ctx.templates.length > 0) {
    const names = ctx.templates.slice(0, 3).map((t) => t.name);
    bullets.push(`Ready to start: ${names.join(", ")} — open the Exercise tab to begin one.`);
  }
  return { text, bullets };
}

export function motivationAnswer(ctx: CoachContext): Answer {
  const bullets: string[] = [];
  if (ctx.streakDays >= 1) {
    bullets.push(`You're on a ${ctx.streakDays}-day logging streak — protect it with one small entry today.`);
  }
  if (ctx.workouts30d > 0) {
    bullets.push(`${ctx.workouts30d} workouts in the last 30 days. Every one counts.`);
  }
  if (ctx.weight && ctx.weight.goalProgressPct !== null && ctx.weight.goalProgressPct > 0) {
    bullets.push(`You're ${round(ctx.weight.goalProgressPct)}% of the way to your weight goal already.`);
  }
  if (bullets.length === 0) {
    bullets.push("The first win is just showing up — log one thing today and let the streak start.");
  }
  return {
    text: "Consistency beats intensity every time. Here's your evidence that it's working:",
    bullets,
  };
}
