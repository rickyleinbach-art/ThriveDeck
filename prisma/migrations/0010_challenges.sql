-- ThriveDeck — Challenges & Gamification (Module 10, part 1) migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
--
-- Challenge DEFINITIONS live in code (src/lib/challenges/catalog.ts), like
-- habit presets — so no challenges table is needed. This table records who
-- joined which challenge and their latest progress snapshot. Progress is
-- computed deterministically from the user's own logged data (the same series
-- the Analytics module reads) and written back here so leaderboards can rank
-- participants without ever reading another user's raw health logs.
--
-- Like community_posts, this is shared-read (any signed-in user can see the
-- leaderboard) but write-scoped to the row owner. display_name is a snapshot
-- so we never read another user's profile.
--
-- Gamification (XP, levels, badges, streaks) is fully derived at read time
-- from logged data + completed challenges, so it needs no tables of its own.

create table if not exists public.challenge_participants (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  display_name   text not null,
  challenge_key  text not null,
  start_date     date not null,
  progress_value double precision not null default 0,
  progress_pct   integer not null default 0 check (progress_pct between 0 and 100),
  completed      boolean not null default false,
  completed_at   timestamptz,
  joined_at      timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists challenge_participants_user_challenge_key
  on public.challenge_participants (user_id, challenge_key);
create index if not exists challenge_participants_leaderboard_idx
  on public.challenge_participants (challenge_key, progress_pct desc, completed_at);

alter table public.challenge_participants enable row level security;

create policy "Authenticated users can view participants"
  on public.challenge_participants for select
  using (auth.uid() is not null);

create policy "Users can join challenges"
  on public.challenge_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update own participation"
  on public.challenge_participants for update
  using (auth.uid() = user_id);

create policy "Users can leave challenges"
  on public.challenge_participants for delete
  using (auth.uid() = user_id);

drop trigger if exists set_challenge_participants_updated_at on public.challenge_participants;
create trigger set_challenge_participants_updated_at
  before update on public.challenge_participants
  for each row execute function public.set_updated_at();
