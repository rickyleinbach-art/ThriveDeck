-- ThriveDeck — Shared food catalog (Nutrition follow-up)
-- A read-only catalog seeded from USDA FoodData Central (SR Legacy,
-- public domain). Nutrition values are per 100 g. Users search this
-- and log directly or copy rows into their own food_items library.
-- Seed data is loaded separately (see scripts in the session that
-- created this migration); this file only creates structure + RLS.

create extension if not exists pg_trgm;

create table if not exists public.catalog_foods (
  id         uuid primary key default gen_random_uuid(),
  fdc_id     integer not null unique, -- USDA FoodData Central id
  name       text not null,
  category   text not null,
  calories   double precision not null,
  protein_g  double precision not null,
  carbs_g    double precision not null,
  fat_g      double precision not null,
  fiber_g    double precision,
  sugar_g    double precision,
  sodium_mg  double precision
);

-- Trigram index so name ilike '%term%' searches stay fast.
create index if not exists catalog_foods_name_trgm_idx
  on public.catalog_foods using gin (name gin_trgm_ops);

alter table public.catalog_foods enable row level security;

-- Read-only for signed-in users. No insert/update/delete policies:
-- only the service role (seeding) can write.
create policy "Authenticated users can read the food catalog"
  on public.catalog_foods for select
  to authenticated
  using (true);

-- Ranked search: prefix matches first, then trigram similarity, then
-- shorter (more generic) names. security invoker keeps RLS in force.
create or replace function public.search_catalog_foods(search_term text)
returns setof public.catalog_foods
language sql stable
security invoker
set search_path = public
as $$
  select *
  from public.catalog_foods
  where name ilike '%' || search_term || '%'
  order by
    (name ilike search_term || '%') desc,
    similarity(name, search_term) desc,
    length(name) asc
  limit 20;
$$;
