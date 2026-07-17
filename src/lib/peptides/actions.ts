"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  careProviderSchema,
  injectionSchema,
  journalEntrySchema,
  peptideSchema,
  reminderSchema,
  sideEffectSchema,
  PEPTIDE_STATUSES,
  type CareProviderInput,
  type InjectionInput,
  type JournalEntryInput,
  type PeptideInput,
  type PeptideStatus,
  type ReminderInput,
  type SideEffectInput,
} from "@/lib/validations/peptide";

// SAFETY CRITICAL: every dose/frequency value written here comes verbatim
// from validated user input — nothing is computed, defaulted, or suggested.
// Error messages stay generic so no health data ever reaches logs.

type ActionResult = { success: true } | { success: false; error: string };

function revalidatePeptidePages() {
  revalidatePath("/peptides");
  revalidatePath("/peptides/history");
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
async function deleteOwnRow(table: string, id: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: "Could not delete entry" };

  revalidatePeptidePages();
  return { success: true };
}

export async function createPeptide(input: PeptideInput): Promise<ActionResult> {
  const parsed = peptideSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("peptides").insert({
    user_id: user.id,
    name: parsed.data.name,
    status: parsed.data.status,
    dose_amount: parsed.data.doseAmount ?? null,
    dose_unit: parsed.data.doseUnit ?? null,
    frequency: parsed.data.frequency || null,
    started_on: parsed.data.startedOn || null,
    ended_on: parsed.data.endedOn || null,
    lot_number: parsed.data.lotNumber || null,
    expires_on: parsed.data.expiresOn || null,
    provider_id: parsed.data.providerId ?? null,
    pharmacy_id: parsed.data.pharmacyId ?? null,
    protocol_notes: parsed.data.protocolNotes || null,
  });

  if (error) return { success: false, error: "Could not save peptide" };

  revalidatePeptidePages();
  return { success: true };
}

export async function updatePeptideStatus(
  id: string,
  status: PeptideStatus
): Promise<ActionResult> {
  if (!PEPTIDE_STATUSES.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("peptides")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not update status" };

  revalidatePeptidePages();
  return { success: true };
}

export async function deletePeptide(id: string): Promise<ActionResult> {
  return deleteOwnRow("peptides", id);
}

export async function logInjection(input: InjectionInput): Promise<ActionResult> {
  const parsed = injectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // Snapshot the peptide name at log time so history survives later edits.
  const { data: peptide, error: peptideError } = await supabase
    .from("peptides")
    .select("name")
    .eq("id", parsed.data.peptideId)
    .eq("user_id", user.id)
    .single();

  if (peptideError || !peptide) return { success: false, error: "Peptide not found" };

  const { error } = await supabase.from("peptide_injections").insert({
    user_id: user.id,
    peptide_id: parsed.data.peptideId,
    peptide_name: peptide.name,
    status: parsed.data.status,
    injected_at: new Date(parsed.data.injectedAt).toISOString(),
    dose_amount: parsed.data.doseAmount ?? null,
    dose_unit: parsed.data.doseUnit ?? null,
    site: parsed.data.site ?? null,
    lot_number: parsed.data.lotNumber || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidatePeptidePages();
  return { success: true };
}

export async function deleteInjectionFormAction(id: string): Promise<void> {
  await deleteOwnRow("peptide_injections", id);
}

export async function createReminder(input: ReminderInput): Promise<ActionResult> {
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reminder" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("peptide_reminders").insert({
    user_id: user.id,
    peptide_id: parsed.data.peptideId ?? null,
    kind: parsed.data.kind,
    title: parsed.data.title,
    due_at: new Date(parsed.data.dueAt).toISOString(),
    repeat_every_days: parsed.data.repeatEveryDays ?? null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save reminder" };

  revalidatePeptidePages();
  return { success: true };
}

// Marking done advances a repeating reminder to its next due date and
// deactivates a one-off.
export async function completeReminderFormAction(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) return;

  const { data: reminder } = await supabase
    .from("peptide_reminders")
    .select("due_at, repeat_every_days")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!reminder) return;

  const update = reminder.repeat_every_days
    ? {
        due_at: new Date(
          new Date(reminder.due_at).getTime() +
            reminder.repeat_every_days * 24 * 60 * 60 * 1000
        ).toISOString(),
      }
    : { active: false };

  await supabase
    .from("peptide_reminders")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePeptidePages();
}

export async function deleteReminderFormAction(id: string): Promise<void> {
  await deleteOwnRow("peptide_reminders", id);
}

export async function logSideEffect(input: SideEffectInput): Promise<ActionResult> {
  const parsed = sideEffectSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // Snapshot the peptide name if one was linked.
  let peptideName: string | null = null;
  if (parsed.data.peptideId) {
    const { data: peptide } = await supabase
      .from("peptides")
      .select("name")
      .eq("id", parsed.data.peptideId)
      .eq("user_id", user.id)
      .single();
    peptideName = peptide?.name ?? null;
  }

  const { error } = await supabase.from("peptide_side_effects").insert({
    user_id: user.id,
    peptide_id: parsed.data.peptideId ?? null,
    peptide_name: peptideName,
    occurred_at: new Date(parsed.data.occurredAt).toISOString(),
    severity: parsed.data.severity,
    description: parsed.data.description,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidatePeptidePages();
  return { success: true };
}

export async function deleteSideEffectFormAction(id: string): Promise<void> {
  await deleteOwnRow("peptide_side_effects", id);
}

export async function createJournalEntry(input: JournalEntryInput): Promise<ActionResult> {
  const parsed = journalEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  let peptideName: string | null = null;
  if (parsed.data.peptideId) {
    const { data: peptide } = await supabase
      .from("peptides")
      .select("name")
      .eq("id", parsed.data.peptideId)
      .eq("user_id", user.id)
      .single();
    peptideName = peptide?.name ?? null;
  }

  const { error } = await supabase.from("peptide_journal_entries").insert({
    user_id: user.id,
    peptide_id: parsed.data.peptideId ?? null,
    peptide_name: peptideName,
    entry_date: parsed.data.entryDate,
    content: parsed.data.content,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidatePeptidePages();
  return { success: true };
}

export async function deleteJournalEntryFormAction(id: string): Promise<void> {
  await deleteOwnRow("peptide_journal_entries", id);
}

export async function createCareProvider(input: CareProviderInput): Promise<ActionResult> {
  const parsed = careProviderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("care_providers").insert({
    user_id: user.id,
    kind: parsed.data.kind,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Could not save entry" };

  revalidatePeptidePages();
  return { success: true };
}

export async function deleteCareProviderFormAction(id: string): Promise<void> {
  await deleteOwnRow("care_providers", id);
}
