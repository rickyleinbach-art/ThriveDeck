-- ThriveDeck — First-time onboarding questionnaire (Phase 5)
-- Extends the existing profiles table with the answers collected by the
-- one-time onboarding wizard. Additive and non-destructive: every column is
-- nullable (or defaulted) so existing rows are unaffected.
--
-- The existing profiles RLS (view/update/insert own profile, scoped to
-- auth.uid() = id from 0001_foundation_profiles.sql) already covers these
-- columns, and set_profiles_updated_at keeps updated_at fresh — so no new
-- policy or trigger is required.
--
-- Notes:
--   * `onboarded` (0001) is reused as the wizard-complete flag — no new
--     onboarding_completed_at column. New signups default to false and are
--     routed through the wizard; existing users are already onboarded=true
--     (set the first time they saved a profile) and skip it.
--   * `tracks_peptides` defaults TRUE so existing peptide users keep the module
--     visible. New users answer explicitly in the wizard (which defaults the
--     answer to "No", hiding an irrelevant module for the majority).
--   * Sensitive Screen-4 health data (injuries, conditions, consent) lives in
--     one jsonb bag, mirroring the notification_prefs pattern, rather than
--     spreading sensitive fields across typed columns.

alter table public.profiles
  add column if not exists primary_goal text
    check (primary_goal in ('LOSE_FAT','BUILD_MUSCLE','IMPROVE_PERFORMANCE','GENERAL_HEALTH','RECOVERY_REHAB','MAINTAIN')),
  add column if not exists training_experience text
    check (training_experience in ('NEW','SOME','ADVANCED')),
  add column if not exists training_days_per_week smallint
    check (training_days_per_week between 0 and 7),
  add column if not exists dietary_pattern text
    check (dietary_pattern in ('NONE','VEGETARIAN','VEGAN','KETO','PALEO','OTHER')),
  add column if not exists allergies text,
  add column if not exists tracks_peptides boolean not null default true,
  add column if not exists peptide_category text
    check (peptide_category in ('RECOVERY','PERFORMANCE','WEIGHT_MGMT','LONGEVITY','OTHER')),
  add column if not exists health_profile jsonb not null default '{}'::jsonb;
