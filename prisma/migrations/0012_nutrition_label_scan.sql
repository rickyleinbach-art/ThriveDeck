-- ThriveDeck — Nutrition label scan provenance
-- Adds provenance to food_logs for the nutrition-label camera feature:
--   * source          — how the entry was created (analytics on entry method).
--                        Text + CHECK, matching the food_items.source convention
--                        from 0003_nutrition.sql (Prisma's FoodSource enum maps
--                        to a text CHECK in the hand-written SQL migrations).
--   * extracted_json   — the raw model-extracted JSON, kept alongside the final
--                        (possibly user-edited) values so systematic misreads
--                        can be spotted later.
-- Additive and non-destructive. Prisma manages table structure; RLS policies
-- must be applied via SQL like this because Prisma does not manage Postgres RLS.
--
-- The existing food_logs RLS (owner-scoped select/insert/update/delete on
-- auth.uid() = user_id, from 0003_nutrition.sql) already covers these columns,
-- so no new policy is required. food_items.source keeps its original CHECK
-- (no LABEL_SCAN) — label scans that "save to my foods" store the library row
-- with the default 'MANUAL' source; only the food_logs row is tagged LABEL_SCAN.

alter table public.food_logs
  add column if not exists source text not null default 'MANUAL'
    check (source in ('MANUAL', 'BARCODE', 'USDA', 'RESTAURANT', 'LABEL_SCAN')),
  add column if not exists extracted_json jsonb;
