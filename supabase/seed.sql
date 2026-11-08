-- ==============================================================================
-- OAMS CMS - Seed Data for "Om oss" (om_oss.html)
-- Kjør denne i Supabase SQL Editor etter at schema.sql er kjørt
-- ==============================================================================

-- 1. SITE SECTIONS (om_oss)
insert into public.site_sections (key, page, content)
values
  (
    'om_oss.hero',
    'om_oss',
    '{
      "subheading": "Oslo Akuttmedisinske Studentforening",
      "title": "Hva er OAMS?"
    }'::jsonb
  ),
  (
    'om_oss.hvem_er_vi',
    'om_oss',
    '{
      "title": "Hvem er vi?",
      "lead": "OAMS er en studentforening med fokus på akuttmedisin!",
      "paragraphs": [
        "Oslo Akuttmedisinske Studentforening, eller OAMS, er en forening ved Det Medisinske Fakultet på Universitetet i Oslo (UiO). Andre studenter med interesse for akuttmedisin er også hjertelig velkommen!",
        "Vi består av et styre på 15 medlemmer som drifter foreningen, og fantastiske medlemmer som interesserer seg for akuttmedisin."
      ]
    }'::jsonb
  ),
  (
    'om_oss.kjerneverdier',
    'om_oss',
    '{
      "title": "Våre kjerneverdier",
      "text": "Foreningens formål er å bevisstgjøre behovet for kompetanse innenfor akuttmedisin, fremme interessen for faget og bidra til økt kyndighet og trygghet rundt akuttmedisinske situasjoner blant kommende leger og lekfolk."
    }'::jsonb
  ),
  (
    'om_oss.styret_intro',
    'om_oss',
    '{
      "title": "Styret i OAMS",
      "text": "Foreningen ledes og driftes av et styre på 15 medlemmer fordelt på ulike fag- og ansvarsområder. Her er en oversikt over styrets roller og kontaktkanaler."
    }'::jsonb
  ),
  (
    'om_oss.dokumenter_intro',
    'om_oss',
    '{
      "title": "Innsyn og dokumenter",
      "text": "Offisiell dokumentasjon om foreningens drift, styreverv, vedtekter, styremøtereferater og regnskap."
    }'::jsonb
  ),
  (
    'kontakt_oss.hero',
    'kontakt_oss',
    '{
      "subheading": "Oslo Akuttmedisinske Studentforening",
      "title": "Kontakt oss"
    }'::jsonb
  ),
  (
    'kontakt_oss.kontaktinfo',
    'kontakt_oss',
    '{
      "title": "Kontaktinfo",
      "subtitle": "Har du spørsmål om kurs, booking eller medlemskap? Ta gjerne kontakt med oss på e-post eller via våre sosiale medier.",
      "items": [
        {
          "id": "default-address",
          "title": "Adresse",
          "text": "Domus Medica, Sognsvannsveien 9,\n0372 Oslo",
          "link": "",
          "icon": "location",
          "visible": true,
          "sort_order": 1
        },
        {
          "id": "default-email",
          "title": "Email oss",
          "text": "post@oams.no",
          "link": "mailto:post@oams.no",
          "icon": "mail",
          "visible": true,
          "sort_order": 2
        }
      ]
    }'::jsonb
  ),
  (
    'kontakt_oss.socials',
    'kontakt_oss',
    '{
      "items": [
        {
          "id": "default-fb",
          "platform": "facebook",
          "label": "Facebook",
          "url": "https://www.facebook.com/OsloAMS/",
          "visible": true,
          "sort_order": 1
        },
        {
          "id": "default-ig",
          "platform": "instagram",
          "label": "Instagram",
          "url": "https://www.instagram.com/osloams/",
          "visible": true,
          "sort_order": 2
        },
        {
          "id": "default-li",
          "platform": "linkedin",
          "label": "LinkedIn",
          "url": "https://www.linkedin.com/company/oslo-akuttmedisinske-studentforening/",
          "visible": true,
          "sort_order": 3
        }
      ]
    }'::jsonb
  ),
  (
    'student.hero',
    'student',
    '{
      "subheading": "Praktisk akuttmedisin og simulering",
      "title": "Våre Kurs"
    }'::jsonb
  ),
  (
    'student.intro',
    'student',
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
    'student.portefolje_intro',
    'student',
    '{
      "title": "Kursportefølje",
      "text": "Her finner du en oversikt over alle våre faste kurs, workshops og faglige arrangementer."
    }'::jsonb
  ),
  (
    'student.actions',
    'student',
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


-- 2. BOARD ROLES (4 standard styreverv)
-- Tøm tabell først for ren seed
truncate table public.board_roles;

insert into public.board_roles (title, member_name, email, sort_order, visible)
values
  ('Leder', null, 'post@oams.no', 1, true),
  ('Nestleder', null, 'post@oams.no', 2, true),
  ('Økonomiansvarlig', null, 'okonomi@oams.no', 3, true),
  ('PR- og webansvarlig', null, 'admin@oams.no', 4, true);


-- 3. DOCUMENTS (4 offisielle dokumenter)
truncate table public.documents;

insert into public.documents (title, description, button_label, url, icon, sort_order, visible)
values
  (
    'Vervbeskrivelsene',
    'Hva gjør de ulike styremedlemmene? Oversikt over oppgaver og mandat for hvert verv.',
    'Vervbeskrivelser',
    'https://docs.google.com/document/d/1AnSQ-GrBeSZEnT5qUjUZuYcdr1h59-i9IiBNg1tomJo/edit?usp=sharing',
    'doc',
    1,
    true
  ),
  (
    'Organisasjonens vedtekter',
    'Formelle vedtekter som regulerer foreningens virksomhet, formål og medlemsrettigheter.',
    'Vedtekter',
    'https://drive.google.com/file/d/1ENE9fpAJcTB5i9imtZ_cBeUEC-9tHJq5/view?usp=sharing',
    'book',
    2,
    true
  ),
  (
    'Styremøtereferater',
    'Protokoller og referater fra avholdte styremøter og generalforsamlinger i foreningen.',
    'Referater',
    'https://drive.google.com/drive/folders/12pSyZB4pRYgdukFhhmuPq60ccUwumY6b?usp=sharing',
    'folder',
    3,
    true
  ),
  (
    'Oversikt over økonomi',
    'Årlige regnskapsoversikter, budsjetter og økonomisk dokumentasjon for OAMS.',
    'Regnskapsoversikt',
    'https://drive.google.com/drive/folders/1-Nla8FcmKf8Bjf2xOANfBIwMOZWFo-Q5?usp=sharing',
    'scale',
    4,
    true
  );


-- 4. COURSES (3 hovedkurs i OAMS)
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
