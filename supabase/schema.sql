-- Sippy Solutions — Supabase schema for the Pricing Manager and the
-- User Interface Manager.
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New
-- query -> paste -> Run). It is idempotent: running it again is a no-op.
--
-- This file creates the tables and their read policies. The write policies
-- live in `supabase/auth-migration.sql` — run that one straight after this.
--
-- Admin sign-in is Supabase Auth. The login rate limiter stays on disk and
-- does not touch Supabase.

create extension if not exists pgcrypto;

/* -------------------------------------------------------------------------- */
/* pricing_plans                                                              */
/* -------------------------------------------------------------------------- */

-- `id` is text, not uuid: the plans migrated from data/pricing.json carry
-- human-written slugs ("concurrent-calls-50") alongside generated uuids, and
-- both must survive. New rows fall back to a uuid, matching what the API's
-- `parsePlan` mints when a payload arrives without an id.
create table if not exists public.pricing_plans (
  id         text primary key default gen_random_uuid()::text,
  name       text        not null,
  -- [{ "label": "CPU", "value": "Intel Xeon E3-1246V3" }, …] — the spec table
  -- rendered on each pricing card, kept ordered, so jsonb array not a join.
  specs      jsonb       not null default '[]'::jsonb,
  location   text        not null,
  flag       text        not null default '',
  currency   text        not null default '€',
  price      numeric(12, 2) not null check (price >= 0),
  period     text        not null default 'Per Month',
  -- Display position on /pricing. Appended as max+1; the created_at tiebreak
  -- keeps the order stable if two inserts ever collide on the same value.
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_plans_sort_order_idx
  on public.pricing_plans (sort_order, created_at);

/* -------------------------------------------------------------------------- */
/* media_items                                                                */
/* -------------------------------------------------------------------------- */

-- `file` is the object name inside the `media` storage bucket *and* the handle
-- the admin dashboard uses to delete and reorder, so it has to stay unique.
-- Images only; they live under screenshots/, exactly as they did in public/.
create table if not exists public.media_items (
  id         uuid primary key default gen_random_uuid(),
  file       text        not null unique,
  url        text        not null,
  type       text        not null check (type = 'image'),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_items_sort_order_idx
  on public.media_items (sort_order, created_at);

/* -------------------------------------------------------------------------- */
/* updated_at                                                                 */
/* -------------------------------------------------------------------------- */

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pricing_plans_touch_updated_at on public.pricing_plans;
create trigger pricing_plans_touch_updated_at
  before update on public.pricing_plans
  for each row execute function public.touch_updated_at();

drop trigger if exists media_items_touch_updated_at on public.media_items;
create trigger media_items_touch_updated_at
  before update on public.media_items
  for each row execute function public.touch_updated_at();

/* -------------------------------------------------------------------------- */
/* Row Level Security                                                         */
/* -------------------------------------------------------------------------- */

-- Both tables are world-readable (they are the public /pricing and
-- /user-interface pages) and not writable by the anon role.
--
-- The read policies are below. The insert/update/delete policies — granted to
-- `authenticated` only — are in `supabase/auth-migration.sql`, which must be
-- run as well or the admin dashboard cannot save anything. Writes are made
-- with the signed-in admin's own session, so RLS is the real authorisation
-- boundary rather than something the server bypasses.

alter table public.pricing_plans enable row level security;
alter table public.media_items  enable row level security;

drop policy if exists "pricing_plans are publicly readable" on public.pricing_plans;
create policy "pricing_plans are publicly readable"
  on public.pricing_plans for select
  to anon, authenticated
  using (true);

drop policy if exists "media_items are publicly readable" on public.media_items;
create policy "media_items are publicly readable"
  on public.media_items for select
  to anon, authenticated
  using (true);
