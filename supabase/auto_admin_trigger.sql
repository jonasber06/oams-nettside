-- ==============================================================================
-- Oppdatering: Gjør at alle nye brukere opprettet i Auth automatisk blir ADMIN
-- Kjør denne i Supabase SQL Editor
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'ADMIN')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
