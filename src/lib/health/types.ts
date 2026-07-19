import type { ConditionStatus, HealthMetricKind } from "@/lib/validations/health";

// Raw shapes returned by Supabase (snake_case columns) and their
// camelCase domain mappings, following the weight/nutrition modules.

export interface HealthMetricRow {
  id: string;
  user_id: string;
  kind: HealthMetricKind;
  value: number;
  secondary_value: number | null;
  unit: string;
  measured_at: string;
  notes: string | null;
  created_at: string;
}

export interface HealthMetric {
  id: string;
  kind: HealthMetricKind;
  value: number;
  secondaryValue: number | null;
  unit: string;
  measuredAt: string;
  notes: string | null;
}

export function mapHealthMetric(row: HealthMetricRow): HealthMetric {
  return {
    id: row.id,
    kind: row.kind,
    value: row.value,
    secondaryValue: row.secondary_value,
    unit: row.unit,
    measuredAt: row.measured_at,
    notes: row.notes,
  };
}

// "120/80 mmHg" for blood pressure, "62 bpm" for everything else.
export function formatMetricValue(metric: HealthMetric): string {
  const value =
    metric.secondaryValue !== null
      ? `${metric.value}/${metric.secondaryValue}`
      : `${metric.value}`;
  return `${value} ${metric.unit}`;
}

export interface LabResultRow {
  id: string;
  user_id: string;
  test_name: string;
  value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  collected_on: string;
  lab_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface LabResult {
  id: string;
  testName: string;
  value: number;
  unit: string;
  referenceLow: number | null;
  referenceHigh: number | null;
  collectedOn: string;
  labName: string | null;
  notes: string | null;
}

export function mapLabResult(row: LabResultRow): LabResult {
  return {
    id: row.id,
    testName: row.test_name,
    value: row.value,
    unit: row.unit,
    referenceLow: row.reference_low,
    referenceHigh: row.reference_high,
    collectedOn: row.collected_on,
    labName: row.lab_name,
    notes: row.notes,
  };
}

// Educational flag only — outside the report's own reference range.
export function isOutsideReferenceRange(lab: LabResult): boolean {
  if (lab.referenceLow !== null && lab.value < lab.referenceLow) return true;
  if (lab.referenceHigh !== null && lab.value > lab.referenceHigh) return true;
  return false;
}

export interface MedicationRow {
  id: string;
  user_id: string;
  name: string;
  dose_text: string | null;
  frequency: string | null;
  reason: string | null;
  prescriber: string | null;
  started_on: string | null;
  ended_on: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  name: string;
  doseText: string | null;
  frequency: string | null;
  reason: string | null;
  prescriber: string | null;
  startedOn: string | null;
  endedOn: string | null;
  active: boolean;
  notes: string | null;
}

export function mapMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    doseText: row.dose_text,
    frequency: row.frequency,
    reason: row.reason,
    prescriber: row.prescriber,
    startedOn: row.started_on,
    endedOn: row.ended_on,
    active: row.active,
    notes: row.notes,
  };
}

export interface MedicalConditionRow {
  id: string;
  user_id: string;
  name: string;
  status: ConditionStatus;
  diagnosed_on: string | null;
  resolved_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalCondition {
  id: string;
  name: string;
  status: ConditionStatus;
  diagnosedOn: string | null;
  resolvedOn: string | null;
  notes: string | null;
}

export function mapMedicalCondition(row: MedicalConditionRow): MedicalCondition {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    diagnosedOn: row.diagnosed_on,
    resolvedOn: row.resolved_on,
    notes: row.notes,
  };
}
