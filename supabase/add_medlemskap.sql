-- ==============================================================================
-- OAMS CMS - Seed-data for medlemskap.html i eksisterende public.site_sections
-- Kan kjøres trygt flere ganger (ON CONFLICT (key) DO NOTHING).
-- ==============================================================================

INSERT INTO public.site_sections (key, page, content)
VALUES
  (
    'medlemskap.hero',
    'medlemskap',
    '{
      "title": "OAMS-Medlemskap",
      "subheading": "Bli en del av Oslo Akuttmedisinske Studentforening"
    }'::jsonb
  ),
  (
    'medlemskap.info',
    'medlemskap',
    '{
      "title": "Hva innebærer et OAMS-medlemskap?",
      "text": "Medlemskapet gir deg praktisk akuttmedisinsk erfaring ved siden av studiet, tilgang til kurs og fagkvelder, og muligheten til å engasjere deg i en av Norges mest aktive medisinstudentforeninger.",
      "benefits": [
        {
          "id": "kurs",
          "icon": "pulse",
          "title": "Praktiske kurs til medlemspris",
          "description": "Få tilgang til våre populære kurs som AMK 1, AMK 2 og temakvelder med simulering, casetrening og tett veiledning – til redusert medlemspris gjennom hele studietiden."
        },
        {
          "id": "instruktor",
          "icon": "users",
          "title": "Utdanning som instruktør",
          "description": "Etter fullført AMK 1 kan du søke om å ta instruktørkurs. Som godkjent OAMS-instruktør får du undervisningserfaring på interne kurs og mulighet til å ta betalte eksterne førstehjelpsoppdrag."
        },
        {
          "id": "fellesskap",
          "icon": "heart",
          "title": "Faglig og sosialt fellesskap",
          "description": "Møt andre medisinstudenter på tvers av kull som deler interessen for akuttmedisin. Vi arrangerer fagkvelder, foredrag med erfarne klinikere og sosiale samlinger gjennom hele studieåret."
        },
        {
          "id": "medbestemmelse",
          "icon": "check",
          "title": "Medbestemmelse og styreverv",
          "description": "Som medlem har du møte- og stemmerett på OAMS sin generalforsamling, og du kan stille til valg i styret for å være med på å utvikle kurs, utstyr og drift i foreningen."
        }
      ]
    }'::jsonb
  ),
  (
    'medlemskap.practical',
    'medlemskap',
    '{
      "title": "Praktisk informasjon om medlemskapet",
      "intro": "Medlemskapet er enkelt å komme i gang med og krever ingen forkunnskaper i akuttmedisin.",
      "items": [
        {
          "id": "hvem",
          "text": "**Hvem kan bli medlem?** Alle medisinstudenter ved Universitetet i Oslo (UiO), uansett modul og erfaring."
        },
        {
          "id": "innmelding",
          "text": "**Slik melder du deg inn:** Betal medlemskontingenten via Vipps-knappen øverst på denne siden for å registrere medlemskapet ditt."
        },
        {
          "id": "pamelding",
          "text": "**Påmelding til kurs:** Datoer og påmeldingslenker til kommende kurs og arrangementer publiseres fortløpende på Facebook og Instagram."
        },
        {
          "id": "sporsmal",
          "text": "**Spørsmål eller endringer?** Ta gjerne kontakt med styret på **post@oams.no** dersom du lurer på noe om medlemskapet."
        }
      ],
      "primary_btn_label": "Se våre kurs",
      "primary_btn_url": "medisinstudent.html#kursoversikt",
      "secondary_btn_label": "Kontakt oss",
      "secondary_btn_url": "kontakt_oss.html"
    }'::jsonb
  )
ON CONFLICT (key) DO NOTHING;
