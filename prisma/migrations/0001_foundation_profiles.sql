-- MetabolicOS — Foundation migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
-- Prisma manages table structure; RLS policies must be applied via SQL like this,
-- because Prisma does not manage Postgres row-level security.

-- =============================================================
-- profiles table (mirrors prisma/schema.prisma Profile model)
-- =============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text unique not null,
  full_name      text,
  date_of_birth  date,
  sex            text check (sex in ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')),
  height_cm      double precision,
  timezone       text not null default 'UTC',
  unit_system    text not null default 'METRIC' check (unit_system in ('METRIC','IMPERIAL')),
  goal_weight_kg double precision,
  activity_level text check (activity_level in ('SEDENTARY','LIGHT','MODERATE','ACTIVE','VERY_ACTIVE')),
  onboarded      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- =============================================================
-- Row Level Security — every table gets this treatment
-- =============================================================
alter table public.profiles enable row level security;

-- Users can only see their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert only their own profile row
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================================
-- Auto-create a profile row when a new auth user signs up
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Keep updated_at fresh on every update
-- =============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
