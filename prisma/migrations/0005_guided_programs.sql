-- MetabolicOS — Guided workout programs (Module 4 follow-up)
-- Built-in follow-along templates at beginner/intermediate/advanced levels.
-- Mirrors the exercises seed pattern: rows with user_id = null are shared and
-- read-only for clients; user-created templates keep working unchanged.

-- =============================================================
-- Allow shared seed rows on templates (user_id = null), tag
-- templates with a difficulty, and widen SELECT the same way
-- exercises does. Writes still require ownership, so seed
-- programs are immutable from the client.
-- =============================================================
alter table public.workout_templates alter column user_id drop not null;
alter table public.workout_template_exercises alter column user_id drop not null;

alter table public.workout_templates add column if not exists difficulty text
  check (difficulty in ('BEGINNER','INTERMEDIATE','ADVANCED'));

-- Seed programs are unique by name; also makes the seed below idempotent.
create unique index if not exists workout_templates_seed_name_idx
  on public.workout_templates (name) where user_id is null;

drop policy if exists "Users can view own workout templates" on public.workout_templates;
create policy "Users can view seed and own workout templates"
  on public.workout_templates for select
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "Users can view own template exercises" on public.workout_template_exercises;
create policy "Users can view seed and own template exercises"
  on public.workout_template_exercises for select
  using (user_id is null or auth.uid() = user_id);

-- =============================================================
-- Seed six guided programs (two per level). Exercises are looked
-- up by name from the seed library; each block is skipped when the
-- program already exists.
-- =============================================================
do $$
declare
  tid uuid;
begin
  -- Beginner ----------------------------------------------------
  if not exists (select 1 from public.workout_templates
                 where user_id is null and name = 'Beginner Full Body') then
    insert into public.workout_templates (user_id, name, notes, difficulty)
    values (null, 'Beginner Full Body',
            'Run this 2-3 times a week with a rest day between sessions. Start light and focus on form.',
            'BEGINNER')
    returning id into tid;

    insert into public.workout_template_exercises
      (user_id, template_id, exercise_id, position, target_sets, target_reps, target_duration_min, rest_seconds)
    select null, tid, e.id, v.pos, v.sets, v.reps, v.dur, v.rest
    from (values
      ('Goblet Squat',     0, 3, 10::integer, null::double precision, 90),
      ('Push-Up',          1, 3, 8,           null, 90),
      ('Seated Cable Row', 2, 3, 10,          null, 90),
      ('Glute Bridge',     3, 3, 12,          null, 60),
      ('Crunch',           4, 3, 12,          null, 60)
    ) as v(name, pos, sets, reps, dur, rest)
    join public.exercises e on e.user_id is null and e.name = v.name;
  end if;

  if not exists (select 1 from public.workout_templates
                 where user_id is null and name = 'Beginner Cardio Starter') then
    insert into public.workout_templates (user_id, name, notes, difficulty)
    values (null, 'Beginner Cardio Starter',
            'Easy conditioning to build the habit. Walk at a pace where you can still hold a conversation.',
            'BEGINNER')
    returning id into tid;

    insert into public.workout_template_exercises
      (user_id, template_id, exercise_id, position, target_sets, target_reps, target_duration_min, rest_seconds)
    select null, tid, e.id, v.pos, v.sets, v.reps, v.dur, v.rest
    from (values
      ('Dynamic Warm-Up',   0, 1, null::integer, 5::double precision, 30),
      ('Brisk Walk',        1, 1, null,          20,                  60),
      ('Full-Body Stretch', 2, 1, null,          5,                   0)
    ) as v(name, pos, sets, reps, dur, rest)
    join public.exercises e on e.user_id is null and e.name = v.name;
  end if;

  -- Intermediate ------------------------------------------------
  if not exists (select 1 from public.workout_templates
                 where user_id is null and name = 'Intermediate Upper Body') then
    insert into public.workout_templates (user_id, name, notes, difficulty)
    values (null, 'Intermediate Upper Body',
            'Pair with the lower body day. Pick weights you can finish all sets with, leaving 1-2 reps in reserve.',
            'INTERMEDIATE')
    returning id into tid;

    insert into public.workout_template_exercises
      (user_id, template_id, exercise_id, position, target_sets, target_reps, target_duration_min, rest_seconds)
    select null, tid, e.id, v.pos, v.sets, v.reps, v.dur, v.rest
    from (values
      ('Bench Press',      0, 4, 8::integer,  null::double precision, 120),
      ('Barbell Row',      1, 4, 8,           null, 120),
      ('Overhead Press',   2, 3, 10,          null, 90),
      ('Lat Pulldown',     3, 3, 10,          null, 90),
      ('Biceps Curl',      4, 3, 12,          null, 60),
      ('Triceps Pushdown', 5, 3, 12,          null, 60)
    ) as v(name, pos, sets, reps, dur, rest)
    join public.exercises e on e.user_id is null and e.name = v.name;
  end if;

  if not exists (select 1 from public.workout_templates
                 where user_id is null and name = 'Intermediate Lower Body') then
    insert into public.workout_templates (user_id, name, notes, difficulty)
    values (null, 'Intermediate Lower Body',
            'Pair with the upper body day. Warm up to your working weight on squats first.',
            'INTERMEDIATE')
    returning id into tid;

    insert into public.workout_template_exercises
      (user_id, template_id, exercise_id, position, target_sets, target_reps, target_duration_min, rest_seconds)
    select null, tid, e.id, v.pos, v.sets, v.reps, v.dur, v.rest
    from (values
      ('Barbell Back Squat', 0, 4, 8::integer,  null::double precision, 120),
      ('Romanian Deadlift',  1, 3, 10,          null, 120),
      ('Walking Lunge',      2, 3, 12,          null, 90),
      ('Leg Curl',           3, 3, 12,          null, 60),
      ('Calf Raise',         4, 4, 15,          null, 60)
    ) as v(name, pos, sets, reps, dur, rest)
    join public.exercises e on e.user_id is null and e.name = v.name;
  end if;

  -- Advanced ----------------------------------------------------
  if not exists (select 1 from public.workout_templates
                 where user_id is null and name = 'Advanced Full Body Strength') then
    insert into public.workout_templates (user_id, name, notes, difficulty)
    values (null, 'Advanced Full Body Strength',
            'Heavy compound session. Take the full rest periods and stop a set if form breaks down.',
            'ADVANCED')
    returning id into tid;

    insert into public.workout_template_exercises
      (user_id, template_id, exercise_id, position, target_sets, target_reps, target_duration_min, rest_seconds)
    select null, tid, e.id, v.pos, v.sets, v.reps, v.dur, v.rest
    from (values
      ('Deadlift',           0, 5, 5::integer,  null::double precision, 180),
      ('Barbell Back Squat', 1, 4, 6,           null, 180),
      ('Bench Press',        2, 4, 6,           null, 150),
      ('Pull-Up',            3, 4, 8,           null, 120),
      ('Overhead Press',     4, 3, 8,           null, 120),
      ('Kettlebell Swing',   5, 3, 15,          null, 90)
    ) as v(name, pos, sets, reps, dur, rest)
    join public.exercises e on e.user_id is null and e.name = v.name;
  end if;

  if not exists (select 1 from public.workout_templates
                 where user_id is null and name = 'Advanced HIIT Conditioning') then
    insert into public.workout_templates (user_id, name, notes, difficulty)
    values (null, 'Advanced HIIT Conditioning',
            'High-intensity intervals. Push hard during work periods; the rest timer is your recovery window.',
            'ADVANCED')
    returning id into tid;

    insert into public.workout_template_exercises
      (user_id, template_id, exercise_id, position, target_sets, target_reps, target_duration_min, rest_seconds)
    select null, tid, e.id, v.pos, v.sets, v.reps, v.dur, v.rest
    from (values
      ('Dynamic Warm-Up',     0, 1, null::integer, 5::double precision, 30),
      ('HIIT Circuit',        1, 3, null,          8,                   120),
      ('Burpees',             2, 4, null,          1,                   60),
      ('Jump Rope',           3, 3, null,          3,                   90),
      ('Post-Workout Stretch',4, 1, null,          5,                   0)
    ) as v(name, pos, sets, reps, dur, rest)
    join public.exercises e on e.user_id is null and e.name = v.name;
  end if;
end $$;
