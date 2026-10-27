-- ==============================================================================
-- OAMS CMS - Password Reset Helper
-- Kjør denne i Supabase SQL Editor
-- ==============================================================================

-- Funksjon for å sjekke om en e-postadresse tilhører en aktiv ADMIN i OAMS
create or replace function public.check_admin_email_exists(email_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where lower(trim(email)) = lower(trim(email_input))
      and role = 'ADMIN'
  );
end;
$$;

-- Gi rettigheter til anonyme (login-siden) og innloggede
grant execute on function public.check_admin_email_exists(text) to anon, authenticated;
