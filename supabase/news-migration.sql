-- Sippy Solutions — Supabase schema for the News Manager.
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New
-- query -> paste -> Run). It is idempotent: running it again is a no-op.
--
-- Additive only: it does not modify pricing_plans, media_items, or any
-- existing policy. The `media` storage bucket needs no new policies — its
-- existing "bucket_id = 'media'" policies (see auth-migration.sql) are not
-- scoped to a folder, so cover images uploaded under news/ in that same
-- bucket are already covered.

create extension if not exists pgcrypto;

/* -------------------------------------------------------------------------- */
/* news_posts                                                                 */
/* -------------------------------------------------------------------------- */

create table if not exists public.news_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text        not null,
  slug             text        not null,
  excerpt          text        not null default '',
  content          text        not null default '',
  cover_image_url  text        not null default '',
  published_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint news_posts_slug_key unique (slug)
);

create index if not exists news_posts_published_at_idx
  on public.news_posts (published_at desc);

/* -------------------------------------------------------------------------- */
/* updated_at                                                                 */
/* -------------------------------------------------------------------------- */

-- Same trigger function schema.sql already created for pricing_plans and
-- media_items. Re-declared with `create or replace` so this file runs
-- standalone even if schema.sql somehow hasn't.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_posts_touch_updated_at on public.news_posts;
create trigger news_posts_touch_updated_at
  before update on public.news_posts
  for each row execute function public.touch_updated_at();

/* -------------------------------------------------------------------------- */
/* Row Level Security                                                         */
/* -------------------------------------------------------------------------- */

alter table public.news_posts enable row level security;

drop policy if exists "news_posts are publicly readable" on public.news_posts;
create policy "news_posts are publicly readable"
  on public.news_posts for select
  to anon, authenticated
  using (true);

drop policy if exists "news_posts insert by authenticated" on public.news_posts;
create policy "news_posts insert by authenticated"
  on public.news_posts for insert
  to authenticated
  with check (true);

drop policy if exists "news_posts update by authenticated" on public.news_posts;
create policy "news_posts update by authenticated"
  on public.news_posts for update
  to authenticated
  using (true) with check (true);

drop policy if exists "news_posts delete by authenticated" on public.news_posts;
create policy "news_posts delete by authenticated"
  on public.news_posts for delete
  to authenticated
  using (true);
