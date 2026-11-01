-- ==============================================================================
-- OAMS CMS - Invitasjon og opprettelse av nye admin-brukere
-- Kjør dette skriptet i Supabase SQL Editor for å aktivere "+ Ny Bruker"-funksjonen.
-- Fungerer selv når offentlig "Allow new users to sign up" er skrudd AV i Supabase!
-- ==============================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. Tabell for forhåndsgodkjente admin-invitasjoner
create table if not exists public.admin_invites (
  email       text primary key,
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.admin_invites enable row level security;

drop policy if exists "Kun admin kan lese invitasjoner" on public.admin_invites;
create policy "Kun admin kan lese invitasjoner"
  on public.admin_invites for select
  using (public.is_admin());

drop policy if exists "Kun admin kan opprette invitasjoner" on public.admin_invites;
create policy "Kun admin kan opprette invitasjoner"
  on public.admin_invites for insert
  with check (public.is_admin());

drop policy if exists "Kun admin kan slette invitasjoner" on public.admin_invites;
create policy "Kun admin kan slette invitasjoner"
  on public.admin_invites for delete
  using (public.is_admin());

-- 2. Oppdater trigger-funksjonen slik at inviterte e-poster automatisk får ADMIN-rolle
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  assigned_role text := 'NONE';
begin
  if exists (
    select 1 from public.admin_invites
    where lower(trim(email)) = lower(trim(coalesce(new.email, '')))
  ) then
    assigned_role := 'ADMIN';
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, lower(trim(coalesce(new.email, ''))), assigned_role)
  on conflict (id) do update
    set email = excluded.email,
        role = case
          when public.profiles.role = 'ADMIN' then 'ADMIN'
          else excluded.role
        end;

  return new;
end;
$$;

-- 3. RPC-funksjon: Opprett bruker direkte i auth.users (med tilfeldig passord) og gi ADMIN-rolle
-- Dette gjør at "Allow new users to sign up" kan stå AV i Supabase Dashboard for ekstra sikkerhet!
create or replace function public.admin_authorize_user(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  clean_email text := lower(trim(coalesce(target_email, '')));
  existing_user_id uuid;
  new_user_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'Kun innloggede administratorer kan legge til nye brukere.';
  end if;

  if clean_email = '' or position('@' in clean_email) = 0 then
    raise exception 'Ugyldig e-postadresse.';
  end if;

  -- Lagre i admin_invites
  insert into public.admin_invites (email, invited_by)
  values (clean_email, auth.uid())
  on conflict (email) do update
    set invited_by = auth.uid(),
        created_at = now();

  -- Sjekk om brukeren allerede finnes i auth.users
  select id into existing_user_id
  from auth.users
  where lower(trim(email)) = clean_email
  limit 1;

  if existing_user_id is null then
    -- Opprett brukeren direkte i auth.users med et tilfeldig kryptert passord
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      clean_email,
      extensions.crypt(gen_random_uuid()::text || 'Aa1!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Opprett tilhørende e-post-identitet i auth.identities
    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      new_user_id,
      new_user_id::text,
      jsonb_build_object(
        'sub', new_user_id::text,
        'email', clean_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );

    existing_user_id := new_user_id;
  end if;

  -- Sørg for at brukeren står som ADMIN i public.profiles
  insert into public.profiles (id, email, role)
  values (existing_user_id, clean_email, 'ADMIN')
  on conflict (id) do update
    set role = 'ADMIN',
        email = clean_email;

  return jsonb_build_object(
    'already_exists', true,
    'user_id', existing_user_id,
    'email', clean_email
  );
end;
$$;

grant execute on function public.admin_authorize_user(text) to authenticated;

-- 4. RPC-funksjon: Slett admin-bruker og invitasjon helt fra systemet (auth.users, profiles og admin_invites)
create or replace function public.admin_revoke_user(target_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  clean_email text := lower(trim(coalesce(target_email, '')));
begin
  if not public.is_admin() then
    raise exception 'Kun innloggede administratorer kan slette brukere.';
  end if;

  -- Forhindre at man sletter sin egen brukerkonto ved et uhell
  if exists (
    select 1 from auth.users
    where id = auth.uid() and lower(trim(email)) = clean_email
  ) then
    raise exception 'Du kan ikke slette din egen administrator-konto.';
  end if;

  delete from public.admin_invites
  where lower(trim(email)) = clean_email;

  delete from public.profiles
  where lower(trim(email)) = clean_email;

  delete from auth.users
  where lower(trim(email)) = clean_email;
end;
$$;

grant execute on function public.admin_revoke_user(text) to authenticated;

-- 5. Tillat også @gmail.com (og @oams.no) i board_roles
alter table public.board_roles drop constraint if exists board_roles_email_check;
alter table public.board_roles add constraint board_roles_email_check
  check (email like '%@oams.no' or email like '%@gmail.com');
