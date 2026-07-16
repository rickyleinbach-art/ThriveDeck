import { createClient } from "@/lib/supabase/server";
import {
  mapBodyMetric,
  mapGoal,
  mapProgressPhoto,
  type BodyMetric,
  type BodyMetricRow,
  type Goal,
  type GoalRow,
  type ProgressPhoto,
  type ProgressPhotoRow,
} from "@/lib/weight/types";
import type { MetricType } from "@/lib/validations/weight";

// Server-side reads. RLS scopes every query to the signed-in user already;
// the explicit user_id filter below is defense in depth, not the boundary.
export async function getBodyMetrics(options?: {
  metricType?: MetricType;
  limit?: number;
}): Promise<BodyMetric[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  if (options?.metricType) {
    query = query.eq("metric_type", options.metricType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as BodyMetricRow[]).map(mapBodyMetric);
}

export async function getLatestMetric(metricType: MetricType): Promise<BodyMetric | null> {
  const [latest] = await getBodyMetrics({ metricType, limit: 1 });
  return latest ?? null;
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as GoalRow[]).map(mapGoal);
}

export async function getGoalForMetric(metricType: MetricType): Promise<Goal | null> {
  const goals = await getGoals();
  return goals.find((g) => g.metricType === metricType && !g.achieved) ?? null;
}

export interface WeightProfileInfo {
  heightCm: number | null;
  unitSystem: "METRIC" | "IMPERIAL";
  goalWeightKg: number | null;
}

// Height, unit preference, and goal weight live on the foundation `profiles`
// table (Module 1) — read-only here, used to compute BMI and default units.
export async function getWeightProfileInfo(): Promise<WeightProfileInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("height_cm, unit_system, goal_weight_kg")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return {
    heightCm: data.height_cm,
    unitSystem: data.unit_system,
    goalWeightKg: data.goal_weight_kg,
  };
}

export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProgressPhotoRow[]).map(mapProgressPhoto);
}

export interface ProgressPhotoWithUrl extends ProgressPhoto {
  signedUrl: string | null;
}

// Photos live in a private bucket (see migration RLS) — signed URLs are the
// only way to render them, and they expire quickly.
export async function getProgressPhotosWithUrls(): Promise<ProgressPhotoWithUrl[]> {
  const supabase = await createClient();
  const photos = await getProgressPhotos();

  return Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(photo.storagePath, 60 * 10);
      return { ...photo, signedUrl: data?.signedUrl ?? null };
    })
  );
}
