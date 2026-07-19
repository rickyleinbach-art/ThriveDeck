import { z } from "zod";

// Analytics is read-only, but the range/granularity selection is still user
// input — validate it like everything else (CLAUDE.md § Working rules).

export const GRANULARITIES = ["daily", "weekly", "monthly", "yearly"] as const;
export const granularitySchema = z.enum(GRANULARITIES);
export type Granularity = z.infer<typeof granularitySchema>;

export const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

// Named windows plus a custom start/end. Values are trailing-day counts;
// "custom" is resolved from the explicit dates instead.
export const RANGE_PRESETS = ["7d", "30d", "90d", "1y", "all", "custom"] as const;
export const rangePresetSchema = z.enum(RANGE_PRESETS);
export type RangePreset = z.infer<typeof rangePresetSchema>;

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "1y": "1 year",
  all: "All time",
  custom: "Custom",
};

// "YYYY-MM-DD" calendar day, matching how the rest of the app keys days.
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

export const dateRangeSchema = z
  .object({ start: isoDateSchema, end: isoDateSchema })
  .refine((r) => r.start <= r.end, {
    message: "Start date must be on or before the end date",
  });
export type DateRange = z.infer<typeof dateRangeSchema>;
