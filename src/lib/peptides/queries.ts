import { createClient } from "@/lib/supabase/server";
import {
  mapCareProvider,
  mapInjection,
  mapJournalEntry,
  mapPeptide,
  mapReminder,
  mapSideEffect,
  type CareProvider,
  type CareProviderRow,
  type Injection,
  type InjectionRow,
  type JournalEntry,
  type JournalEntryRow,
  type Peptide,
  type PeptideRow,
  type Reminder,
  type ReminderRow,
  type SideEffect,
  type SideEffectRow,
} from "@/lib/peptides/types";
import type { PeptideStatus } from "@/lib/validations/peptide";

// Server-side reads. RLS scopes every query to the signed-in user already;
// the explicit user_id filter below is defense in depth, not the boundary.
export async function getPeptides(options?: {
  status?: PeptideStatus;
}): Promise<Peptide[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("peptides")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as PeptideRow[]).map(mapPeptide);
}

export async function getInjections(options?: {
  limit?: number;
  since?: string; // ISO timestamp lower bound
}): Promise<Injection[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("peptide_injections")
    .select("*")
    .eq("user_id", user.id)
    .order("injected_at", { ascending: false });

  if (options?.since) {
    query = query.gte("injected_at", options.since);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as InjectionRow[]).map(mapInjection);
}

export async function getUpcomingReminders(options?: {
  limit?: number;
}): Promise<Reminder[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("peptide_reminders")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("due_at", { ascending: true });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as ReminderRow[]).map(mapReminder);
}

export async function getSideEffects(options?: {
  limit?: number;
}): Promise<SideEffect[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("peptide_side_effects")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as SideEffectRow[]).map(mapSideEffect);
}

export async function getJournalEntries(options?: {
  limit?: number;
}): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("peptide_journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as JournalEntryRow[]).map(mapJournalEntry);
}

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
