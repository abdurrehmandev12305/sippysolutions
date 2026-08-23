-- Admin auth moves from NextAuth to Supabase Auth.
-- Public (anon) may only read. Only authenticated users may write.
--
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query ->
-- paste -> Run). Idempotent, and safe to run while the old login still works:
-- writes still go through the service role key until the app is switched over,
-- and the service role bypasses RLS entirely.

/* ---------------------------- pricing_plans ---------------------------- */

drop policy if exists "pricing_plans are publicly readable" on public.pricing_plans;
create policy "pricing_plans are publicly readable"
  on public.pricing_plans for select
  to anon, authenticated
  using (true);

drop policy if exists "pricing_plans insert by authenticated" on public.pricing_plans;
create policy "pricing_plans insert by authenticated"
  on public.pricing_plans for insert
  to authenticated
  with check (true);

drop policy if exists "pricing_plans update by authenticated" on public.pricing_plans;
create policy "pricing_plans update by authenticated"
  on public.pricing_plans for update
  to authenticated
  using (true) with check (true);

drop policy if exists "pricing_plans delete by authenticated" on public.pricing_plans;
create policy "pricing_plans delete by authenticated"
  on public.pricing_plans for delete
  to authenticated
  using (true);

/* ----------------------------- media_items ----------------------------- */

drop policy if exists "media_items are publicly readable" on public.media_items;
create policy "media_items are publicly readable"
  on public.media_items for select
  to anon, authenticated
  using (true);

drop policy if exists "media_items insert by authenticated" on public.media_items;
create policy "media_items insert by authenticated"
  on public.media_items for insert
  to authenticated
  with check (true);

drop policy if exists "media_items update by authenticated" on public.media_items;
create policy "media_items update by authenticated"
  on public.media_items for update
  to authenticated
  using (true) with check (true);

drop policy if exists "media_items delete by authenticated" on public.media_items;
create policy "media_items delete by authenticated"
  on public.media_items for delete
  to authenticated
  using (true);

/* ------------------- storage: the `media` bucket objects ------------------ */
-- Uploads and deletes stop using the service role, so the bucket needs its own
-- policies or the User Interface Manager will start failing once the app is
-- switched over.

drop policy if exists "media objects are publicly readable" on storage.objects;
create policy "media objects are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media objects insert by authenticated" on storage.objects;
create policy "media objects insert by authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media objects update by authenticated" on storage.objects;
create policy "media objects update by authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');

drop policy if exists "media objects delete by authenticated" on storage.objects;
create policy "media objects delete by authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');
