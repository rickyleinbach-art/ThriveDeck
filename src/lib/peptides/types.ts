import type {
  CareProviderKind,
  DoseUnit,
  InjectionSite,
  InjectionStatus,
  PeptideStatus,
  ReminderKind,
  SideEffectSeverity,
} from "@/lib/validations/peptide";

// Raw shapes returned by Supabase (snake_case columns) and their
// camelCase domain mappings, following the weight/nutrition modules.

export interface CareProviderRow {
  id: string;
  user_id: string;
  kind: CareProviderKind;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareProvider {
  id: string;
  kind: CareProviderKind;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export function mapCareProvider(row: CareProviderRow): CareProvider {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
  };
}

export interface PeptideRow {
  id: string;
  user_id: string;
  name: string;
  status: PeptideStatus;
  dose_amount: number | null;
  dose_unit: DoseUnit | null;
  frequency: string | null;
  started_on: string | null;
  ended_on: string | null;
  lot_number: string | null;
  expires_on: string | null;
  provider_id: string | null;
  pharmacy_id: string | null;
  protocol_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Peptide {
  id: string;
  name: string;
  status: PeptideStatus;
  doseAmount: number | null;
  doseUnit: DoseUnit | null;
  frequency: string | null;
  startedOn: string | null;
  endedOn: string | null;
  lotNumber: string | null;
  expiresOn: string | null;
  providerId: string | null;
  pharmacyId: string | null;
  protocolNotes: string | null;
}

export function mapPeptide(row: PeptideRow): Peptide {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    frequency: row.frequency,
    startedOn: row.started_on,
    endedOn: row.ended_on,
    lotNumber: row.lot_number,
    expiresOn: row.expires_on,
    providerId: row.provider_id,
    pharmacyId: row.pharmacy_id,
    protocolNotes: row.protocol_notes,
  };
}

export interface InjectionRow {
  id: string;
  user_id: string;
  peptide_id: string | null;
  peptide_name: string;
  status: InjectionStatus;
  injected_at: string;
  dose_amount: number | null;
  dose_unit: DoseUnit | null;
  site: InjectionSite | null;
  lot_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Injection {
  id: string;
  peptideId: string | null;
  peptideName: string;
  status: InjectionStatus;
  injectedAt: string;
  doseAmount: number | null;
  doseUnit: DoseUnit | null;
  site: InjectionSite | null;
  lotNumber: string | null;
  notes: string | null;
}

export function mapInjection(row: InjectionRow): Injection {
  return {
    id: row.id,
    peptideId: row.peptide_id,
    peptideName: row.peptide_name,
    status: row.status,
    injectedAt: row.injected_at,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    site: row.site,
    lotNumber: row.lot_number,
    notes: row.notes,
  };
}

export interface ReminderRow {
  id: string;
  user_id: string;
  peptide_id: string | null;
  kind: ReminderKind;
  title: string;
  due_at: string;
  repeat_every_days: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  peptideId: string | null;
  kind: ReminderKind;
  title: string;
  dueAt: string;
  repeatEveryDays: number | null;
  active: boolean;
  notes: string | null;
}

export function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    peptideId: row.peptide_id,
    kind: row.kind,
    title: row.title,
    dueAt: row.due_at,
    repeatEveryDays: row.repeat_every_days,
    active: row.active,
    notes: row.notes,
  };
}

export interface SideEffectRow {
  id: string;
  user_id: string;
  peptide_id: string | null;
  peptide_name: string | null;
  occurred_at: string;
  severity: SideEffectSeverity;
  description: string;
  created_at: string;
}

export interface SideEffect {
  id: string;
  peptideId: string | null;
  peptideName: string | null;
  occurredAt: string;
  severity: SideEffectSeverity;
  description: string;
}

export function mapSideEffect(row: SideEffectRow): SideEffect {
  return {
    id: row.id,
    peptideId: row.peptide_id,
    peptideName: row.peptide_name,
    occurredAt: row.occurred_at,
    severity: row.severity,
    description: row.description,
  };
}

export interface JournalEntryRow {
  id: string;
  user_id: string;
  peptide_id: string | null;
  peptide_name: string | null;
  entry_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  peptideId: string | null;
  peptideName: string | null;
  entryDate: string;
  content: string;
}

export function mapJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    peptideId: row.peptide_id,
    peptideName: row.peptide_name,
    entryDate: row.entry_date,
    content: row.content,
  };
}
