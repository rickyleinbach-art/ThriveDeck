-- MetabolicOS — Weight Loss (Module 2) migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
-- Prisma manages table structure; RLS policies must be applied via SQL like this,
-- because Prisma does not manage Postgres row-level security.

-- =============================================================
-- body_metrics — single flexible table for every tracked series
-- (weight, body fat %, lean mass, waist/chest/arms/legs/neck/hip)
-- =============================================================
create table if not exists public.body_metrics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  metric_type  text not null check (metric_type in
                 ('WEIGHT','BODY_FAT','LEAN_MASS','WAIST','CHEST','ARMS','LEGS','NECK','HIP')),
  value        double precision not null,
  unit         text not null,
  recorded_at  timestamptz not null,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists body_metrics_user_type_recorded_idx
  on public.body_metrics (user_id, metric_type, recorded_at desc);

alter table public.body_metrics enable row level security;

create policy "Users can view own body metrics"
  on public.body_metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert own body metrics"
  on public.body_metrics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own body metrics"
  on public.body_metrics for update
  using (auth.uid() = user_id);

create policy "Users can delete own body metrics"
  on public.body_metrics for delete
  using (auth.uid() = user_id);

-- =============================================================
-- progress_photos — metadata row; binary files live in Storage
-- =============================================================
create table if not exists public.progress_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null,
  taken_at      timestamptz not null,
  weight_kg     double precision,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists progress_photos_user_taken_idx
  on public.progress_photos (user_id, taken_at desc);

alter table public.progress_photos enable row level security;

create policy "Users can view own progress photos"
  on public.progress_photos for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress photos"
  on public.progress_photos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress photos"
  on public.progress_photos for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress photos"
  on public.progress_photos for delete
  using (auth.uid() = user_id);

-- Storage bucket for progress photo files. Private — accessed only via
-- signed URLs / the authenticated user's own RLS-scoped requests.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Objects must live under a path prefixed with the owner's user id,
-- e.g. `${user.id}/2026-07-16.jpg`, so RLS can scope by path.
create policy "Users can view own progress photo files"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own progress photo files"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own progress photo files"
  on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================
-- goals — target for any tracked metric (goal weight, waist, etc.)
-- =============================================================
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  metric_type   text not null check (metric_type in
                  ('WEIGHT','BODY_FAT','LEAN_MASS','WAIST','CHEST','ARMS','LEGS','NECK','HIP')),
  target_value  double precision not null,
  unit          text not null,
  start_value   double precision,
  target_date   date,
  achieved      boolean not null default false,
  achieved_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists goals_user_type_idx
  on public.goals (user_id, metric_type);

alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
