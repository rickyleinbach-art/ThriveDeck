import { z } from "zod";

// Health metrics (Module 6). Vitals, labs, a record-only medication
// list, and medical history. Medication dose/frequency fields are
// transcriptions of the user's own prescription — the app validates
// shape only and never computes, defaults, or suggests any value.
// Mirrors prisma/schema.prisma.

export const HEALTH_METRIC_KINDS = [
  "BLOOD_PRESSURE",
  "HEART_RATE",
  "RESTING_HEART_RATE",
  "HRV",
  "BLOOD_GLUCOSE",
] as const;
export type HealthMetricKind = (typeof HEALTH_METRIC_KINDS)[number];

export const HEALTH_METRIC_KIND_LABELS: Record<HealthMetricKind, string> = {
  BLOOD_PRESSURE: "Blood pressure",
  HEART_RATE: "Heart rate",
  RESTING_HEART_RATE: "Resting heart rate",
  HRV: "HRV",
  BLOOD_GLUCOSE: "Blood glucose",
};

export const HEALTH_METRIC_UNITS: Record<HealthMetricKind, string> = {
  BLOOD_PRESSURE: "mmHg",
  HEART_RATE: "bpm",
  RESTING_HEART_RATE: "bpm",
  HRV: "ms",
  BLOOD_GLUCOSE: "mg/dL",
};

export const CONDITION_STATUSES = ["ACTIVE", "MANAGED", "RESOLVED"] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export const CONDITION_STATUS_LABELS: Record<ConditionStatus, string> = {
  ACTIVE: "Active",
  MANAGED: "Managed",
  RESOLVED: "Resolved",
};

// Blood pressure stores systolic in value and diastolic in secondaryValue.
export const healthMetricSchema = z
  .object({
    kind: z.enum(HEALTH_METRIC_KINDS),
    value: z.number().positive("Enter a value greater than 0").max(10000),
    secondaryValue: z
      .number()
      .positive("Enter a value greater than 0")
      .max(10000)
      .optional(),
    measuredAt: z.string().min(1, "Pick a date and time"),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => data.kind !== "BLOOD_PRESSURE" || data.secondaryValue !== undefined,
    { message: "Enter the diastolic (bottom) number", path: ["secondaryValue"] }
  );

export type HealthMetricInput = z.infer<typeof healthMetricSchema>;

export const labResultSchema = z
  .object({
    testName: z.string().min(1, "Enter the test name").max(120),
    value: z.number().min(0, "Enter the result value").max(1000000),
    unit: z.string().min(1, "Enter the unit").max(30),
    referenceLow: z.number().min(0).max(1000000).optional(),
    referenceHigh: z.number().min(0).max(1000000).optional(),
    collectedOn: z.string().min(1, "Pick the collection date"),
    labName: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) =>
      data.referenceLow === undefined ||
      data.referenceHigh === undefined ||
      data.referenceLow <= data.referenceHigh,
    { message: "Reference range low must not exceed high", path: ["referenceHigh"] }
  );

export type LabResultInput = z.infer<typeof labResultSchema>;

// Record-only: every field is the user's transcription of their own
// prescription. Nothing is suggested or defaulted by the app.
export const medicationSchema = z.object({
  name: z.string().min(1, "Enter the medication name").max(200),
  doseText: z.string().max(200).optional(),
  frequency: z.string().max(200).optional(),
  reason: z.string().max(200).optional(),
  prescriber: z.string().max(200).optional(),
  startedOn: z.string().optional(),
  endedOn: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type MedicationInput = z.infer<typeof medicationSchema>;

export const conditionSchema = z.object({
  name: z.string().min(1, "Enter the condition").max(200),
  status: z.enum(CONDITION_STATUSES).default("ACTIVE"),
  diagnosedOn: z.string().optional(),
  resolvedOn: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type ConditionInput = z.infer<typeof conditionSchema>;
