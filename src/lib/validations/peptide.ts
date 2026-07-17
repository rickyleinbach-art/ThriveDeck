import { z } from "zod";

// Peptides (Module 5) — SAFETY CRITICAL.
// Every dose/frequency field here is a transcription of the user's own
// prescription. The app validates shape only; it never computes, defaults,
// or suggests any value. Mirrors prisma/schema.prisma enums.

export const PEPTIDE_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
export type PeptideStatus = (typeof PEPTIDE_STATUSES)[number];

export const PEPTIDE_STATUS_LABELS: Record<PeptideStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export const DOSE_UNITS = ["MG", "MCG", "IU", "ML", "UNITS"] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number];

export const DOSE_UNIT_LABELS: Record<DoseUnit, string> = {
  MG: "mg",
  MCG: "mcg",
  IU: "IU",
  ML: "mL",
  UNITS: "units",
};

export const INJECTION_STATUSES = ["LOGGED", "MISSED"] as const;
export type InjectionStatus = (typeof INJECTION_STATUSES)[number];

export const INJECTION_SITES = [
  "ABDOMEN_LEFT",
  "ABDOMEN_RIGHT",
  "THIGH_LEFT",
  "THIGH_RIGHT",
  "GLUTE_LEFT",
  "GLUTE_RIGHT",
  "ARM_LEFT",
  "ARM_RIGHT",
  "OTHER",
] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

export const INJECTION_SITE_LABELS: Record<InjectionSite, string> = {
  ABDOMEN_LEFT: "Abdomen (left)",
  ABDOMEN_RIGHT: "Abdomen (right)",
  THIGH_LEFT: "Thigh (left)",
  THIGH_RIGHT: "Thigh (right)",
  GLUTE_LEFT: "Glute (left)",
  GLUTE_RIGHT: "Glute (right)",
  ARM_LEFT: "Arm (left)",
  ARM_RIGHT: "Arm (right)",
  OTHER: "Other",
};

export const REMINDER_KINDS = ["DOSE", "REFILL", "LAB", "APPOINTMENT"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMINDER_KIND_LABELS: Record<ReminderKind, string> = {
  DOSE: "Dose",
  REFILL: "Refill",
  LAB: "Lab work",
  APPOINTMENT: "Provider appointment",
};

export const SIDE_EFFECT_SEVERITIES = ["MILD", "MODERATE", "SEVERE"] as const;
export type SideEffectSeverity = (typeof SIDE_EFFECT_SEVERITIES)[number];

export const SIDE_EFFECT_SEVERITY_LABELS: Record<SideEffectSeverity, string> = {
  MILD: "Mild",
  MODERATE: "Moderate",
  SEVERE: "Severe",
};

export const CARE_PROVIDER_KINDS = ["PROVIDER", "PHARMACY"] as const;
export type CareProviderKind = (typeof CARE_PROVIDER_KINDS)[number];

export const CARE_PROVIDER_KIND_LABELS: Record<CareProviderKind, string> = {
  PROVIDER: "Healthcare provider",
  PHARMACY: "Pharmacy",
};

export const peptideSchema = z.object({
  name: z.string().min(1, "Enter the peptide name").max(120),
  status: z.enum(PEPTIDE_STATUSES).default("ACTIVE"),
  doseAmount: z.number().positive("Dose must be greater than 0").max(100000).optional(),
  doseUnit: z.enum(DOSE_UNITS).optional(),
  frequency: z.string().max(200).optional(),
  startedOn: z.string().optional(),
  endedOn: z.string().optional(),
  lotNumber: z.string().max(120).optional(),
  expiresOn: z.string().optional(),
  providerId: z.string().uuid().optional(),
  pharmacyId: z.string().uuid().optional(),
  protocolNotes: z.string().max(2000).optional(),
});

export type PeptideInput = z.infer<typeof peptideSchema>;

export const injectionSchema = z.object({
  peptideId: z.string().uuid("Pick a peptide"),
  status: z.enum(INJECTION_STATUSES).default("LOGGED"),
  injectedAt: z.string().min(1, "Pick a date and time"),
  doseAmount: z.number().positive("Dose must be greater than 0").max(100000).optional(),
  doseUnit: z.enum(DOSE_UNITS).optional(),
  site: z.enum(INJECTION_SITES).optional(),
  lotNumber: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export type InjectionInput = z.infer<typeof injectionSchema>;

export const reminderSchema = z.object({
  kind: z.enum(REMINDER_KINDS),
  title: z.string().min(1, "Enter a title").max(200),
  dueAt: z.string().min(1, "Pick a date and time"),
  repeatEveryDays: z.number().int().positive().max(365).optional(),
  peptideId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type ReminderInput = z.infer<typeof reminderSchema>;

export const sideEffectSchema = z.object({
  peptideId: z.string().uuid().optional(),
  occurredAt: z.string().min(1, "Pick a date"),
  severity: z.enum(SIDE_EFFECT_SEVERITIES),
  description: z.string().min(1, "Describe what you noticed").max(2000),
});

export type SideEffectInput = z.infer<typeof sideEffectSchema>;

export const journalEntrySchema = z.object({
  peptideId: z.string().uuid().optional(),
  entryDate: z.string().min(1, "Pick a date"),
  content: z.string().min(1, "Write something first").max(5000),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

export const careProviderSchema = z.object({
  kind: z.enum(CARE_PROVIDER_KINDS),
  name: z.string().min(1, "Enter a name").max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email("Enter a valid email").max(200).optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type CareProviderInput = z.infer<typeof careProviderSchema>;
