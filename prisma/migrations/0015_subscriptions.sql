-- ThriveDeck — Subscriptions (Module 10 pt2, Pass 1)
-- One row per user tracking their plan + billing state. This is the source of
-- truth the app gates Pro features on. Writes are performed ONLY by trusted
-- server code via the Supabase service role (the Stripe webhook and the dev
-- "simulate upgrade" action), which bypasses RLS — there is deliberately NO
-- user-level write policy, so a user can never self-upgrade from the client.

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'FREE' check (plan in ('FREE','PRO')),
  status                 text not null default 'none'
                           check (status in ('none','trialing','active','past_due','canceled')),
  billing_period         text check (billing_period in ('monthly','annual')),
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  cancel_at_period_end   boolean not null default false,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users may read only their own subscription. No insert/update/delete policy on
-- purpose (see header) — trusted server code uses the service role.
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Backfill a FREE row for every existing user.
insert into public.subscriptions (user_id)
  select id from public.profiles
  on conflict (user_id) do nothing;

-- Create the FREE subscription alongside the profile on every new signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.subscriptions (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;
