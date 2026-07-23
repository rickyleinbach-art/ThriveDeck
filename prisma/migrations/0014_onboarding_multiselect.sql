-- ThriveDeck — Onboarding multi-select (goals + peptide categories)
-- Lets users pick more than one primary goal and more than one peptide
-- category. Additive + backfilled so the currently-deployed (single-value)
-- code keeps working during rollout; the deprecated singular columns
-- (primary_goal, peptide_category) are left in place and can be dropped in a
-- later cleanup once the array-based build is confirmed live.
--
-- Element validity is enforced with the array containment operator (<@): every
-- element must be in the allowed set. An empty array passes. Existing profiles
-- RLS + updated_at trigger already cover these columns.

alter table public.profiles
  add column if not exists primary_goals text[] not null default '{}'
    check (primary_goals <@ array['LOSE_FAT','BUILD_MUSCLE','IMPROVE_PERFORMANCE','GENERAL_HEALTH','RECOVERY_REHAB','MAINTAIN']::text[]),
  add column if not exists peptide_categories text[] not null default '{}'
    check (peptide_categories <@ array['RECOVERY','PERFORMANCE','WEIGHT_MGMT','LONGEVITY','OTHER']::text[]);

-- Backfill from the deprecated singular columns (only when the array is still empty).
update public.profiles
  set primary_goals = array[primary_goal]
  where primary_goal is not null and primary_goals = '{}';

update public.profiles
  set peptide_categories = array[peptide_category]
  where peptide_category is not null and peptide_categories = '{}';
