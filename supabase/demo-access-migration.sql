-- Sippy Solutions — Supabase schema for the Demo Access popover on
-- `/user-interface` and its admin dashboard manager.
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New
-- query -> paste -> Run). It is idempotent: running it again is a no-op.
--
-- Additive only: it does not modify pricing_plans, media_items, news_posts,
-- or any existing policy. Requires `schema.sql` to already have run (it
-- reuses the `touch_updated_at()` trigger function defined there).

/* -------------------------------------------------------------------------- */
/* demo_access                                                                */
/* -------------------------------------------------------------------------- */

-- A single fixed row, not a list: `id` is pinned to 1 by the check
-- constraint, so there is exactly one set of demo credentials to read and
-- update — no create/delete ever happens against this table.
create table if not exists public.demo_access (
  id         integer     primary key default 1 check (id = 1),
  url        text        not null default '',
  username   text        not null default '',
  password   text        not null default '',
  updated_at timestamptz not null default now()
);

-- Seeds the one row this table will ever hold. Left blank; filled in from
-- the admin dashboard's Demo Access Manager.
insert into public.demo_access (id) values (1)
  on conflict (id) do nothing;

drop trigger if exists demo_access_touch_updated_at on public.demo_access;
create trigger demo_access_touch_updated_at
  before update on public.demo_access
  for each row execute function public.touch_updated_at();

/* -------------------------------------------------------------------------- */
/* Row Level Security                                                         */
/* -------------------------------------------------------------------------- */

-- Same split as every other table: world-readable (the public Demo popover
-- reads it), writable only by an authenticated admin session. No insert or
-- delete policy — the single row is seeded above and only ever updated.

alter table public.demo_access enable row level security;

drop policy if exists "demo_access is publicly readable" on public.demo_access;
create policy "demo_access is publicly readable"
  on public.demo_access for select
  to anon, authenticated
  using (true);

drop policy if exists "demo_access update by authenticated" on public.demo_access;
create policy "demo_access update by authenticated"
  on public.demo_access for update
  to authenticated
  using (true) with check (true);
