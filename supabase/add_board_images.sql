-- ==============================================================================
-- OAMS CMS - Migrering: Bildekolonne for styreverv & Storage bucket
-- Kjør dette i Supabase SQL Editor (tar 5 sekunder)
-- ==============================================================================

-- 1. Legg til image_url på board_roles dersom den mangler
alter table public.board_roles 
add column if not exists image_url text;

-- 2. Opprett 'media' bucket for lagring av styrebilder og dokumenter
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB maks filstørrelse
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- 3. Storage RLS-policyer for 'media'

-- Offentlig lesing for alle besøkende
drop policy if exists "Media public read" on storage.objects;
create policy "Media public read"
  on storage.objects for select
  using (bucket_id = 'media');

-- Admin opplasting
drop policy if exists "Media admin upload" on storage.objects;
create policy "Media admin upload"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and public.is_admin()
  );

-- Admin oppdatering
drop policy if exists "Media admin update" on storage.objects;
create policy "Media admin update"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- Admin sletting
drop policy if exists "Media admin delete" on storage.objects;
create policy "Media admin delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
