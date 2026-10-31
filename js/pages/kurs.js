// ==============================================================================
// OAMS CMS - Frontend Content Loader for kurs.html (og kursoversikten på index.html)
// Henter dynamisk innhold fra Supabase (site_sections og courses) og oppdaterer DOM-en.
// ==============================================================================

import { getSupabase } from '../supabase-client.js';

const ACTION_ICONS = {
  calendar: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  `,
  'user-plus': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="20" y1="8" x2="20" y2="14"></line>
      <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
  `,
  mail: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  `,
  doc: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  `
};

const DEFAULT_HERO = {
  subheading: 'Praktisk akuttmedisin og simulering',
  title: 'Våre Kurs'
};

const DEFAULT_INTRO = {
  title: 'Lær akuttmedisin i praksis',
  lead: 'OAMS arrangerer praktiske kurs, ferdighetstrening og simuleringer for medisinstudenter og eksterne gjennom hele studieåret.',
  paragraphs: [
    'Kurstilbudet vårt spenner fra grunnleggende førstehjelp og skadestedsledelse på AMK 1 til avansert casetrening med anestesilege på AMK 2 og spesialiserte kurs innen ultralyd (eFAST), traumeteam-trening (Mini-StudentBEST), akutt pediatri og villmarksmedisin.',
    'Har du fullført AMK 1, kan du også ta vårt Instruktørkurs for å bli godkjent OAMS-instruktør. Som instruktør får du verdifull undervisningserfaring på interne kurs og mulighet til å holde betalte førstehjelpskurs for eksterne bedrifter, skoler og organisasjoner.'
  ]
};

const DEFAULT_PORTEFOLJE = {
  title: 'Kursportefølje',
  text: 'Her finner du en oversikt over alle våre faste kurs, workshops og faglige arrangementer.'
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

const DEFAULT_ACTIONS = {
  title: 'Påmelding, medlemskap og booking',
  subtitle: 'Slik melder du deg på kommende kurs, blir medlem i OAMS eller bestiller et eksternt førstehjelpskurs.',
  items: [
    {
      title: 'Kommende arrangementer',
      description: 'Datoer og påmeldingslenker for kommende kurs og temakvelder publiseres fortløpende på vår offisielle Facebook-side.',
      button_label: 'Følg oss på Facebook',
      url: 'https://www.facebook.com/OsloAMS',
      icon: 'calendar',
      visible: true
    },
    {
      title: 'Bli medlem i OAMS',
      description: 'Livstidsmedlemskap koster 200 kr (Vipps til OAMS, merk med navn og kull) og gir rabatterte kurspriser og tilgang til instruktørkurs.',
      button_label: 'Registrer medlemskap',
      url: 'mailto:post@oams.no?subject=Nytt%20medlemskap%20OAMS',
      icon: 'user-plus',
      visible: true
    },
    {
      title: 'Book et førstehjelpskurs',
      description: 'Vi holder skreddersydde, praktiske førstehjelps- og HLR-kurs for bedrifter, idrettslag, skoler og organisasjoner.',
      button_label: 'Send bookingforespørsel',
      url: 'mailto:post@oams.no?subject=Foresp%C3%B8rsel%20om%20booking',
      icon: 'mail',
      visible: true
    }
  ]
};

function sanitizeHref(rawHref) {
  if (!rawHref) return '#';
  const trimmed = String(rawHref).trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }
  return '#';
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

function renderParagraphsWithBreaks(container, bodyOrParagraphs) {
  if (!container) return;
  container.innerHTML = '';

  let blocks = [];
  if (typeof bodyOrParagraphs === 'string' && bodyOrParagraphs.trim()) {
    blocks = bodyOrParagraphs.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  } else if (Array.isArray(bodyOrParagraphs)) {
    blocks = bodyOrParagraphs.flatMap(item =>
      String(item || '').replace(/\r\n/g, '\n').split(/\n\s*\n/)
    );
  }

  blocks
    .map(b => b.trim())
    .filter(Boolean)
    .forEach(block => {
      const p = document.createElement('p');
      setMultilineText(p, block);
      container.appendChild(p);
    });
}

async function initKurs() {
  try {
    const supabase = await getSupabase();
    let sectionsMap = new Map();
    let coursesList = null;

    if (supabase) {
      const [sectionsRes, coursesRes] = await Promise.all([
        supabase.from('site_sections').select('key, content').eq('page', 'kurs'),
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

    // 1. Hero (på kurs.html)
    const hero = sectionsMap.get('kurs.hero') || DEFAULT_HERO;
    if (hero) {
      const sub = document.querySelector('[data-cms="hero-subheading"]');
      const title = document.querySelector('[data-cms="hero-title"]');
      if (sub && hero.subheading) sub.textContent = hero.subheading;
      if (title && hero.title) title.textContent = hero.title;
    }

    // 2. Introduksjon (på kurs.html)
    const intro = sectionsMap.get('kurs.intro') || DEFAULT_INTRO;
    if (intro) {
      const titleEl = document.querySelector('[data-cms="intro-title"]');
      const leadEl = document.querySelector('[data-cms="intro-lead"]');
      const paragraphsContainer = document.querySelector('[data-cms="intro-paragraphs"]');

      if (titleEl && intro.title) titleEl.textContent = intro.title;
      if (leadEl && intro.lead) leadEl.textContent = intro.lead;
      if (paragraphsContainer) {
        const source = typeof intro.body === 'string' && intro.body.trim()
          ? intro.body
          : intro.paragraphs;
        renderParagraphsWithBreaks(paragraphsContainer, source);
      }
    }

    // 3. Kursportefølje overskrift (på kurs.html)
    const portefolje = sectionsMap.get('kurs.portefolje_intro') || DEFAULT_PORTEFOLJE;
    if (portefolje) {
      const pTitle = document.querySelector('[data-cms="portefolje-title"]');
      const pText = document.querySelector('[data-cms="portefolje-text"]');
      if (pTitle && portefolje.title) pTitle.textContent = portefolje.title;
      if (pText && portefolje.text) pText.textContent = portefolje.text;
    }

    // 4. Detaljerte kurskort på kurs.html ([data-cms-list="courses"])
    const coursesContainer = document.querySelector('[data-cms-list="courses"]');
    if (coursesContainer) {
      coursesContainer.innerHTML = '';
      activeCourses.forEach(course => {
        const card = document.createElement('article');
        card.className = 'kurs-detail-card';
        if (course.slug) {
          card.id = String(course.slug).trim().replace(/[^a-zA-Z0-9_-]/g, '');
        }

        const hasTarget = Boolean(course.target_group && course.target_group.trim());

        card.innerHTML = `
          <div>
            <h3 class="role-title"></h3>
            <p class="kurs-detail-desc"></p>
          </div>
          ${hasTarget ? '<div class="kurs-detail-meta">Målgruppe: <span class="kurs-target-text"></span></div>' : ''}
        `;

        card.querySelector('.role-title').textContent = course.title || '';
        setMultilineText(card.querySelector('.kurs-detail-desc'), course.description || '');
        if (hasTarget) {
          card.querySelector('.kurs-target-text').textContent = course.target_group.trim();
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

    // 6. Handlingskort nederst på kurs.html ([data-cms-list="course-actions"])
    const actions = sectionsMap.get('kurs.actions') || DEFAULT_ACTIONS;
    if (actions) {
      const aTitle = document.querySelector('[data-cms="actions-title"]');
      const aSub = document.querySelector('[data-cms="actions-subtitle"]');
      if (aTitle && actions.title) aTitle.textContent = actions.title;
      if (aSub && actions.subtitle) aSub.textContent = actions.subtitle;

      const actionsContainer = document.querySelector('[data-cms-list="course-actions"]');
      if (actionsContainer && Array.isArray(actions.items)) {
        const visibleActions = actions.items.filter(item => item.visible !== false);
        actionsContainer.innerHTML = '';

        visibleActions.forEach(item => {
          const card = document.createElement('div');
          card.className = 'doc-card';

          const iconSvg = ACTION_ICONS[item.icon] || ACTION_ICONS.calendar;
          const safeUrl = sanitizeHref(item.url);
          const isExternal = safeUrl.startsWith('http');

          card.innerHTML = `
            <div>
              <div class="doc-icon-wrap" aria-hidden="true">${iconSvg}</div>
              <h3 class="doc-card-title"></h3>
              <p class="doc-card-desc"></p>
            </div>
            <a href="${safeUrl}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} class="btn btn-outline-red">
              <span class="action-btn-text"></span>
            </a>
          `;

          card.querySelector('.doc-card-title').textContent = item.title || '';
          card.querySelector('.doc-card-desc').textContent = item.description || '';
          card.querySelector('.action-btn-text').textContent = item.button_label || 'Les mer';

          actionsContainer.appendChild(card);
        });
      }
    }

  } catch (err) {
    console.warn('OAMS CMS: Feil under lasting av kurs-side.', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKurs);
} else {
  initKurs();
}

