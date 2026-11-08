// ==============================================================================
// OAMS CMS - Frontend Content Loader for medisinstudent.html (og kursoversikten på index.html)
// Henter dynamisk innhold fra Supabase (site_sections og courses) og oppdaterer DOM-en.
// ==============================================================================

import { getSupabase } from '../supabase-client.js';

const DEFAULT_HERO = {
  subheading: 'Praktisk akuttmedisin, kurs og fellesskap',
  title: 'For medisinstudenter'
};

const DEFAULT_MEDLEMSKAP = {
  title: 'Bli medlem!',
  lead: 'Som medlem i OAMS får du tilgang til våre populære akuttmedisinske kurs til medlemspris, mulighet til å utdanne deg som instruktør (med betalte eksterne kursoppdrag) og bli en del av et engasjert faglig miljø på medisinstudiet.',
  button_label: 'Betal medlemskap på Vipps',
  button_url: '#'
};

const DEFAULT_PORTEFOLJE = {
  title: 'Hvilke kurs vi tilbyr',
  text: 'En kort oversikt over våre praktiske kurs, simuleringer og arrangementer gjennom studieåret.'
};

const DEFAULT_COURSES = [
  {
    slug: 'amk-1',
    title: 'AMK 1 – Akuttmedisinkurs 1',
    description: 'Grunnsteinen i foreningens kurstilbud. Fokus på skadestedsledelse, systematisk primærundersøkelse etter ABCDE-prinsippet, basal hjerte-lunge-redning (HLR) og håndtering av vanlige akuttmedisinske tilstander.',
    target_group: 'Alle medisinstudenter (ingen forkunnskapskrav)',
    visible: true
  },
  {
    slug: 'amk-2',
    title: 'AMK 2 – Akuttmedisinkurs 2',
    description: 'Vårt mest avanserte og intensive kurs over to dager. Bygger videre på AMK 1 med krevende praktiske simulatorcaser, avansert HLR (AHLR), rytmegjenkjenning, defibrillering og bruk av medikamenter under veiledning av anestesilege.',
    target_group: 'Studenter i kliniske terminer (fra modul 3, krever AMK 1)',
    visible: true
  },
  {
    slug: 'instruktorkurs',
    title: 'Instruktørkurs',
    description: 'Opplæring av nye instruktører til OAMS. Du lærer pedagogiske prinsipper, veiledning, scenariostyring og praktisk undervisningsteknikk. Etter endt kurs og praksis blir du godkjent OAMS-instruktør og kan holde interne og betalte eksterne kurs.',
    target_group: 'Medlemmer som har fullført AMK 1',
    visible: true
  }
];

const DEFAULT_SOME = {
  title: 'Interessert? Følg oss!',
  text: 'Datoer, påmeldingslenker og fortløpende oppdateringer om alle kommende kurs og arrangementer legges ut på våre sosiale medier.\nFølg oss for å sikre deg plass!',
  facebook_label: 'Facebook',
  facebook_url: 'https://www.facebook.com/OsloAMS',
  instagram_label: 'Instagram',
  instagram_url: '#'
};

const DEFAULT_MERCH = {
  title: 'OAMS-Merch!',
  text: 'Vil du sikre deg OAMS-klær og effekter? Send inn en forespørsel via vårt merch-skjema, så sjekker materialansvarlig lagerstatus og tar kontakt med deg om tilgjengelighet og hvor det kan hentes.',
  button_label: 'Bestill merch (Gå til skjema)',
  button_url: '#',
  list_title: 'Dette fyller du ut i merch-skjemaet:',
  items: [
    'Hvilket plagg du ønsker',
    'Hvilken størrelse og farge',
    'Ønsket antall',
    'Kontaktinfo (for svar om ja/nei og avtale om henting)'
  ]
};

const CHECK_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
`;

function sanitizeHref(rawHref) {
  if (!rawHref) return '#';
  const trimmed = String(rawHref).trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    /^[a-zA-Z0-9_./-]+(\?.*)?(#.*)?$/.test(trimmed)
  ) {
    return trimmed;
  }
  return '#';
}

function applyLinkHref(selector, rawUrl) {
  const linkEl = document.querySelector(selector);
  if (!linkEl) return;
  const safeUrl = sanitizeHref(rawUrl);
  linkEl.setAttribute('href', safeUrl);
  if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) {
    linkEl.setAttribute('target', '_blank');
    linkEl.setAttribute('rel', 'noopener noreferrer');
  } else {
    linkEl.removeAttribute('target');
    linkEl.removeAttribute('rel');
  }
}

function setMultilineText(el, text) {
  if (!el) return;
  el.innerHTML = '';
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  lines.forEach((line, idx) => {
    if (idx > 0) el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(line));
  });
}

async function initKurs() {
  try {
    const supabase = await getSupabase();
    let sectionsMap = new Map();
    let coursesList = null;

    if (supabase) {
      const [sectionsRes, coursesRes] = await Promise.all([
        supabase.from('site_sections').select('key, content').in('page', ['student', 'kurs']),
        supabase.from('courses').select('*').eq('visible', true).order('sort_order', { ascending: true })
      ]);

      if (!sectionsRes.error && sectionsRes.data) {
        sectionsMap = new Map(sectionsRes.data.map(s => [s.key, s.content]));
      }
      if (!coursesRes.error && Array.isArray(coursesRes.data) && coursesRes.data.length > 0) {
        coursesList = coursesRes.data;
      }
    }

    const activeCourses = coursesList || DEFAULT_COURSES;

    // 1. Hero (på medisinstudent.html)
    const hero = sectionsMap.get('student.hero') || sectionsMap.get('kurs.hero') || DEFAULT_HERO;
    if (hero) {
      const sub = document.querySelector('[data-cms="hero-subheading"]');
      const title = document.querySelector('[data-cms="hero-title"]');
      if (sub && hero.subheading) sub.textContent = hero.subheading;
      if (title && hero.title) title.textContent = hero.title;
    }

    // 2. Medlemskap & Vipps (på medisinstudent.html)
    const medlemskap = sectionsMap.get('student.medlemskap') || sectionsMap.get('kurs.medlemskap') || DEFAULT_MEDLEMSKAP;
    if (medlemskap) {
      const mTitle = document.querySelector('[data-cms="medlem-title"]');
      const mLead = document.querySelector('[data-cms="medlem-lead"]');
      const mBtnLabel = document.querySelector('[data-cms="medlem-btn-label"]');

      if (mTitle && medlemskap.title) mTitle.textContent = medlemskap.title;
      if (mLead && medlemskap.lead) setMultilineText(mLead, medlemskap.lead);
      if (mBtnLabel && medlemskap.button_label) mBtnLabel.textContent = medlemskap.button_label;
      applyLinkHref('[data-cms-href="medlem-btn-url"]', medlemskap.button_url || DEFAULT_MEDLEMSKAP.button_url);
    }

    // 3. Kursoversikt overskrift (på medisinstudent.html)
    const portefolje = sectionsMap.get('student.portefolje_intro') || sectionsMap.get('kurs.portefolje_intro') || DEFAULT_PORTEFOLJE;
    if (portefolje) {
      const pTitle = document.querySelector('[data-cms="portefolje-title"]');
      const pText = document.querySelector('[data-cms="portefolje-text"]');
      if (pTitle && portefolje.title) pTitle.textContent = portefolje.title;
      if (pText && portefolje.text) setMultilineText(pText, portefolje.text);
    }

    // 4. Kurskort på medisinstudent.html ([data-cms-list="courses"])
    const coursesContainer = document.querySelector('[data-cms-list="courses"]');
    if (coursesContainer) {
      coursesContainer.innerHTML = '';
      activeCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'short-course-card';
        if (course.slug) {
          card.id = String(course.slug).trim().replace(/[^a-zA-Z0-9_-]/g, '');
        }

        const hasTarget = Boolean(course.target_group && course.target_group.trim());

        card.innerHTML = `
          <div>
            <h3 class="short-course-title"></h3>
            <p class="short-course-desc"></p>
          </div>
          ${hasTarget ? '<div class="short-course-target">Målgruppe: <span class="short-course-target-text"></span></div>' : ''}
        `;

        card.querySelector('.short-course-title').textContent = course.title || '';
        setMultilineText(card.querySelector('.short-course-desc'), course.description || '');
        if (hasTarget) {
          card.querySelector('.short-course-target-text').textContent = course.target_group.trim();
        }

        coursesContainer.appendChild(card);
      });
    }

    // 5. Kompakte kurskort på forsiden index.html ([data-cms-list="index-courses"])
    const indexCoursesContainer = document.querySelector('[data-cms-list="index-courses"]');
    if (indexCoursesContainer) {
      indexCoursesContainer.innerHTML = '';
      activeCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-clean-card';

        card.innerHTML = `
          <h3 class="course-clean-title"></h3>
          <p class="course-clean-desc"></p>
        `;

        card.querySelector('.course-clean-title').textContent = course.title || '';
        setMultilineText(card.querySelector('.course-clean-desc'), course.description || '');

        indexCoursesContainer.appendChild(card);
      });
    }

    // 6. SoMe-boks (på medisinstudent.html)
    const some = sectionsMap.get('student.some') || sectionsMap.get('kurs.some') || DEFAULT_SOME;
    if (some) {
      const sTitle = document.querySelector('[data-cms="some-title"]');
      const sText = document.querySelector('[data-cms="some-text"]');
      const fbLabel = document.querySelector('[data-cms="some-facebook-label"]');
      const igLabel = document.querySelector('[data-cms="some-instagram-label"]');

      if (sTitle && some.title) sTitle.textContent = some.title;
      if (sText && some.text) setMultilineText(sText, some.text);
      if (fbLabel && some.facebook_label) fbLabel.textContent = some.facebook_label;
      if (igLabel && some.instagram_label) igLabel.textContent = some.instagram_label;

      applyLinkHref('[data-cms-href="some-facebook-url"]', some.facebook_url || DEFAULT_SOME.facebook_url);
      applyLinkHref('[data-cms-href="some-instagram-url"]', some.instagram_url || DEFAULT_SOME.instagram_url);
    }

    // 7. Merch-seksjon (på medisinstudent.html)
    const merch = sectionsMap.get('student.merch') || sectionsMap.get('kurs.merch') || DEFAULT_MERCH;
    if (merch) {
      const mTitle = document.querySelector('[data-cms="merch-title"]');
      const mText = document.querySelector('[data-cms="merch-text"]');
      const mBtnLabel = document.querySelector('[data-cms="merch-btn-label"]');
      const mListTitle = document.querySelector('[data-cms="merch-list-title"]');
      const mItemsContainer = document.querySelector('[data-cms-list="merch-items"]');

      if (mTitle && merch.title) mTitle.textContent = merch.title;
      if (mText && merch.text) setMultilineText(mText, merch.text);
      if (mBtnLabel && merch.button_label) mBtnLabel.textContent = merch.button_label;
      if (mListTitle && merch.list_title) mListTitle.textContent = merch.list_title;

      applyLinkHref('[data-cms-href="merch-btn-url"]', merch.button_url || DEFAULT_MERCH.button_url);

      if (mItemsContainer) {
        const items = Array.isArray(merch.items) && merch.items.length > 0
          ? merch.items
          : DEFAULT_MERCH.items;
        mItemsContainer.innerHTML = '';
        items.forEach(itemText => {
          const trimmed = String(itemText || '').trim();
          if (!trimmed) return;
          const li = document.createElement('li');
          li.innerHTML = `${CHECK_ICON_SVG}<span class="merch-item-text"></span>`;
          li.querySelector('.merch-item-text').textContent = trimmed;
          mItemsContainer.appendChild(li);
        });
      }
    }

  } catch (err) {
    console.warn('OAMS CMS: Feil under lasting av medisinstudent-side.', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKurs);
} else {
  initKurs();
}
