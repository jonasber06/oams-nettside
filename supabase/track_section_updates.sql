-- ==============================================================================
-- OAMS CMS - Sporing av sist oppdatert av (updated_by) for site_sections
-- Kjør denne i Supabase SQL Editor
-- ==============================================================================

-- Automatisk oppdatering av updated_at og updated_by via trigger
create or replace function public.touch_site_sections_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  -- Hvis updated_by ikke eksplisitt er satt fra klientskriptet, bruk innlogget auth.uid()
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
