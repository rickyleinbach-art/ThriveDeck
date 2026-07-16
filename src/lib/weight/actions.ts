"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  bodyMetricSchema,
  goalSchema,
  progressPhotoSchema,
  type BodyMetricInput,
  type GoalInput,
  type ProgressPhotoInput,
} from "@/lib/validations/weight";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateWeightPages() {
  revalidatePath("/weight");
  revalidatePath("/weight/history");
  revalidatePath("/weight/trend");
  revalidatePath("/dashboard");
}

export async function logBodyMetric(input: BodyMetricInput): Promise<ActionResult> {
  const parsed = bodyMetricSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("body_metrics").insert({
    user_id: user.id,
    metric_type: parsed.data.metricType,
    value: parsed.data.value,
    unit: parsed.data.unit,
    recorded_at: new Date(parsed.data.recordedAt).toISOString(),
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidateWeightPages();
  return { success: true };
}

// Adapter for <form action={...}> which requires a void-returning function.
export async function deleteBodyMetricFormAction(id: string): Promise<void> {
  await deleteBodyMetric(id);
}

export async function deleteBodyMetric(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("body_metrics")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete entry" };

  revalidateWeightPages();
  return { success: true };
}

export async function createGoal(input: GoalInput): Promise<ActionResult> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid goal" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    metric_type: parsed.data.metricType,
    target_value: parsed.data.targetValue,
    unit: parsed.data.unit,
    start_value: parsed.data.startValue ?? null,
    target_date: parsed.data.targetDate || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save goal" };

  revalidateWeightPages();
  return { success: true };
}

export async function createProgressPhoto(
  input: ProgressPhotoInput & { storagePath: string }
): Promise<ActionResult> {
  const parsed = progressPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid photo" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("progress_photos").insert({
    user_id: user.id,
    storage_path: input.storagePath,
    taken_at: new Date(parsed.data.takenAt).toISOString(),
    weight_kg: parsed.data.weightKg ?? null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save photo" };

  revalidateWeightPages();
  return { success: true };
}
