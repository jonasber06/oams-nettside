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
  )
on conflict (key) do update
  set content = excluded.content,
      updated_at = now();


-- 2. BOARD ROLES (15 styreverv)
-- Tøm tabell først for ren seed
truncate table public.board_roles;

insert into public.board_roles (title, member_name, email, sort_order, visible)
values
  ('Leder', null, 'post@oams.no', 1, true),
  ('Nestleder', null, 'post@oams.no', 2, true),
  ('Økonomiansvarlig', null, 'okonomi@oams.no', 3, true),
  ('Fagansvarlig', null, 'fag@oams.no', 4, true),
  ('Eksternansvarlig', null, 'booking@oams.no', 5, true),
  ('Eksternansvarlig', null, 'booking@oams.no', 6, true),
  ('AMK-ansvarlig', null, 'amk@oams.no', 7, true),
  ('AMK-ansvarlig', null, 'amk@oams.no', 8, true),
  ('Ultralydansvarlig', null, 'ultralyd@oams.no', 9, true),
  ('Ultralydansvarlig', null, 'ultralyd@oams.no', 10, true),
  ('Instruktøransvarlig', null, 'instruktor@oams.no', 11, true),
  ('Sponsoransvarlig', null, 'sponsoransvarlig@oams.no', 12, true),
  ('Velferds- og materiellansvarlig', null, 'materiell@oams.no', 13, true),
  ('PR- og webansvarlig', null, 'admin@oams.no', 14, true),
  ('TEAMS-ansvarlig', null, 'post@oams.no', 15, true);


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
