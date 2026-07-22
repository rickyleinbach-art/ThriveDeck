-- ThriveDeck — Exercise (Module 4) migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
-- Prisma manages table structure; RLS policies must be applied via SQL like this,
-- because Prisma does not manage Postgres row-level security.

-- =============================================================
-- exercises — the exercise library. Seed rows are shared and have
-- user_id = null; custom rows belong to a user. This is the one
-- deliberate widening of the "auth.uid() = user_id" rule: SELECT
-- also allows user_id IS NULL so everyone can read the shared seed
-- library. Writes still require ownership, so seed rows are
-- immutable from the client.
-- =============================================================
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null,
  category      text not null check (category in
                  ('STRENGTH','CARDIO','HIIT','WALKING','RUNNING','CYCLING',
                   'SWIMMING','YOGA','MOBILITY','STRETCHING','RECOVERY')),
  muscle_group  text check (muscle_group in
                  ('CHEST','BACK','SHOULDERS','BICEPS','TRICEPS','LEGS',
                   'GLUTES','CORE','FULL_BODY')),
  equipment     text,
  met_value     double precision check (met_value > 0),
  description   text,
  created_at    timestamptz not null default now()
);

create index if not exists exercises_user_name_idx
  on public.exercises (user_id, name);

create index if not exists exercises_category_idx
  on public.exercises (category);

-- Seed rows are unique by name; also makes the seed below idempotent.
create unique index if not exists exercises_seed_name_idx
  on public.exercises (name) where user_id is null;

alter table public.exercises enable row level security;

create policy "Users can view seed and own exercises"
  on public.exercises for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exercises"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- =============================================================
-- workout_templates — reusable routines built in the workout
-- builder. Exercises live in workout_template_exercises.
-- =============================================================
create table if not exists public.workout_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists workout_templates_user_name_idx
  on public.workout_templates (user_id, name);

alter table public.workout_templates enable row level security;

create policy "Users can view own workout templates"
  on public.workout_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout templates"
  on public.workout_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout templates"
  on public.workout_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout templates"
  on public.workout_templates for delete
  using (auth.uid() = user_id);

drop trigger if exists set_workout_templates_updated_at on public.workout_templates;
create trigger set_workout_templates_updated_at
  before update on public.workout_templates
  for each row execute function public.set_updated_at();

-- =============================================================
-- workout_template_exercises — ordered exercises in a template,
-- with optional targets. user_id is denormalized so RLS stays a
-- plain auth.uid() = user_id check (no subquery per row).
-- =============================================================
create table if not exists public.workout_template_exercises (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  template_id          uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id          uuid not null references public.exercises(id) on delete cascade,
  position             integer not null check (position >= 0),
  target_sets          integer check (target_sets between 1 and 50),
  target_reps          integer check (target_reps between 1 and 1000),
  target_weight_kg     double precision check (target_weight_kg >= 0),
  target_duration_min  double precision check (target_duration_min > 0),
  rest_seconds         integer not null default 90 check (rest_seconds between 0 and 3600)
);

create index if not exists workout_template_exercises_template_idx
  on public.workout_template_exercises (template_id, position);

alter table public.workout_template_exercises enable row level security;

create policy "Users can view own template exercises"
  on public.workout_template_exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert own template exercises"
  on public.workout_template_exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update own template exercises"
  on public.workout_template_exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete own template exercises"
  on public.workout_template_exercises for delete
  using (auth.uid() = user_id);

-- =============================================================
-- workouts — one row per session. completed_at is null while the
-- workout is in progress; the workout timer derives from
-- started_at. template_id is a soft link (set null on delete).
-- =============================================================
create table if not exists public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  template_id      uuid references public.workout_templates(id) on delete set null,
  name             text not null,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  duration_min     double precision check (duration_min >= 0),
  calories_burned  double precision check (calories_burned >= 0),
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists workouts_user_started_at_idx
  on public.workouts (user_id, started_at desc);

alter table public.workouts enable row level security;

create policy "Users can view own workouts"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on public.workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- =============================================================
-- workout_sets — one logged set. Strength sets use reps +
-- weight_kg; duration work (cardio/yoga/etc) uses duration_min +
-- optional distance_km. exercise_name/category are snapshotted at
-- log time so library edits or deletes never rewrite history.
-- =============================================================
create table if not exists public.workout_sets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  workout_id     uuid not null references public.workouts(id) on delete cascade,
  exercise_id    uuid references public.exercises(id) on delete set null,
  exercise_name  text not null,
  category       text not null check (category in
                   ('STRENGTH','CARDIO','HIIT','WALKING','RUNNING','CYCLING',
                    'SWIMMING','YOGA','MOBILITY','STRETCHING','RECOVERY')),
  set_number     integer not null check (set_number >= 1),
  reps           integer check (reps >= 0),
  weight_kg      double precision check (weight_kg >= 0),
  duration_min   double precision check (duration_min > 0),
  distance_km    double precision check (distance_km >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists workout_sets_workout_idx
  on public.workout_sets (workout_id);

create index if not exists workout_sets_user_exercise_idx
  on public.workout_sets (user_id, exercise_name);

alter table public.workout_sets enable row level security;

create policy "Users can view own workout sets"
  on public.workout_sets for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout sets"
  on public.workout_sets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout sets"
  on public.workout_sets for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout sets"
  on public.workout_sets for delete
  using (auth.uid() = user_id);

-- =============================================================
-- Seed the shared exercise library (user_id = null). Idempotent
-- via the exercises_seed_name_idx partial unique index.
-- MET values are Compendium of Physical Activities estimates,
-- used only for rough calorie estimates.
-- =============================================================
insert into public.exercises (user_id, name, category, muscle_group, equipment, met_value) values
  -- Strength
  (null, 'Barbell Back Squat',     'STRENGTH', 'LEGS',      'Barbell',       6.0),
  (null, 'Front Squat',            'STRENGTH', 'LEGS',      'Barbell',       6.0),
  (null, 'Goblet Squat',           'STRENGTH', 'LEGS',      'Kettlebell',    5.5),
  (null, 'Deadlift',               'STRENGTH', 'FULL_BODY', 'Barbell',       6.0),
  (null, 'Romanian Deadlift',      'STRENGTH', 'LEGS',      'Barbell',       5.0),
  (null, 'Bench Press',            'STRENGTH', 'CHEST',     'Barbell',       5.0),
  (null, 'Incline Bench Press',    'STRENGTH', 'CHEST',     'Barbell',       5.0),
  (null, 'Dumbbell Bench Press',   'STRENGTH', 'CHEST',     'Dumbbells',     5.0),
  (null, 'Push-Up',                'STRENGTH', 'CHEST',     'Bodyweight',    3.8),
  (null, 'Overhead Press',         'STRENGTH', 'SHOULDERS', 'Barbell',       5.0),
  (null, 'Dumbbell Shoulder Press','STRENGTH', 'SHOULDERS', 'Dumbbells',     5.0),
  (null, 'Lateral Raise',          'STRENGTH', 'SHOULDERS', 'Dumbbells',     3.5),
  (null, 'Face Pull',              'STRENGTH', 'SHOULDERS', 'Cable machine', 3.5),
  (null, 'Barbell Row',            'STRENGTH', 'BACK',      'Barbell',       5.0),
  (null, 'Seated Cable Row',       'STRENGTH', 'BACK',      'Cable machine', 4.5),
  (null, 'Lat Pulldown',           'STRENGTH', 'BACK',      'Cable machine', 4.5),
  (null, 'Pull-Up',                'STRENGTH', 'BACK',      'Bodyweight',    8.0),
  (null, 'Chin-Up',                'STRENGTH', 'BACK',      'Bodyweight',    8.0),
  (null, 'Biceps Curl',            'STRENGTH', 'BICEPS',    'Dumbbells',     3.5),
  (null, 'Hammer Curl',            'STRENGTH', 'BICEPS',    'Dumbbells',     3.5),
  (null, 'Triceps Pushdown',       'STRENGTH', 'TRICEPS',   'Cable machine', 3.5),
  (null, 'Skull Crusher',          'STRENGTH', 'TRICEPS',   'Barbell',       3.5),
  (null, 'Dip',                    'STRENGTH', 'TRICEPS',   'Bodyweight',    5.0),
  (null, 'Hip Thrust',             'STRENGTH', 'GLUTES',    'Barbell',       5.0),
  (null, 'Glute Bridge',           'STRENGTH', 'GLUTES',    'Bodyweight',    3.5),
  (null, 'Walking Lunge',          'STRENGTH', 'LEGS',      'Dumbbells',     5.0),
  (null, 'Bulgarian Split Squat',  'STRENGTH', 'LEGS',      'Dumbbells',     5.5),
  (null, 'Leg Press',              'STRENGTH', 'LEGS',      'Machine',       5.0),
  (null, 'Leg Extension',          'STRENGTH', 'LEGS',      'Machine',       4.0),
  (null, 'Leg Curl',               'STRENGTH', 'LEGS',      'Machine',       4.0),
  (null, 'Calf Raise',             'STRENGTH', 'LEGS',      'Machine',       3.5),
  (null, 'Kettlebell Swing',       'STRENGTH', 'FULL_BODY', 'Kettlebell',    9.5),
  (null, 'Farmer''s Carry',        'STRENGTH', 'FULL_BODY', 'Dumbbells',     6.5),
  (null, 'Crunch',                 'STRENGTH', 'CORE',      'Bodyweight',    3.0),
  (null, 'Hanging Leg Raise',      'STRENGTH', 'CORE',      'Bodyweight',    3.5),
  (null, 'Russian Twist',          'STRENGTH', 'CORE',      'Bodyweight',    3.5),
  (null, 'Ab Wheel Rollout',       'STRENGTH', 'CORE',      'Ab wheel',      4.0),
  -- Cardio machines & general cardio
  (null, 'Rowing Machine',         'CARDIO',   null,        'Rower',         7.0),
  (null, 'Elliptical',             'CARDIO',   null,        'Elliptical',    5.0),
  (null, 'Stair Climber',          'CARDIO',   null,        'Machine',       9.0),
  (null, 'Jump Rope',              'CARDIO',   null,        'Jump rope',    12.3),
  (null, 'Assault Bike',           'CARDIO',   null,        'Air bike',      8.0),
  -- HIIT
  (null, 'HIIT Circuit',           'HIIT',     null,        null,            8.0),
  (null, 'Sprint Intervals',       'HIIT',     null,        null,           10.0),
  (null, 'Burpees',                'HIIT',     null,        'Bodyweight',    8.0),
  (null, 'Tabata Session',         'HIIT',     null,        null,            9.0),
  -- Walking
  (null, 'Casual Walk',            'WALKING',  null,        null,            3.5),
  (null, 'Brisk Walk',             'WALKING',  null,        null,            4.3),
  (null, 'Incline Treadmill Walk', 'WALKING',  null,        'Treadmill',     5.3),
  (null, 'Hike',                   'WALKING',  null,        null,            6.0),
  -- Running
  (null, 'Outdoor Run',            'RUNNING',  null,        null,            9.8),
  (null, 'Treadmill Run',          'RUNNING',  null,        'Treadmill',     9.0),
  (null, 'Trail Run',              'RUNNING',  null,        null,           10.5),
  -- Cycling
  (null, 'Outdoor Cycling',        'CYCLING',  null,        'Bike',          7.5),
  (null, 'Stationary Bike',        'CYCLING',  null,        'Bike',          6.8),
  (null, 'Spin Class',             'CYCLING',  null,        'Bike',          8.5),
  -- Swimming
  (null, 'Freestyle Laps',         'SWIMMING', null,        null,            7.0),
  (null, 'Breaststroke',           'SWIMMING', null,        null,            5.3),
  (null, 'Leisure Swim',           'SWIMMING', null,        null,            6.0),
  -- Yoga
  (null, 'Vinyasa Flow',           'YOGA',     null,        'Mat',           4.0),
  (null, 'Power Yoga',             'YOGA',     null,        'Mat',           4.0),
  (null, 'Hatha Yoga',             'YOGA',     null,        'Mat',           2.5),
  (null, 'Yin Yoga',               'YOGA',     null,        'Mat',           2.0),
  -- Mobility / stretching / recovery
  (null, 'Dynamic Warm-Up',        'MOBILITY', null,        null,            3.5),
  (null, 'Hip Mobility Routine',   'MOBILITY', null,        null,            2.5),
  (null, 'Shoulder Mobility Routine','MOBILITY', null,      null,            2.5),
  (null, 'Full-Body Stretch',      'STRETCHING', null,      'Mat',           2.3),
  (null, 'Post-Workout Stretch',   'STRETCHING', null,      'Mat',           2.3),
  (null, 'Foam Rolling',           'RECOVERY', null,        'Foam roller',   2.5),
  (null, 'Active Recovery Session','RECOVERY', null,        null,            2.5)
on conflict (name) where user_id is null do nothing;
