import { createClient } from "@/lib/supabase/server";
import {
  mapHealthMetric,
  mapLabResult,
  mapMedicalCondition,
  mapMedication,
  type HealthMetric,
  type HealthMetricRow,
  type LabResult,
  type LabResultRow,
  type MedicalCondition,
  type MedicalConditionRow,
  type Medication,
  type MedicationRow,
} from "@/lib/health/types";
import {
  mapCareProvider,
  type CareProvider,
  type CareProviderRow,
} from "@/lib/peptides/types";
import type { HealthMetricKind } from "@/lib/validations/health";

// Server-side reads. RLS scopes every query to the signed-in user already;
// the explicit user_id filter below is defense in depth, not the boundary.
export async function getHealthMetrics(options?: {
  kind?: HealthMetricKind;
  limit?: number;
}): Promise<HealthMetric[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false });

  if (options?.kind) {
    query = query.eq("kind", options.kind);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as HealthMetricRow[]).map(mapHealthMetric);
}

export async function getLabResults(options?: { limit?: number }): Promise<LabResult[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("lab_results")
    .select("*")
    .eq("user_id", user.id)
    .order("collected_on", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as LabResultRow[]).map(mapLabResult);
}

export async function getMedications(): Promise<Medication[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", user.id)
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as MedicationRow[]).map(mapMedication);
}

export async function getMedicalConditions(): Promise<MedicalCondition[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("medical_conditions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as MedicalConditionRow[]).map(mapMedicalCondition);
}

// Read-only view of the shared care_providers table (owned by the
// Peptides module, where providers are managed).
export async function getCareProviders(): Promise<CareProvider[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("care_providers")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as CareProviderRow[]).map(mapCareProvider);
}
