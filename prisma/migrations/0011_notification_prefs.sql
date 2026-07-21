-- MetabolicOS — Notification preferences
-- Adds a per-user notification-preferences bag to profiles so settings persist
-- across devices (previously stored client-side). Additive and non-destructive.
--
-- The existing profiles RLS (Users can view/update/insert own profile, scoped to
-- auth.uid() = id from 0001_foundation_profiles.sql) already covers this column,
-- and the set_profiles_updated_at trigger keeps updated_at fresh — so no new
-- policy or trigger is required.

alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;
