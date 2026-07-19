"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  conditionSchema,
  healthMetricSchema,
  HEALTH_METRIC_UNITS,
  labResultSchema,
  medicationSchema,
  type ConditionInput,
  type HealthMetricInput,
  type LabResultInput,
  type MedicationInput,
} from "@/lib/validations/health";

// Everything in this module RECORDS user-entered values — medication
// dose/frequency come verbatim from validated input, never computed or
// suggested. Error messages stay generic so no health data reaches logs.

type ActionResult = { success: true } | { success: false; error: string };

function revalidateHealthPages() {
  revalidatePath("/health");
  revalidatePath("/dashboard");
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Shared delete for the module's list rows — always scoped to the owner.
async function deleteOwnRow(table: string, id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) return;

  await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);

  revalidateHealthPages();
}

export async function logHealthMetric(input: HealthMetricInput): Promise<ActionResult> {
  const parsed = healthMetricSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("health_metrics").insert({
    user_id: user.id,
    kind: parsed.data.kind,
    value: parsed.data.value,
    secondary_value:
      parsed.data.kind === "BLOOD_PRESSURE" ? parsed.data.secondaryValue : null,
    unit: HEALTH_METRIC_UNITS[parsed.data.kind],
    measured_at: new Date(parsed.data.measuredAt).toISOString(),
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidateHealthPages();
  return { success: true };
}

export async function deleteHealthMetricFormAction(id: string): Promise<void> {
  await deleteOwnRow("health_metrics", id);
}

export async function createLabResult(input: LabResultInput): Promise<ActionResult> {
  const parsed = labResultSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("lab_results").insert({
    user_id: user.id,
    test_name: parsed.data.testName,
    value: parsed.data.value,
    unit: parsed.data.unit,
    reference_low: parsed.data.referenceLow ?? null,
    reference_high: parsed.data.referenceHigh ?? null,
    collected_on: parsed.data.collectedOn,
    lab_name: parsed.data.labName || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidateHealthPages();
  return { success: true };
}

export async function deleteLabResultFormAction(id: string): Promise<void> {
  await deleteOwnRow("lab_results", id);
}

export async function createMedication(input: MedicationInput): Promise<ActionResult> {
  const parsed = medicationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("medications").insert({
    user_id: user.id,
    name: parsed.data.name,
    dose_text: parsed.data.doseText || null,
    frequency: parsed.data.frequency || null,
    reason: parsed.data.reason || null,
    prescriber: parsed.data.prescriber || null,
    started_on: parsed.data.startedOn || null,
    ended_on: parsed.data.endedOn || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidateHealthPages();
  return { success: true };
}

// Stopping records the end date the action ran; resuming clears it.
export async function setMedicationActiveFormAction(
  id: string,
  active: boolean
): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) return;

  await supabase
    .from("medications")
    .update(
      active
        ? { active: true, ended_on: null }
        : { active: false, ended_on: new Date().toISOString().slice(0, 10) }
    )
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateHealthPages();
}

export async function deleteMedicationFormAction(id: string): Promise<void> {
  await deleteOwnRow("medications", id);
}

export async function createCondition(input: ConditionInput): Promise<ActionResult> {
  const parsed = conditionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("medical_conditions").insert({
    user_id: user.id,
    name: parsed.data.name,
    status: parsed.data.status,
    diagnosed_on: parsed.data.diagnosedOn || null,
    resolved_on: parsed.data.resolvedOn || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidateHealthPages();
  return { success: true };
}

export async function deleteConditionFormAction(id: string): Promise<void> {
  await deleteOwnRow("medical_conditions", id);
}
