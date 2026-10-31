-- ==============================================================================
-- OAMS CMS - Opprett og fyll courses-tabellen + seksjoner for kurs.html
-- Kjør dette skriptet i Supabase SQL Editor for å legge til støtte for Våre kurs
-- uten å overskrive eksisterende styreverv eller dokumenter.
-- ==============================================================================

-- 1. Opprett tabellen public.courses
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text,
  badge        text,
  title        text not null,
  description  text not null,
  target_group text,
  sort_order   int not null default 0,
  visible      boolean not null default true,
  updated_at   timestamptz not null default now()
);

drop trigger if exists touch_courses_updated on public.courses;
create trigger touch_courses_updated
  before update on public.courses
  for each row execute function public.touch_updated_at();

-- 2. Row Level Security (RLS) for public.courses
alter table public.courses enable row level security;

drop policy if exists "Offentlig lesetilgang til synlige kurs" on public.courses;
create policy "Offentlig lesetilgang til synlige kurs"
  on public.courses for select
  using (visible = true or public.is_admin());

drop policy if exists "Admin kan sette inn kurs" on public.courses;
create policy "Admin kan sette inn kurs"
  on public.courses for insert
  with check (public.is_admin());

drop policy if exists "Admin kan oppdatere kurs" on public.courses;
create policy "Admin kan oppdatere kurs"
  on public.courses for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin kan slette kurs" on public.courses;
create policy "Admin kan slette kurs"
  on public.courses for delete
  using (public.is_admin());

-- 3. Seed site_sections for kurs.html
insert into public.site_sections (key, page, content)
values
  (
    'kurs.hero',
    'kurs',
    '{
      "subheading": "Praktisk akuttmedisin og simulering",
      "title": "Våre Kurs"
    }'::jsonb
  ),
  (
    'kurs.intro',
    'kurs',
    '{
      "title": "Lær akuttmedisin i praksis",
      "lead": "OAMS arrangerer praktiske kurs, ferdighetstrening og simuleringer for medisinstudenter og eksterne gjennom hele studieåret.",
      "paragraphs": [
        "Kurstilbudet vårt spenner fra grunnleggende førstehjelp og skadestedsledelse på AMK 1 til avansert casetrening med anestesilege på AMK 2 og spesialiserte kurs innen ultralyd (eFAST), traumeteam-trening (Mini-StudentBEST), akutt pediatri og villmarksmedisin.",
        "Har du fullført AMK 1, kan du også ta vårt Instruktørkurs for å bli godkjent OAMS-instruktør. Som instruktør får du verdifull undervisningserfaring på interne kurs og mulighet til å holde betalte førstehjelpskurs for eksterne bedrifter, skoler og organisasjoner."
      ]
    }'::jsonb
  ),
  (
    'kurs.portefolje_intro',
    'kurs',
    '{
      "title": "Kursportefølje",
      "text": "Her finner du en oversikt over alle våre faste kurs, workshops og faglige arrangementer."
    }'::jsonb
  ),
  (
    'kurs.actions',
    'kurs',
    '{
      "title": "Påmelding, medlemskap og booking",
      "subtitle": "Slik melder du deg på kommende kurs, blir medlem i OAMS eller bestiller et eksternt førstehjelpskurs.",
      "items": [
        {
          "id": "default-fb-events",
          "title": "Kommende arrangementer",
          "description": "Datoer og påmeldingslenker for kommende kurs og temakvelder publiseres fortløpende på vår offisielle Facebook-side.",
          "button_label": "Følg oss på Facebook",
          "url": "https://www.facebook.com/OsloAMS",
          "icon": "calendar",
          "visible": true,
          "sort_order": 1
        },
        {
          "id": "default-membership",
          "title": "Bli medlem i OAMS",
          "description": "Livstidsmedlemskap koster 200 kr (Vipps til OAMS, merk med navn og kull) og gir rabatterte kurspriser og tilgang til instruktørkurs.",
          "button_label": "Registrer medlemskap",
          "url": "mailto:post@oams.no?subject=Nytt%20medlemskap%20OAMS",
          "icon": "user-plus",
          "visible": true,
          "sort_order": 2
        },
        {
          "id": "default-booking",
          "title": "Book et førstehjelpskurs",
          "description": "Vi holder skreddersydde, praktiske førstehjelps- og HLR-kurs for bedrifter, idrettslag, skoler og organisasjoner.",
          "button_label": "Send bookingforespørsel",
          "url": "mailto:post@oams.no?subject=Foresp%C3%B8rsel%20om%20booking",
          "icon": "mail",
          "visible": true,
          "sort_order": 3
        }
      ]
    }'::jsonb
  )
on conflict (key) do update
  set content = excluded.content,
      updated_at = now();

-- 4. Seed public.courses med OAMS sine 3 hovedkurs
truncate table public.courses;

insert into public.courses (slug, title, description, target_group, sort_order, visible)
values
  (
    'amk-1',
    'AMK 1 – Akuttmedisinkurs 1',
    'Grunnsteinen i foreningens kurstilbud. Fokus på skadestedsledelse, systematisk primærundersøkelse etter ABCDE-prinsippet, basal hjerte-lunge-redning (HLR) og håndtering av vanlige akuttmedisinske tilstander.',
    'Alle medisinstudenter (ingen forkunnskapskrav)',
    1,
    true
  ),
  (
    'amk-2',
    'AMK 2 – Akuttmedisinkurs 2',
    'Vårt mest avanserte og intensive kurs over to dager. Bygger videre på AMK 1 med krevende praktiske simulatorcaser, avansert HLR (AHLR), rytmegjenkjenning, defibrillering og bruk av medikamenter under veiledning av anestesilege.',
    'Studenter i kliniske terminer (fra modul 3, krever AMK 1)',
    2,
    true
  ),
  (
    'instruktorkurs',
    'Instruktørkurs',
    'Opplæring av nye instruktører til OAMS. Du lærer pedagogiske prinsipper, veiledning, scenariostyring og praktisk undervisningsteknikk. Etter endt kurs og praksis blir du godkjent OAMS-instruktør og kan holde interne og betalte eksterne kurs.',
    'Medlemmer som har fullført AMK 1',
    3,
    true
  );

