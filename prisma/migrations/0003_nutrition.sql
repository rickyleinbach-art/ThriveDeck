-- MetabolicOS — Nutrition (Module 3) migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
-- Prisma manages table structure; RLS policies must be applied via SQL like this,
-- because Prisma does not manage Postgres row-level security.

-- =============================================================
-- food_items — per-user food library (manual entries, favorites).
-- `source` leaves room for barcode/USDA/restaurant imports later.
-- =============================================================
create table if not exists public.food_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  brand         text,
  serving_size  double precision not null,
  serving_unit  text not null,
  calories      double precision not null,
  protein_g     double precision not null,
  carbs_g       double precision not null,
  fat_g         double precision not null,
  fiber_g       double precision,
  sugar_g       double precision,
  sodium_mg     double precision,
  is_favorite   boolean not null default false,
  source        text not null default 'MANUAL' check (source in
                  ('MANUAL','BARCODE','USDA','RESTAURANT')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists food_items_user_name_idx
  on public.food_items (user_id, name);

create index if not exists food_items_user_favorite_idx
  on public.food_items (user_id, is_favorite);

alter table public.food_items enable row level security;

create policy "Users can view own food items"
  on public.food_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own food items"
  on public.food_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own food items"
  on public.food_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own food items"
  on public.food_items for delete
  using (auth.uid() = user_id);

drop trigger if exists set_food_items_updated_at on public.food_items;
create trigger set_food_items_updated_at
  before update on public.food_items
  for each row execute function public.set_updated_at();

-- =============================================================
-- food_logs — one row per logged eating event. Nutrition values
-- are snapshotted per serving at log time so later library edits
-- or deletes never rewrite history (food_item_id is a soft link).
-- =============================================================
create table if not exists public.food_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  food_item_id  uuid references public.food_items(id) on delete set null,
  meal_type     text not null check (meal_type in
                  ('BREAKFAST','LUNCH','DINNER','SNACK')),
  logged_on     date not null,
  servings      double precision not null default 1 check (servings > 0),
  name          text not null,
  brand         text,
  serving_size  double precision not null,
  serving_unit  text not null,
  calories      double precision not null,
  protein_g     double precision not null,
  carbs_g       double precision not null,
  fat_g         double precision not null,
  fiber_g       double precision,
  sugar_g       double precision,
  sodium_mg     double precision,
  created_at    timestamptz not null default now()
);

create index if not exists food_logs_user_logged_on_idx
  on public.food_logs (user_id, logged_on desc);

alter table public.food_logs enable row level security;

create policy "Users can view own food logs"
  on public.food_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own food logs"
  on public.food_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own food logs"
  on public.food_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own food logs"
  on public.food_logs for delete
  using (auth.uid() = user_id);

-- =============================================================
-- nutrition_targets — one daily macro-target row per user,
-- upserted from the macro calculator or manual edits.
-- =============================================================
create table if not exists public.nutrition_targets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  calories    double precision not null,
  protein_g   double precision not null,
  carbs_g     double precision not null,
  fat_g       double precision not null,
  fiber_g     double precision,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.nutrition_targets enable row level security;

create policy "Users can view own nutrition targets"
  on public.nutrition_targets for select
  using (auth.uid() = user_id);

create policy "Users can insert own nutrition targets"
  on public.nutrition_targets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own nutrition targets"
  on public.nutrition_targets for update
  using (auth.uid() = user_id);

create policy "Users can delete own nutrition targets"
  on public.nutrition_targets for delete
  using (auth.uid() = user_id);

drop trigger if exists set_nutrition_targets_updated_at on public.nutrition_targets;
create trigger set_nutrition_targets_updated_at
  before update on public.nutrition_targets
  for each row execute function public.set_updated_at();
