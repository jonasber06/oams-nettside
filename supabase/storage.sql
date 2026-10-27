-- ==============================================================================
-- OAMS Nettside - Supabase Storage Konfigurasjon
-- Kjør dette i Supabase SQL Editor etter schema.sql
-- ==============================================================================

-- 1. Opprett 'media' bucket for opplasting av bilder og filer (hvis den ikke finnes fra før)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB maks filstørrelse
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage RLS-policyer for 'media'

-- Offentlig lesetilgang: Alle kan hente og vise bilder
create policy "Media public read"
  on storage.objects
  for select
  using (bucket_id = 'media');

-- Admin opplasting: Bare brukere med ADMIN-rolle kan laste opp
create policy "Media admin upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'media'
    and public.is_admin()
  );

-- Admin oppdatering: Bare brukere med ADMIN-rolle kan oppdatere metadata
create policy "Media admin update"
  on storage.objects
  for update
  using (
    bucket_id = 'media'
    and public.is_admin()
  )
  with check (
    bucket_id = 'media'
    and public.is_admin()
  );

-- Admin sletting: Bare brukere med ADMIN-rolle kan slette filer
create policy "Media admin delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'media'
    and public.is_admin()
  );
