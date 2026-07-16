import { z } from "zod";

// Every tracked series in PRD § Weight Loss lives in one flexible table,
// keyed by this metric type — mirrors prisma/schema.prisma MetricType.
export const METRIC_TYPES = [
  "WEIGHT",
  "BODY_FAT",
  "LEAN_MASS",
  "WAIST",
  "CHEST",
  "ARMS",
  "LEGS",
  "NECK",
  "HIP",
] as const;

export type MetricType = (typeof METRIC_TYPES)[number];

export const METRIC_LABELS: Record<MetricType, string> = {
  WEIGHT: "Weight",
  BODY_FAT: "Body fat",
  LEAN_MASS: "Lean muscle mass",
  WAIST: "Waist",
  CHEST: "Chest",
  ARMS: "Arms",
  LEGS: "Legs",
  NECK: "Neck",
  HIP: "Hip",
};

export const MEASUREMENT_UNITS = ["kg", "lb", "%", "cm", "in"] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const UNITS_FOR_METRIC: Record<MetricType, readonly MeasurementUnit[]> = {
  WEIGHT: ["kg", "lb"],
  BODY_FAT: ["%"],
  LEAN_MASS: ["kg", "lb"],
  WAIST: ["cm", "in"],
  CHEST: ["cm", "in"],
  ARMS: ["cm", "in"],
  LEGS: ["cm", "in"],
  NECK: ["cm", "in"],
  HIP: ["cm", "in"],
};

export const bodyMetricSchema = z.object({
  metricType: z.enum(METRIC_TYPES),
  value: z.number().positive("Enter a value greater than 0").max(1000),
  unit: z.enum(MEASUREMENT_UNITS),
  recordedAt: z.string().min(1, "Pick a date"),
  notes: z.string().max(500).optional(),
});

export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;

export const goalSchema = z.object({
  metricType: z.enum(METRIC_TYPES),
  targetValue: z.number().positive("Enter a target greater than 0").max(1000),
  unit: z.enum(MEASUREMENT_UNITS),
  startValue: z.number().positive().max(1000).optional(),
  targetDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const progressPhotoSchema = z.object({
  takenAt: z.string().min(1, "Pick a date"),
  weightKg: z.number().positive().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export type ProgressPhotoInput = z.infer<typeof progressPhotoSchema>;

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Photo must be a JPEG, PNG, or WEBP image";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be under 10MB";
  }
  return null;
}
