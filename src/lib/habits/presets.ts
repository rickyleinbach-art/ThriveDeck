import type { HabitGoalType, HabitType } from "@/lib/validations/habit";

// The PRD habit list as pick-one presets. These prefill the add-habit
// form; users can rename or retarget anything. Targets are generic
// wellness starting points, not medical guidance.

export interface HabitPreset {
  type: HabitType;
  label: string;
  goalType: HabitGoalType;
  unit?: string;
  defaultTarget?: number;
}

export const HABIT_PRESETS: HabitPreset[] = [
  { type: "SLEEP", label: "Sleep", goalType: "DURATION", unit: "hours", defaultTarget: 8 },
  { type: "WATER", label: "Drink water", goalType: "QUANTITY", unit: "oz", defaultTarget: 64 },
  { type: "MEDITATION", label: "Meditate", goalType: "DURATION", unit: "min", defaultTarget: 10 },
  { type: "READING", label: "Read", goalType: "DURATION", unit: "min", defaultTarget: 20 },
  { type: "STRETCHING", label: "Stretch", goalType: "DURATION", unit: "min", defaultTarget: 10 },
  { type: "PROTEIN", label: "Hit protein target", goalType: "CHECK" },
  { type: "FIBER", label: "Hit fiber target", goalType: "CHECK" },
  { type: "SUPPLEMENTS", label: "Take supplements", goalType: "CHECK" },
  { type: "STEPS", label: "Steps", goalType: "QUANTITY", unit: "steps", defaultTarget: 10000 },
  { type: "WALK", label: "Go for a walk", goalType: "CHECK" },
  { type: "ROUTINE", label: "Morning routine", goalType: "CHECK" },
  { type: "SUNLIGHT", label: "Get sunlight", goalType: "DURATION", unit: "min", defaultTarget: 15 },
  { type: "MOOD", label: "Rate your mood", goalType: "RATING" },
  { type: "ENERGY", label: "Rate your energy", goalType: "RATING" },
  { type: "STRESS", label: "Rate your stress", goalType: "RATING" },
  { type: "CUSTOM", label: "Custom habit", goalType: "CHECK" },
];

export function getPreset(type: HabitType): HabitPreset {
  return HABIT_PRESETS.find((p) => p.type === type) ?? HABIT_PRESETS[HABIT_PRESETS.length - 1];
}
