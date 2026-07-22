-- ThriveDeck — Habits & Health Metrics (Module 6) migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
-- Prisma manages table structure; RLS policies must be applied via SQL like this,
-- because Prisma does not manage Postgres row-level security.
--
-- Medication dose/frequency columns RECORD what the user's licensed healthcare
-- provider prescribed. Nothing here computes, defaults, or suggests a dose —
-- see CLAUDE.md § Health & safety rules. Providers/pharmacies reuse the
-- care_providers table from the 0007 migration.

-- =============================================================
-- habits — one flexible row per tracked habit. schedule_days is
-- the set of weekdays (0 = Sun … 6 = Sat) the habit is due; streaks
-- and scores are computed from habit_logs, never stored.
-- =============================================================
create table if not exists public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  habit_type    text not null default 'CUSTOM'
                  check (habit_type in
                    ('SLEEP','WATER','MEDITATION','READING','STRETCHING','PROTEIN',
                     'FIBER','SUPPLEMENTS','STEPS','WALK','ROUTINE','SUNLIGHT',
                     'MOOD','ENERGY','STRESS','CUSTOM')),
  goal_type     text not null check (goal_type in ('CHECK','QUANTITY','DURATION','RATING')),
  target_value  double precision check (target_value > 0),
  unit          text,
  schedule_days integer[] not null default '{0,1,2,3,4,5,6}',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists habits_user_active_idx
  on public.habits (user_id, active);

alter table public.habits enable row level security;

create policy "Users can view own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

-- =============================================================
-- habit_logs — one row per habit per day, upserted on
-- (habit_id, logged_on). habit_name is a snapshot so history
-- survives habit deletion (soft pointer). value holds 1 for a
-- plain check, the amount for quantity/duration, or a 1–10 rating.
-- =============================================================
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  habit_id   uuid references public.habits(id) on delete set null,
  habit_name text not null,
  logged_on  date not null,
  value      double precision not null default 1 check (value >= 0),
  notes      text,
  created_at timestamptz not null default now()
);

create unique index if not exists habit_logs_habit_date_key
  on public.habit_logs (habit_id, logged_on);

create index if not exists habit_logs_user_date_idx
  on public.habit_logs (user_id, logged_on desc);

alter table public.habit_logs enable row level security;

create policy "Users can view own habit logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit logs"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit logs"
  on public.habit_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own habit logs"
  on public.habit_logs for delete
  using (auth.uid() = user_id);

-- =============================================================
-- health_metrics — vitals time series (blood pressure, heart rate,
-- resting heart rate, HRV, blood glucose). Blood pressure stores
-- systolic in value and diastolic in secondary_value.
-- =============================================================
create table if not exists public.health_metrics (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  kind            text not null check (kind in
                    ('BLOOD_PRESSURE','HEART_RATE','RESTING_HEART_RATE','HRV','BLOOD_GLUCOSE')),
  value           double precision not null check (value > 0),
  secondary_value double precision check (secondary_value > 0),
  unit            text not null,
  measured_at     timestamptz not null,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists health_metrics_user_kind_measured_idx
  on public.health_metrics (user_id, kind, measured_at desc);

alter table public.health_metrics enable row level security;

create policy "Users can view own health metrics"
  on public.health_metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert own health metrics"
  on public.health_metrics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own health metrics"
  on public.health_metrics for update
  using (auth.uid() = user_id);

create policy "Users can delete own health metrics"
  on public.health_metrics for delete
  using (auth.uid() = user_id);

-- =============================================================
-- lab_results — A1C, lipids, cholesterol, triglycerides,
-- testosterone, vitamin D, and any other test as free text.
-- Reference range is optional and user-entered from the report.
-- =============================================================
create table if not exists public.lab_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  test_name      text not null,
  value          double precision not null check (value >= 0),
  unit           text not null,
  reference_low  double precision check (reference_low >= 0),
  reference_high double precision check (reference_high >= 0),
  collected_on   date not null,
  lab_name       text,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists lab_results_user_test_collected_idx
  on public.lab_results (user_id, test_name, collected_on desc);

alter table public.lab_results enable row level security;

create policy "Users can view own lab results"
  on public.lab_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own lab results"
  on public.lab_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lab results"
  on public.lab_results for update
  using (auth.uid() = user_id);

create policy "Users can delete own lab results"
  on public.lab_results for delete
  using (auth.uid() = user_id);

-- =============================================================
-- medications — record-only medication list. dose_text and
-- frequency are verbatim transcriptions of the user's own
-- prescription label, entered by the user, never generated.
-- =============================================================
create table if not exists public.medications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  dose_text  text,
  frequency  text,
  reason     text,
  prescriber text,
  started_on date,
  ended_on   date,
  active     boolean not null default true,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medications_user_active_idx
  on public.medications (user_id, active);

alter table public.medications enable row level security;

create policy "Users can view own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

drop trigger if exists set_medications_updated_at on public.medications;
create trigger set_medications_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

-- =============================================================
-- medical_conditions — medical history list.
-- =============================================================
create table if not exists public.medical_conditions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  status       text not null default 'ACTIVE'
                 check (status in ('ACTIVE','MANAGED','RESOLVED')),
  diagnosed_on date,
  resolved_on  date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists medical_conditions_user_status_idx
  on public.medical_conditions (user_id, status);

alter table public.medical_conditions enable row level security;

create policy "Users can view own medical conditions"
  on public.medical_conditions for select
  using (auth.uid() = user_id);

create policy "Users can insert own medical conditions"
  on public.medical_conditions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medical conditions"
  on public.medical_conditions for update
  using (auth.uid() = user_id);

create policy "Users can delete own medical conditions"
  on public.medical_conditions for delete
  using (auth.uid() = user_id);

drop trigger if exists set_medical_conditions_updated_at on public.medical_conditions;
create trigger set_medical_conditions_updated_at
  before update on public.medical_conditions
  for each row execute function public.set_updated_at();
