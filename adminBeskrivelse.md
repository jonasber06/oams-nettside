# Dokumentasjon av OAMS Admin-panel (CMS)

Dette dokumentet gir en samlet og detaljert oversikt over administrasjonspanelet (CMS) for OAMS-nettsiden, dets arkitektur, funksjonalitet, sikkerhetsmekanismer og alle endringer som er gjennomført.

---

## Innholdsfortegnelse
1. [Overordnet Arkitektur og Teknologistakk](#1-overordnet-arkitektur-og-teknologistakk)
2. [Fil- og Mappestruktur](#2-fil--og-mappestruktur)
3. [Autentisering og Sikkerhet](#3-autentisering-og-sikkerhet)
4. [Redigering av «Om oss» (om-oss.html)](#4-redigering-av-om-oss-om-osshtml)
   - [Hero og introduksjonstekster](#hero-og-introduksjonstekster)
   - [Styreverv: Bilder, rekkefølge og mobilhåndtering](#styreverv-bilder-rekkefølge-og-mobilhåndtering)
   - [Dokumenter og innsynslenker](#dokumenter-og-innsynslenker)
5. [Dynamisk Visning på Nettsiden (Frontend)](#5-dynamisk-visning-på-nettsiden-frontend)
6. [Database og Supabase-struktur](#6-database-og-supabase-struktur)
7. [Feilrettinger og Tekniske Forbedringer](#7-feilrettinger-og-tekniske-forbedringer)
8. [Veiledning for Administratorer](#8-veiledning-for-administratorer)

---

## 1. Overordnet Arkitektur og Teknologistakk

Admin-panelet er bygget som en lettvekts, moderne og sikker løsning tilpasset OAMS' behov:

* **Frontend:** Ren HTML5, Vanilla CSS og Vanilla JavaScript (ES-moduler). Det benyttes ingen tunge byggesteg, Webpack eller eksterne rammeverk som React/Vue. Dette sikrer lynrask innlasting og enkelt vedlikehold direkte i et statisk webhotell eller Apache/Nginx-server.
* **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL med PostgREST API). All datakommunikasjon skjer direkte mellom nettleseren og Supabase via `@supabase/supabase-js`.
* **Fil- og bildelagring:** Supabase Storage (`media`-bøtten), konfigurert for profilbilder for styremedlemmer under mappen `styret/`.
* **Tilgangskontroll:** PostgreSQL Row Level Security (RLS) på databasenivå. Offentligheten har kun lesetilgang til synlig innhold, mens endring, opprettelse og sletting krever gyldig innlogging og `ADMIN`-rolle.

---

## 2. Fil- og Mappestruktur

```
oams-nettside/
├── admin/
│   ├── admin.css               # Komplett stilark for admin-grensesnittet
│   ├── index.html              # Hoveddashboard med snarveier og status
│   ├── login.html              # Innloggingsside for administratorer
│   ├── om-oss.html             # CMS-editor for "Om oss"-siden
│   └── js/
│       ├── auth-guard.js       # Beskytter admin-sidene mot uautoriserte brukere
│       ├── login.js            # Innloggingslogikk og sesjonshåndtering
│       ├── ui.js               # Felles UI-komponenter (toast-varsler, knappe-status)
│       └── editors/
│           └── om-oss.js       # Full forretningslogikk for redigering av "Om oss"
├── js/
│   ├── supabase-client.js      # Felles Supabase-klient for både admin og offentlig side
│   └── pages/
│       └── om-oss.js           # Henter og renderer data dynamisk på om_oss.html
├── supabase/
│   ├── schema.sql              # Tabeller, relasjoner og RLS-sikkerhetspolicyer
│   ├── seed.sql                # Startdata (15 styreverv, 4 dokumenter, seksjonstekster)
│   ├── storage.sql             # Konfigurasjon av "media"-lagringsbøtte
│   └── add_board_images.sql    # Migrering for image_url-kolonne i styreverv
├── .htaccess                   # Sikkerhetsheadere og sperre for søkemotorindeksering
└── adminBeskrivelse.md         # Denne dokumentasjonsfilen
```

---

## 3. Autentisering og Sikkerhet

### 3.1 Innlogging (`admin/login.html` & `admin/js/login.js`)
* Brukeren logger inn med e-post og passord via Supabase Auth (`signInWithPassword`).
* Skjemaet har feilmeldinger på norsk, validering og automatisk omdirigering til `index.html` ved vellykket innlogging.
* Sesjonen lagres sikkert i nettleserens `localStorage` via Supabase Client.

### 3.2 Tilgangssperre (`admin/js/auth-guard.js`)
* Alle administrative sider (`index.html`, `om-oss.html`) inkluderer `auth-guard.js`.
* Skjuler `<body>` (`auth-pending`) inntil sesjonen er verifisert for å unngå at uautoriserte brukere ser administrative data (Flash of Unauthenticated Content).
* Verifiserer ikke bare at brukeren er logget inn, men sjekker opp mot tabellen `public.profiles` at brukeren har rollen `ADMIN`.
* Dersom brukeren ikke har tilgang, videresendes de umiddelbart til `login.html`.
* Inkluderer felles utloggingsfunksjon (`setupLogout()`) koblet til «Logg ut»-knappen.

### 3.3 Sikkerhet på tjenernivå (`.htaccess`)
* `X-Robots-Tag: noindex, nofollow, noarchive` forhindrer at Google eller andre søkemotorer indekserer administrasjonssidene.
* Sikkerhetsheadere aktivert: `X-Frame-Options: SAMEORIGIN` (beskyttelse mot clickjacking) og `X-Content-Type-Options: nosniff`.
* `<base href="/admin/">` er lagt inn i admin-sidene slik at relative stier alltid fungerer, uavhengig av om URL-en åpnes med eller uten filendelsen `.html`.

---

## 4. Redigering av «Om oss» (om-oss.html)

Editoren i `admin/om-oss.html` og tilhørende skript [admin/js/editors/om-oss.js](file:///Users/jonasbergersen/Desktop/oams-nettside-repo/oams-nettside/admin/js/editors/om-oss.js) er delt inn i fire seksjoner:

### 4.1 Hero og introduksjonstekster
1. **Topp-banner (Hero):** Redigering av undertittel og hovedtittel («Hva er OAMS?»).
2. **Hvem er vi?:** Redigering av seksjonstittel, fremhevet ingress (lead) og brødtekstavsnitt.
* Lagres som strukturerte JSON-data i tabellen `public.site_sections` under nøklene `hero` og `about`.

---

### 4.2 Styreverv: Bilder, rekkefølge og mobilhåndtering

Styreverv-editoren administrerer de 15 styrevervene (og muliggjør opprettelse av nye eller sletting av gamle).

#### A. Profilbilder (Avatars)
* Hver verv-rad har en sirkulær avatar-opplaster.
* Klikk på sirkelen åpner filvelger for JPEG, PNG eller WebP (maks 5 MB).
* Bildet lastes opp direkte til Supabase Storage (`media/styret/`), navngis unikt med tidsstempel, og den offentlige URL-en lagres i feltet `image_url` på vervet.
* Har et verv allerede et bilde, vises en rød kryss-knapp (`×`) som lar administratoren fjerne bildet med ett klikk.
* På den offentlige nettsiden (`om_oss.html`) vises bildene i en stor og innbydende 130 × 130 px sirkel. Verv som ikke har bilde får en stilren, nøytral placeholder slik at alle kort beholder identisk høyde og layout.

#### B. Rekkefølge med piler (Opp / Ned)
* Hvert verv har opp- og ned-piler:
  * **▲ Flytt opp:** Bytter plass med vervet over. Deaktivert for øverste verv.
  * **▼ Flytt ned:** Bytter plass med vervet under. Deaktivert for nederste verv.
* Pilene er designet med store, tydelige ikoner (`stroke-width: 2.8`) og taktile knapper.
* Plasseringen i listen (`1`, `2`, `3` ...) oppdateres automatisk og visuelt.

#### C. Dra-og-slipp (Drag and Drop) for PC/Mac
* På desktop kan man ta tak i en rad og dra den opp eller ned for rask omrokkering.
* En blå linje (`drag-over-top` / `drag-over-bottom`) indikerer hvor elementet vil slippes.

#### D. Sperre for «drag and drop» på mobil
* **Hvorfor:** HTML5 `draggable="true"` på berøringsskjermer (iOS Safari, Android Chrome) forårsaker ofte at vertikal rulling henger seg opp, eller at elementer flyttes utilsiktet mens man prøver å scrolle nedover siden med tommelen.
* **Løsning:** Funksjonen `isMobileOrTouch()` detekterer automatisk touch-enheter og mindre skjermer.
* På mobil settes `draggable="false"`, alle drag-eventlyttere utelates, og CSS setter `touch-action: pan-y;` og `-webkit-user-drag: none;`. Dette gir 100 % uforstyrret, naturlig rulling.
* **Responsivt mobilkort:** På mobil omorganiseres raden automatisk til et oversiktlig kort. Rekkefølgepilene plasseres side om side (`[ ▲ ]  3  [ ▼ ]`) med rause touch-flater på **40 × 36 px** og **22 px piler**, slik at de er svært enkle og behagelige å trykke på med tommelen.

#### E. Felter og sletting
* Hvert verv har felter for:
  * **Tittel:** F.eks. «Leder», «Nestleder», «Fagansvarlig».
  * **Navn:** Navn på studenten som innehar vervet (kan stå tomt ved ubesatt verv).
  * **E-post:** Offisiell `@oams.no`-adresse.
  * **Synlig:** Avkrysningsboks for om vervet skal vises på den offentlige siden.
  * **Slett verv (rød knapp):** Fjerner vervet etter bekreftelsesdialog.

---

### 4.3 Dokumenter og innsynslenker
Administrerer dokumentkortene nederst på «Om oss»-siden (vedtekter, vervbeskrivelser, referater og regnskap):
* Tittel og beskrivelse.
* URL / lenke (typisk Google Drive-mapper eller Google Docs).
* Knappetekst (f.eks. «Les vedtekter», «Åpne mappe»). Den skrå eksternlenke-pilen legges automatisk til på egen linje under knappen på nettsiden.
* Synlighetsbryter og slettemulighet.
* Mulighet for å legge til nye dokumenter med «+ Legg til dokument».

---

### 4.4 Redigering av «Kontakt oss» (kontakt-oss.html)

Editoren i [admin/kontakt-oss.html](file:///Users/jonasbergersen/Desktop/oams-nettside-repo/oams-nettside/admin/kontakt-oss.html) og tilhørende skript [admin/js/editors/kontakt-oss.js](file:///Users/jonasbergersen/Desktop/oams-nettside-repo/oams-nettside/admin/js/editors/kontakt-oss.js) styrer innholdet på [kontakt_oss.html](file:///Users/jonasbergersen/Desktop/oams-nettside-repo/oams-nettside/kontakt_oss.html) via tabellen `public.site_sections` (`page = 'kontakt_oss'`):

1. **Topp-banner (Hero):** Redigering av undertittel og hovedtittel (`kontakt_oss.hero`).
2. **Kontaktinfo (`kontakt_oss.kontaktinfo`):**
   - Seksjonstittel («Kontaktinfo») og valgfri introtekst.
   - Dynamisk liste over kontaktpunkter (standard: **Adresse** ved Domus Medica og **Email oss** `post@oams.no`).
   - Hvert kontaktpunkt har valgbart ikon (kartnål, e-post, telefon, sprøyte, kalender, info), tittel, visningstekst (med linjeskift-støtte), valgfri klikkbar lenke (`mailto:`, `https://` osv.), rekkefølgepiler (**▲** / **▼**), synlighetsbryter og slett/legg til-mulighet.
3. **Sosiale medier (`kontakt_oss.socials`):**
   - Dynamisk liste over sosiale medier-knapper (standard: **Facebook**, **Instagram** og **LinkedIn**).
   - Kan endre plattformikon, knappetekst, URL, rekkefølge (**▲** / **▼**), synlighet eller legge til/fjerne kanaler.

---

## 5. Dynamisk Visning på Nettsiden (Frontend)

Skriptet [js/pages/om-oss.js](file:///Users/jonasbergersen/Desktop/oams-nettside-repo/oams-nettside/js/pages/om-oss.js) er integrert i [om_oss.html](file:///Users/jonasbergersen/Desktop/oams-nettside-repo/oams-nettside/om_oss.html):

1. **Parallell innlasting:** Tekster, styreverv og dokumenter hentes samtidig med `Promise.all` for raskest mulig gjengivelse.
2. **Reaktiv oppdatering:**
   - Tekster oppdateres via `[data-cms="..."]`.
   - Styreverv genereres dynamisk i `[data-cms-list="board-roles"]` sortert etter `sort_order ASC`.
   - Dokumenter genereres dynamisk i `[data-cms-list="documents"]`.
3. **Fjerning av hardkodede dubletter:** De 240 linjene med hardkodede fallback-kort i `om_oss.html` er ryddet bort. Listen rendres nå dynamisk fra databasen, med en subtil laste-indikator frem til dataene er klare.
4. **XSS-beskyttelse:** Alle brukerdefinerte tekster settes via `textContent`, noe som eliminerer risikoen for script-injeksjon.
5. **Modul-timing:** Skriptet sjekker `document.readyState` for å håndtere både direkte lasting og asynkron ES-modulutførelse uten å miste `DOMContentLoaded`.

---

## 6. Database og Supabase-struktur

### Tabelloversikt:
* **`public.profiles`**: Brukerprofiler med felt `role` (`ADMIN` eller `NONE`).
* **`public.site_sections`**: Seksjonstekster lagret som JSON per side/seksjon (`hero`, `about`).
* **`public.board_roles`**:
  * `id UUID PRIMARY KEY`
  * `title TEXT NOT NULL`
  * `member_name TEXT`
  * `email TEXT NOT NULL`
  * `image_url TEXT`
  * `sort_order INTEGER DEFAULT 0`
  * `visible BOOLEAN DEFAULT true`
* **`public.documents`**:
  * `id UUID PRIMARY KEY`
  * `title TEXT NOT NULL`
  * `description TEXT`
  * `button_label TEXT NOT NULL`
  * `url TEXT NOT NULL`
  * `icon TEXT DEFAULT 'file'`
  * `sort_order INTEGER DEFAULT 0`
  * `visible BOOLEAN DEFAULT true`
* **Supabase Storage:** Bøtten `media` med offentlig lesetilgang og administrator-beskyttet opplasting til mappen `styret/`.

---

## 7. Feilrettinger og Tekniske Forbedringer

Under utviklingen ble følgende utfordringer analysert og utbedret:

1. **UUID og Not-Null Constraint ved nye verv:**
   - *Problem:* Nye verv eller elementer opprettet i adminpanelet manglet en forhåndsdefinert ID før lagring, noe som førte til feilmeldingen `null value in column "id" of relation "board_roles" violates not-null constraint`.
   - *Løsning:* Alle nyopprettede elementer tildeles umiddelbart en gyldig UUID via nettleserens innebygde `crypto.randomUUID()`. Lagringen utfører deretter en atomisk batch-upsert på primærnøkkelen `id`.

2. **Sletting og synkronisering mot databasen:**
   - Slettede rader samles i egne lister (`deletedRoleIds` og `deletedDocIds`) og slettes eksplisitt i databasen før nye og endrede rader oppdateres.

3. **Størrelse og layout på profilbilder:**
   - Profilbildene på styrekortene ble forstørret fra en liten sirkel til en dominerende og profesjonell portrettsirkel på 130 × 130 px med myke skygger og sentrering.
   - Knappen i adminpanelet ble nedskalert til 36 × 36 px for å holde admin-tabellen kompakt og oversiktlig.

4. **Mobilvennlig rekkefølgebytte:**
   - Deaktivert HTML5 DnD på touch-enheter for å fjerne hakkete scrolling.
   - Piler forstørret på både desktop og mobil med tydelig visuell tilbakemelding ved klikk/trykk.

---

## 8. Veiledning for Administratorer

### Slik gjør du endringer på «Om oss»:
1. Gå til `/admin/` (eller `admin/login.html`) og logg inn med din OAMS-adminbruker.
2. Velg **«Om oss»** fra menyen eller dashbordet.
3. Gjør ønskede endringer:
   - **Endre styremedlem:** Skriv inn navnet på personen.
   - **Legge til bilde:** Trykk på bildesirkelen til venstre for vervet og velg et portrettbilde fra enheten din.
   - **Bytte rekkefølge:** Trykk på **▲** eller **▼** (eller dra og slipp på datamaskin).
   - **Endre tekster:** Rediger fritt i feltene under Hero og «Hvem er vi?».
4. Trykk på den grønne knappen **«Lagre alle endringer»** (øverst eller nederst).
5. En bekreftelse («Endringene er lagret!») vises nede i høyre hjørne, og nettsiden er oppdatert på sekundet.
