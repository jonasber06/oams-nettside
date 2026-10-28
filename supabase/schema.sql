-- ==============================================================================
-- OAMS CMS - Database Schema
-- Kjør denne filen i Supabase SQL Editor (eller via Supabase CLI)
-- ==============================================================================

-- 1. PROFILES (Koblet til Supabase auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'NONE' check (role in ('ADMIN', 'NONE')),
  created_at  timestamptz not null default now()
);

-- Trigger: Automatisk opprett profil når en bruker lages i Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'NONE')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Hjelpefunksjon: sjekk om innlogget bruker er ADMIN
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'ADMIN' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 2. SITE SECTIONS (Fleksible tekstblokker og seksjonsinnhold)
create table if not exists public.site_sections (
  key         text primary key,
  page        text not null,
  content     jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

-- 3. BOARD ROLES (Styret i OAMS)
create table if not exists public.board_roles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  member_name  text, -- null eller tom = "Styremedlem oppdateres"
  image_url    text, -- URL til profilbilde
  email        text not null check (email like '%@oams.no'),
  sort_order   int not null default 0,
  visible      boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- 4. DOCUMENTS (Innsyn og dokumenter)
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  button_label text not null,
  url          text not null,
  icon         text not null default 'file', -- 'doc', 'book', 'folder', 'scale'
  sort_order   int not null default 0,
  visible      boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- Automatisk oppdater updated_at på endringer
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Automatisk oppdatering av updated_at og updated_by for site_sections
create or replace function public.touch_site_sections_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.updated_by is null and auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists touch_site_sections_updated on public.site_sections;
create trigger touch_site_sections_updated
  before insert or update on public.site_sections
  for each row execute function public.touch_site_sections_updated();

drop trigger if exists touch_board_roles_updated on public.board_roles;
create trigger touch_board_roles_updated
  before update on public.board_roles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_documents_updated on public.documents;
create trigger touch_documents_updated
  before update on public.documents
  for each row execute function public.touch_updated_at();


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Profiles RLS
alter table public.profiles enable row level security;

drop policy if exists "Brukere kan lese egen profil eller admin kan lese alle" on public.profiles;
create policy "Brukere kan lese egen profil eller admin kan lese alle"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Kun admin kan oppdatere profiler" on public.profiles;
create policy "Kun admin kan oppdatere profiler"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Site Sections RLS
alter table public.site_sections enable row level security;

drop policy if exists "Offentlig lesetilgang til seksjoner" on public.site_sections;
create policy "Offentlig lesetilgang til seksjoner"
  on public.site_sections for select
  using (true);

drop policy if exists "Admin kan sette inn seksjoner" on public.site_sections;
create policy "Admin kan sette inn seksjoner"
  on public.site_sections for insert
  with check (public.is_admin());

drop policy if exists "Admin kan oppdatere seksjoner" on public.site_sections;
create policy "Admin kan oppdatere seksjoner"
  on public.site_sections for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin kan slette seksjoner" on public.site_sections;
create policy "Admin kan slette seksjoner"
  on public.site_sections for delete
  using (public.is_admin());

-- Board Roles RLS
alter table public.board_roles enable row level security;

drop policy if exists "Offentlig lesetilgang til synlige styreverv" on public.board_roles;
create policy "Offentlig lesetilgang til synlige styreverv"
  on public.board_roles for select
  using (visible = true or public.is_admin());

drop policy if exists "Admin kan sette inn styreverv" on public.board_roles;
create policy "Admin kan sette inn styreverv"
  on public.board_roles for insert
  with check (public.is_admin());

drop policy if exists "Admin kan oppdatere styreverv" on public.board_roles;
create policy "Admin kan oppdatere styreverv"
  on public.board_roles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin kan slette styreverv" on public.board_roles;
create policy "Admin kan slette styreverv"
  on public.board_roles for delete
  using (public.is_admin());

-- Documents RLS
alter table public.documents enable row level security;

drop policy if exists "Offentlig lesetilgang til synlige dokumenter" on public.documents;
create policy "Offentlig lesetilgang til synlige dokumenter"
  on public.documents for select
  using (visible = true or public.is_admin());

drop policy if exists "Admin kan sette inn dokumenter" on public.documents;
create policy "Admin kan sette inn dokumenter"
  on public.documents for insert
  with check (public.is_admin());

drop policy if exists "Admin kan oppdatere dokumenter" on public.documents;
create policy "Admin kan oppdatere dokumenter"
  on public.documents for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin kan slette dokumenter" on public.documents;
create policy "Admin kan slette dokumenter"
  on public.documents for delete
  using (public.is_admin());
