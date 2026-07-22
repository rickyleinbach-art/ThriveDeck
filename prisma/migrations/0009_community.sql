-- ThriveDeck — Community (Module 9) migration
-- Run this in the Supabase SQL editor (or via prisma migrate + manual RLS).
-- Prisma manages table structure; RLS policies must be applied via SQL like this,
-- because Prisma does not manage Postgres row-level security.
--
-- Community is the app's first SHARED, multi-user data: every signed-in user
-- can read every post and comment, but may only write/edit/delete their own.
-- Read policies therefore scope to `auth.uid() is not null` (authenticated)
-- rather than to the row owner.
--
-- author_name is snapshotted at write time (like habit_logs.habit_name) so we
-- never need to read another user's profile (profiles RLS is owner-only), and
-- so anonymous posts simply store a null author. is_flagged marks content the
-- medical-advice moderation caught (see src/lib/community/moderation.ts);
-- dosing content is blocked before insert and never reaches these tables.

-- =============================================================
-- community_posts — one row per post. like_count / comment_count
-- are denormalized counters kept fresh by triggers below so the
-- feed renders without per-post aggregate queries.
-- =============================================================
create table if not exists public.community_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  author_name   text,                       -- snapshot; null when anonymous
  category      text not null check (category in
                  ('WEIGHT_LOSS','NUTRITION','FITNESS','RECIPES','WALKING_CLUB',
                   'STRENGTH','CARDIO','PEPTIDE_EXPERIENCES','LIFESTYLE',
                   'SUCCESS_STORIES','PROGRESS_PICS','MOTIVATION','MEAL_PREP',
                   'QUESTIONS','GENERAL')),
  title         text not null,
  body          text not null,
  image_path    text,
  is_anonymous  boolean not null default false,
  is_pinned     boolean not null default false,  -- pinned educational posts (admin, Module 10)
  is_flagged    boolean not null default false,  -- caught by medical-advice moderation
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists community_posts_category_created_idx
  on public.community_posts (category, created_at desc);
create index if not exists community_posts_created_idx
  on public.community_posts (created_at desc);
create index if not exists community_posts_user_idx
  on public.community_posts (user_id);

alter table public.community_posts enable row level security;

create policy "Authenticated users can view posts"
  on public.community_posts for select
  using (auth.uid() is not null);

create policy "Users can create own posts"
  on public.community_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.community_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.community_posts for delete
  using (auth.uid() = user_id);

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

-- =============================================================
-- community_comments — flat comments on a post.
-- =============================================================
create table if not exists public.community_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.community_posts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  author_name  text,                          -- snapshot; null when anonymous
  body         text not null,
  is_anonymous boolean not null default false,
  is_flagged   boolean not null default false,
  like_count   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists community_comments_post_created_idx
  on public.community_comments (post_id, created_at);

alter table public.community_comments enable row level security;

create policy "Authenticated users can view comments"
  on public.community_comments for select
  using (auth.uid() is not null);

create policy "Users can create own comments"
  on public.community_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.community_comments for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.community_comments for delete
  using (auth.uid() = user_id);

-- =============================================================
-- community_post_likes — one row per (user, post). Own rows only;
-- aggregate counts live on community_posts.like_count.
-- =============================================================
create table if not exists public.community_post_likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists community_post_likes_user_post_key
  on public.community_post_likes (user_id, post_id);

alter table public.community_post_likes enable row level security;

create policy "Users can view own post likes"
  on public.community_post_likes for select
  using (auth.uid() = user_id);

create policy "Users can add own post likes"
  on public.community_post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own post likes"
  on public.community_post_likes for delete
  using (auth.uid() = user_id);

-- =============================================================
-- community_comment_likes — one row per (user, comment).
-- =============================================================
create table if not exists public.community_comment_likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references public.community_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists community_comment_likes_user_comment_key
  on public.community_comment_likes (user_id, comment_id);

alter table public.community_comment_likes enable row level security;

create policy "Users can view own comment likes"
  on public.community_comment_likes for select
  using (auth.uid() = user_id);

create policy "Users can add own comment likes"
  on public.community_comment_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own comment likes"
  on public.community_comment_likes for delete
  using (auth.uid() = user_id);

-- =============================================================
-- community_saves — a user's bookmarked posts. Own rows only.
-- =============================================================
create table if not exists public.community_saves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists community_saves_user_post_key
  on public.community_saves (user_id, post_id);

alter table public.community_saves enable row level security;

create policy "Users can view own saves"
  on public.community_saves for select
  using (auth.uid() = user_id);

create policy "Users can add own saves"
  on public.community_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own saves"
  on public.community_saves for delete
  using (auth.uid() = user_id);

-- =============================================================
-- Counter maintenance. SECURITY DEFINER so a like/comment on
-- someone else's post can update that post's counter despite the
-- owner-only write policy (mirrors public.handle_new_user).
-- =============================================================
create or replace function public.community_bump_post_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_post_likes_count on public.community_post_likes;
create trigger community_post_likes_count
  after insert or delete on public.community_post_likes
  for each row execute function public.community_bump_post_like_count();

create or replace function public.community_bump_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_comments_count on public.community_comments;
create trigger community_comments_count
  after insert or delete on public.community_comments
  for each row execute function public.community_bump_comment_count();

create or replace function public.community_bump_comment_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_comments set like_count = like_count + 1 where id = new.comment_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_comment_likes_count on public.community_comment_likes;
create trigger community_comment_likes_count
  after insert or delete on public.community_comment_likes
  for each row execute function public.community_bump_comment_like_count();
