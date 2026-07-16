import type { MetricType } from "@/lib/validations/weight";

// Raw shape returned by Supabase (snake_case columns from body_metrics).
export interface BodyMetricRow {
  id: string;
  user_id: string;
  metric_type: MetricType;
  value: number;
  unit: string;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  metricType: MetricType;
  value: number;
  unit: string;
  recordedAt: string;
  notes: string | null;
}

export function mapBodyMetric(row: BodyMetricRow): BodyMetric {
  return {
    id: row.id,
    metricType: row.metric_type,
    value: row.value,
    unit: row.unit,
    recordedAt: row.recorded_at,
    notes: row.notes,
  };
}

export interface GoalRow {
  id: string;
  user_id: string;
  metric_type: MetricType;
  target_value: number;
  unit: string;
  start_value: number | null;
  target_date: string | null;
  achieved: boolean;
  achieved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  metricType: MetricType;
  targetValue: number;
  unit: string;
  startValue: number | null;
  targetDate: string | null;
  achieved: boolean;
  achievedAt: string | null;
  notes: string | null;
}

export function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    metricType: row.metric_type,
    targetValue: row.target_value,
    unit: row.unit,
    startValue: row.start_value,
    targetDate: row.target_date,
    achieved: row.achieved,
    achievedAt: row.achieved_at,
    notes: row.notes,
  };
}

export interface ProgressPhotoRow {
  id: string;
  user_id: string;
  storage_path: string;
  taken_at: string;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  storagePath: string;
  takenAt: string;
  weightKg: number | null;
  notes: string | null;
}

export function mapProgressPhoto(row: ProgressPhotoRow): ProgressPhoto {
  return {
    id: row.id,
    storagePath: row.storage_path,
    takenAt: row.taken_at,
    weightKg: row.weight_kg,
    notes: row.notes,
  };
}
