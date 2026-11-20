# OAMS Nettside og Adminpanel

Offisiell nettside og innebygd innholdssystem (CMS) for **Oslo Akuttmedisinske Studentforening (OAMS)** – en faglig studentforening ved medisinstudiet på Universitetet i Oslo som arrangerer praktiske akuttmedisinske kurs for medisinstudenter og førstehjelpskurs for eksterne (bedrifter, skoler og organisasjoner).

---

## Sider og funksjonalitet

### Offentlige sider
- **Forsiden (`index.html`)** – Fullskjerms hero-seksjon med hurtiglenker, introduksjon til førstehjelpskurs (`forside.intro`), dynamisk bildekarusell (`forside.slideshow`) og kontaktinfo-boks synkronisert med `kontakt_oss`.
- **Om oss (`om_oss.html`)** – Informasjon om foreningen (`om_oss.hero`, `om_oss.hvem_er_vi`), dynamisk styreoversikt med roller, e-post og profilbilder (`board_roles`), samt lenker til offentlige dokumenter (`documents`).
- **For medisinstudenter (`medisinstudent.html`) & Merch-skjema (`merchForm.html`)** – Medlemskapsinformasjon og Vipps-lenke (`student.medlemskap`), oversikt over interne kurs (`courses`), sosiale medier (`student.some`), OAMS-merch (`student.merch`) og bestillingsskjema for merch med støtte for flere plagg (opptil 5) per bestilling via FormSubmit.
- **OAMS-Medlemskap (`medlemskap.html`)** – Egen medlemskapsside med samme Vipps-boks som på `medisinstudent.html`, dynamiske fordelsbokser med ikonvalg (`medlemskap.info`) og praktisk informasjon (`medlemskap.practical`) lastet fra Supabase.
- **Kontakt oss (`kontakt_oss.html`)** – Kontaktpunkter (adresse, e-post m.m. i `kontakt_oss.kontaktinfo`) og lenker til sosiale medier (`kontakt_oss.socials`).
- **Book oss (`bookoss.html`) & Bestillingsskjema (`bookForm.html`)** – Informasjon om eksterne kurs og bestillingsskjema med direkte e-postinnsending via FormSubmit (`fetch` til `https://formsubmit.co/ajax/...`).

### Admin-panel (`/admin`)
- **Innlogging & tilgangskontroll (`admin/login.html`, `admin/js/auth-guard.js`)** – Autentisering via Supabase Auth. Kun brukere med `role = 'ADMIN'` i `profiles`-tabellen får tilgang til admin-sidene.
- **Dashboard (`admin/index.html`)** – Oversikt med snarveier til alle redigerbare deler av nettsiden.
- **Rediger Forsiden (`admin/forside.html`)** – Redigering av introseksjon, dynamisk bildekarusell (legg til/slett bilder, endre rekkefølge med piler eller dra-og-slipp, last opp bilder) og tekst i kontaktboksen.
- **Rediger Om oss (`admin/om-oss.html`)** – Redigering av hero, brødtekst, styreverv (inkl. profilbilder og rekkefølge) og dokumenter.
- **Rediger Medisinstudent (`admin/medisinstudent.html`)** – Redigering av medlemskap/Vipps-boks, kursportefølje (`courses`), sosiale medier og merch-boks.
- **Rediger OAMS-Medlemskap (`admin/medlemskap.html`)** – Redigering av hero, fordelsbokser (tekst, SVG-ikon fra dropdown, legge til/slette/flytte; oddetall sentrerer siste boks) og praktisk informasjon (enkeltpunkter som objekter).
- **Rediger Kontakt oss (`admin/kontakt-oss.html`)** – Redigering av kontaktpunkter og sosiale medier-kanaler (oppdaterer både `kontakt_oss.html` og kontaktboksen på forsiden).
- **Fet skrift i alle tekstfelt** – Alle tekstfelt i admin-panelet støtter `**fet tekst**` via hurtigtast (`Cmd+B` / `Ctrl+B`), flytende **B Fet**-knapp og live forhåndsvisning (`admin/js/ui.js`), og rendres XSS-sikkert på de offentlige sidene via `js/text-format.js`.
- **Automatisk lagring (Auto-Save)** – Endringer lagres automatisk til Supabase (`createAutoSaver` i `admin/js/ui.js`) med debounce ved skriving, rask lagring ved valg/flytting/bildeopplasting og sanntids statusindikator øverst i panelet (`Cmd+S` / `Ctrl+S` støttes også for umiddelbar lagring).

---

## Teknologistack

- **Frontend:** Statisk HTML5, CSS3 (`style.css`, `admin/admin.css`) og Vanilla ES6 JavaScript-moduler (`script.js`, `js/text-format.js`, `js/pages/*`, `admin/js/*`). Ingen byggeverktøy er påkrevd.
- **Backend & CMS:** [Supabase](https://supabase.com/) (PostgreSQL med Row Level Security, Supabase Auth og Supabase Storage).
- **Skjemainnsending (`bookForm.html`, `merchForm.html`):** FormSubmit AJAX API.
- **Webserver-konfigurasjon:** Apache-oppsett i `.htaccess` med sikkerhetsheadere, `/admin`-omdirigering og `noindex, nofollow`-regler for admin-panelet.

---

## Mappestruktur

```text
oams-nettside/
├── index.html                  # Forsiden
├── om_oss.html                 # Om foreningen, styret og dokumenter
├── medisinstudent.html         # For medisinstudenter (medlemskap, kurs, merch)
├── medlemskap.html             # OAMS-Medlemskap (Vipps, fordeler og praktisk info)
├── kontakt_oss.html            # Kontaktinformasjon og sosiale medier
├── bookoss.html                # Informasjon om booking for bedrifter/eksterne
├── bookForm.html               # Skjema for kursbestilling
├── merchForm.html              # Skjema for merch-bestilling (inntil 5 plagg)
├── style.css                   # Felles stilark for alle offentlige sider
├── script.js                   # Meny, mobilnavigasjon og bildekarusell-kontroller
├── .htaccess                   # Apache-regler og sikkerhetsheadere
├── package.json                # npm-skript for lokal utviklingsserver
├── assets/                     # Logoer, bakgrunnsbilder og favicons
├── js/
│   ├── supabase-client.js      # Konfigurasjon og initiering av Supabase-klient
│   ├── text-format.js          # XSS-sikker rendring av tekst med **fet skrift**
│   └── pages/                  # Frontend-skript som henter CMS-innhold fra Supabase
│       ├── forside.js
│       ├── om-oss.js
│       ├── medisinstudent.js
│       ├── medlemskap.js
│       └── kontakt-oss.js
├── admin/                      # Beskyttet CMS-adminpanel
│   ├── index.html              # Dashboard
│   ├── login.html              # Innlogging og passordtilbakestilling
│   ├── forside.html            # Editor for forsiden
│   ├── om-oss.html             # Editor for Om oss
│   ├── medisinstudent.html     # Editor for Medisinstudent
│   ├── medlemskap.html         # Editor for OAMS-Medlemskap
│   ├── kontakt-oss.html        # Editor for Kontakt oss
│   ├── brukere.html            # Administrasjon av admin-brukere
│   ├── admin.css               # Stilark for hele admin-panelet
│   └── js/
│       ├── auth-guard.js       # Tilgangssjekk og utlogging
│       ├── login.js            # Innloggingslogikk
│       ├── ui.js               # Toast-varsler, knapptilstand, createAutoSaver og fet-tekst-støtte
│       └── editors/            # Logikk for de ulike admin-sidene
└── supabase/                   # SQL-skript for database, RLS og lagring
    ├── schema.sql              # Tabeller, triggere og RLS-policyer
    ├── seed.sql                # Startinnhold for nettsiden
    ├── storage.sql             # Oppsett av 'media'-bucket og tilgangspolicyer
    ├── add_admin_invites.sql   # Støtte for admin-invitasjoner
    ├── add_board_images.sql    # Støtte for profilbilder på styreverv
    ├── add_courses.sql         # Courses-tabell og kursdata
    ├── add_medlemskap.sql      # Seed-data for medlemskap.html i site_sections
    ├── auto_admin_trigger.sql  # Trigger for automatisk admin-rolle
    └── password_reset.sql      # Skript/oppsett for passordtilbakestilling
```

---

## Kjøre prosjektet lokalt

Prosjektet bruker ES-moduler (`<script type="module">`) og må derfor kjøres over en lokal HTTP-server (ikke åpnes direkte via `file://`).

1. Start lokal server fra rotmappen:
   ```bash
   npm run dev
   ```
   *(Kjører `npx serve -l 3000 .`)*

2. Åpne i nettleseren:
   - **Nettside:** `http://localhost:3000`
   - **Admin-panel:** `http://localhost:3000/admin`

---

## Database og Supabase-oppsett

1. **Konfigurasjon:** Supabase-URL og `anon`-nøkkel settes i `js/supabase-client.js`. Dersom nøklene ikke er satt eller databasen ikke svarer, faller sidene automatisk tilbake til standardverdier definert i HTML/JavaScript.
2. **Tabeller (`supabase/schema.sql`):**
   - `public.profiles` – Brukerroller (`ADMIN` eller `NONE`) koblet til `auth.users`.
   - `public.admin_invites` – E-poster som automatisk får `ADMIN`-rolle ved registrering.
   - `public.site_sections` – Fleksible JSONB-blokker (`key`, `page`, `content`) for tekstseksjoner, sosiale medier og bildekarusell.
   - `public.board_roles` – Styreverv, navn, `@oams.no`-e-post, bilde-URL, rekkefølge og synlighet.
   - `public.documents` – Offentlige dokumentlenker med ikonvalg og synlighet.
   - `public.courses` – Kursoversikt for medisinstudent-siden (`title`, `description`, `target_group`, `sort_order`, `visible`).
3. **Bildeopplasting (`supabase/storage.sql`):**
   - Bruker en offentlig Supabase Storage-bucket kalt `media` (maks 5 MB, tillater JPEG, PNG, WebP og SVG), hvor kun innloggede administratorer (`public.is_admin()`) har skrive- og slettetilgang.
