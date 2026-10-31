// ==============================================================================
// OAMS CMS - Editor for kurs.html (og kursene på forsiden)
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving } from '../ui.js';

let supabaseClient = null;
let currentCourses = [];
let currentActions = [];
let deletedCourseIds = [];

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

const DEFAULT_ACTIONS = {
  title: 'Påmelding, medlemskap og booking',
  subtitle: 'Slik melder du deg på kommende kurs, blir medlem i OAMS eller bestiller et eksternt førstehjelpskurs.',
  items: [
    {
      id: 'kommende',
      title: 'Kommende arrangementer',
      description: 'Datoer og påmeldingslenker for kommende kurs og temakvelder publiseres fortløpende på vår offisielle Facebook-side.',
      button_label: 'Følg oss på Facebook ↗',
      url: 'https://www.facebook.com/OsloAMS',
      icon: 'calendar',
      visible: true
    },
    {
      id: 'medlemskap',
      title: 'Bli medlem i OAMS',
      description: 'Livstidsmedlemskap koster 200 kr (Vipps til OAMS, merk med navn og kull) og gir rabatterte kurspriser og tilgang til instruktørkurs.',
      button_label: 'Registrer medlemskap',
      url: 'mailto:post@oams.no?subject=Nytt%20medlemskap%20OAMS',
      icon: 'user-plus',
      visible: true
    },
    {
      id: 'booking',
      title: 'Book et førstehjelpskurs',
      description: 'Vi holder skreddersydde, praktiske førstehjelps- og HLR-kurs for bedrifter, idrettslag, skoler og organisasjoner.',
      button_label: 'Send forespørsel',
      url: 'mailto:post@oams.no?subject=Foresp%C3%B8rsel%20om%20booking',
      icon: 'mail',
      visible: true
    }
  ]
};

const DEFAULT_COURSES = [
  {
    slug: 'amk-1',
    title: 'AMK 1 – Akuttmedisinkurs 1',
    description: 'Grunnsteinen i foreningens kurstilbud. Fokus på skadestedsledelse, systematisk primærundersøkelse etter ABCDE-prinsippet, basal hjerte-lunge-redning (HLR) og håndtering av vanlige akuttmedisinske tilstander.',
    target_group: 'Alle medisinstudenter (ingen forkunnskapskrav)',
    sort_order: 1,
    visible: true
  },
  {
    slug: 'amk-2',
    title: 'AMK 2 – Akuttmedisinkurs 2',
    description: 'Vårt mest avanserte og intensive kurs over to dager. Bygger videre på AMK 1 med krevende praktiske simulatorcaser, avansert HLR (AHLR), rytmegjenkjenning, defibrillering og bruk av medikamenter under veiledning av anestesilege.',
    target_group: 'Studenter i kliniske terminer (fra modul 3, krever AMK 1)',
    sort_order: 2,
    visible: true
  },
  {
    slug: 'instruktorkurs',
    title: 'Instruktørkurs',
    description: 'Opplæring av nye instruktører til OAMS. Du lærer pedagogiske prinsipper, veiledning, scenariostyring og praktisk undervisningsteknikk. Etter endt kurs og praksis blir du godkjent OAMS-instruktør og kan holde interne og betalte eksterne kurs.',
    target_group: 'Medlemmer som har fullført AMK 1',
    sort_order: 3,
    visible: true
  }
];

async function initEditor() {
  const auth = await requireAdmin();
  if (!auth) return;

  supabaseClient = auth.supabase;

  await loadContent();

  document.getElementById('addCourseBtn').addEventListener('click', addCourseRow);
  document.getElementById('addActionBtn').addEventListener('click', addActionRow);

  const form = document.getElementById('kursForm');
  form.addEventListener('submit', (e) => saveAll(e, document.getElementById('saveBottomBtn')));
  document.getElementById('saveTopBtn').addEventListener('click', (e) => saveAll(e, document.getElementById('saveTopBtn')));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}

async function loadContent() {
  try {
    const [sectionsRes, coursesRes] = await Promise.all([
      supabaseClient.from('site_sections').select('key, content').eq('page', 'kurs'),
      supabaseClient.from('courses').select('*').order('sort_order', { ascending: true })
    ]);

    const map = new Map((sectionsRes.data || []).map(s => [s.key, s.content]));

    // 1. Hero
    const hero = map.get('kurs.hero') || DEFAULT_HERO;
    document.getElementById('heroSubheading').value = hero.subheading ?? DEFAULT_HERO.subheading;
    document.getElementById('heroTitle').value = hero.title ?? DEFAULT_HERO.title;

    // 2. Intro
    const intro = map.get('kurs.intro') || DEFAULT_INTRO;
    document.getElementById('introTitle').value = intro.title ?? DEFAULT_INTRO.title;
    document.getElementById('introLead').value = intro.lead ?? DEFAULT_INTRO.lead;
    const p = Array.isArray(intro.paragraphs) && intro.paragraphs.length > 0
      ? intro.paragraphs
      : DEFAULT_INTRO.paragraphs;
    document.getElementById('introBody').value = typeof intro.body === 'string'
      ? intro.body
      : p.join('\n\n');

    // 3. Kursportefølje-overskrift + Kursliste
    const portefolje = map.get('kurs.portefolje_intro') || DEFAULT_PORTEFOLJE;
    document.getElementById('portefoljeTitle').value = portefolje.title ?? DEFAULT_PORTEFOLJE.title;
    document.getElementById('portefoljeText').value = portefolje.text ?? DEFAULT_PORTEFOLJE.text;

    if (coursesRes.error) {
      console.warn('Tabellen courses er ikke opprettet i Supabase ennå – viser standardkurs:', coursesRes.error.message);
    }

    const rawCourses = (!coursesRes.error && Array.isArray(coursesRes.data) && coursesRes.data.length > 0)
      ? coursesRes.data
      : DEFAULT_COURSES;

    currentCourses = rawCourses.map((c, idx) => ({
      ...c,
      id: c.id || crypto.randomUUID(),
      sort_order: c.sort_order ?? idx + 1,
      visible: c.visible !== false
    }));
    renderCoursesList();

    // 4. Handlingskort (Påmelding, medlemskap og booking)
    const actions = map.get('kurs.actions') || DEFAULT_ACTIONS;
    document.getElementById('actionsTitle').value = actions.title ?? DEFAULT_ACTIONS.title;
    document.getElementById('actionsSubtitle').value = actions.subtitle ?? DEFAULT_ACTIONS.subtitle;

    const rawActions = Array.isArray(actions.items) && actions.items.length > 0
      ? actions.items
      : DEFAULT_ACTIONS.items;

    currentActions = rawActions.map(a => ({
      ...a,
      id: a.id || crypto.randomUUID(),
      visible: a.visible !== false
    }));
    renderActionsList();

  } catch (err) {
    console.error('Feil ved lasting av innhold:', err);
    showToast('Kunne ikke hente alt innhold fra databasen.', 'error');
  }
}

// ==============================================================================
// KURSPORTEFØLJE (Tabellen public.courses)
// ==============================================================================

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function syncCoursesFromDom() {
  const cards = document.querySelectorAll('#coursesList > .course-editor-card');
  cards.forEach((card, idx) => {
    if (currentCourses[idx]) {
      const title = card.querySelector('.course-title-input')?.value.trim() || '';
      const rawSlug = card.querySelector('.course-slug-input')?.value.trim() || '';
      currentCourses[idx].title = title;
      currentCourses[idx].slug = rawSlug || slugify(title) || `kurs-${idx + 1}`;
      currentCourses[idx].target_group = card.querySelector('.course-target-input')?.value.trim() || '';
      currentCourses[idx].description = card.querySelector('.course-desc-input')?.value.trim() || '';
      currentCourses[idx].visible = card.querySelector('.course-visible-input')?.checked ?? true;
    }
  });
}

function moveCourse(fromIndex, delta) {
  syncCoursesFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentCourses.length) return;

  const [moved] = currentCourses.splice(fromIndex, 1);
  currentCourses.splice(toIndex, 0, moved);

  currentCourses.forEach((c, idx) => {
    c.sort_order = idx + 1;
  });

  renderCoursesList();
}

function renderCoursesList() {
  const container = document.getElementById('coursesList');
  container.innerHTML = '';

  if (currentCourses.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen kurs lagt inn ennå. Trykk «+ Legg til kurs» over.</div>';
    return;
  }

  currentCourses.forEach((course, index) => {
    if (!course.id) course.id = crypto.randomUUID();

    const card = document.createElement('div');
    card.className = 'course-editor-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentCourses.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Kurs ${index + 1}</strong>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; margin: 0; cursor: pointer;">
            <input type="checkbox" class="course-visible-input" ${course.visible !== false ? 'checked' : ''}> Synlig på nettsiden
          </label>
          <button type="button" class="btn-admin btn-admin-danger delete-course-btn" style="padding: 4px 8px; font-size: 0.75rem;">
            Slett
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Kurstittel</label>
          <input type="text" class="form-control course-title-input" value="${escapeHtml(course.title || '')}" placeholder="AMK 1 – Akuttmedisinkurs 1" required>
        </div>
        <div class="form-group">
          <label>Målgruppe</label>
          <input type="text" class="form-control course-target-input" value="${escapeHtml(course.target_group || '')}" placeholder="Alle medisinstudenter (ingen forkunnskapskrav)">
        </div>
      </div>

      <div class="form-group">
        <label>Anker-ID / Slug (brukes i meny-lenker som #amk-1)</label>
        <input type="text" class="form-control course-slug-input" value="${escapeHtml(course.slug || '')}" placeholder="amk-1">
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label>Kursbeskrivelse</label>
        <textarea class="form-control course-desc-input" rows="3" placeholder="Beskrivelse av kursets innhold og læringsmål..." required>${escapeHtml(course.description || '')}</textarea>
      </div>
    `;

    card.querySelector('.btn-move-up').addEventListener('click', () => moveCourse(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => moveCourse(index, 1));

    card.querySelector('.delete-course-btn').addEventListener('click', () => {
      syncCoursesFromDom();
      if (confirm(`Er du sikker på at du vil slette kurset "${course.title || 'Uten navn'}"?`)) {
        if (course.id) deletedCourseIds.push(course.id);
        currentCourses.splice(index, 1);
        renderCoursesList();
      }
    });

    container.appendChild(card);
  });
}

function addCourseRow() {
  syncCoursesFromDom();
  currentCourses.push({
    id: crypto.randomUUID(),
    slug: '',
    title: '',
    description: '',
    target_group: 'Alle medisinstudenter',
    visible: true,
    sort_order: currentCourses.length + 1
  });
  renderCoursesList();

  const lastCard = document.querySelector('#coursesList > .course-editor-card:last-child');
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      lastCard.querySelector('.course-title-input')?.focus({ preventScroll: true });
    }, 300);
  }
}

// ==============================================================================
// HANDLINGSKORT (Påmelding, medlemskap og booking)
// ==============================================================================

function syncActionsFromDom() {
  const cards = document.querySelectorAll('#actionsList > .action-editor-card');
  cards.forEach((card, idx) => {
    if (currentActions[idx]) {
      currentActions[idx].title = card.querySelector('.act-title-input')?.value.trim() || '';
      currentActions[idx].button_label = card.querySelector('.act-btn-label-input')?.value.trim() || '';
      currentActions[idx].description = card.querySelector('.act-desc-input')?.value.trim() || '';
      currentActions[idx].url = card.querySelector('.act-url-input')?.value.trim() || '';
      currentActions[idx].icon = card.querySelector('.act-icon-input')?.value || 'calendar';
      currentActions[idx].visible = card.querySelector('.act-visible-input')?.checked ?? true;
    }
  });
}

function moveAction(fromIndex, delta) {
  syncActionsFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentActions.length) return;

  const [moved] = currentActions.splice(fromIndex, 1);
  currentActions.splice(toIndex, 0, moved);
  renderActionsList();
}

function renderActionsList() {
  const container = document.getElementById('actionsList');
  container.innerHTML = '';

  if (currentActions.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen handlingskort lagt inn ennå.</div>';
    return;
  }

  currentActions.forEach((act, index) => {
    if (!act.id) act.id = crypto.randomUUID();

    const card = document.createElement('div');
    card.className = 'action-editor-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentActions.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Kort ${index + 1}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; margin: 0; cursor: pointer;">
            <input type="checkbox" class="act-visible-input" ${act.visible !== false ? 'checked' : ''}> Synlig på nettsiden
          </label>
          <button type="button" class="btn-admin btn-admin-danger delete-act-btn" style="padding: 4px 8px; font-size: 0.75rem;">
            Slett
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tittel</label>
          <input type="text" class="form-control act-title-input" value="${escapeHtml(act.title || '')}" required>
        </div>
        <div class="form-group">
          <label>Knappetekst</label>
          <input type="text" class="form-control act-btn-label-input" value="${escapeHtml(act.button_label || '')}" required>
        </div>
      </div>

      <div class="form-group">
        <label>Beskrivelse</label>
        <input type="text" class="form-control act-desc-input" value="${escapeHtml(act.description || '')}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>URL / E-postlenke (https://... eller mailto:...)</label>
          <input type="text" class="form-control act-url-input" value="${escapeHtml(act.url || '')}" placeholder="https://... eller mailto:post@oams.no" required>
        </div>
        <div class="form-group">
          <label>Ikon</label>
          <select class="form-control act-icon-input">
            <option value="calendar" ${act.icon === 'calendar' ? 'selected' : ''}>Kalender (Arrangementer)</option>
            <option value="user-plus" ${act.icon === 'user-plus' ? 'selected' : ''}>Bruker + (Medlemskap)</option>
            <option value="mail" ${act.icon === 'mail' ? 'selected' : ''}>Konvolutt (Booking / E-post)</option>
          </select>
        </div>
      </div>
    `;

    card.querySelector('.btn-move-up').addEventListener('click', () => moveAction(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => moveAction(index, 1));

    card.querySelector('.delete-act-btn').addEventListener('click', () => {
      syncActionsFromDom();
      if (confirm(`Er du sikker på at du vil fjerne "${act.title || 'dette kortet'}"?`)) {
        currentActions.splice(index, 1);
        renderActionsList();
      }
    });

    container.appendChild(card);
  });
}

function addActionRow() {
  syncActionsFromDom();
  currentActions.push({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    button_label: 'Les mer',
    url: 'https://',
    icon: 'calendar',
    visible: true
  });
  renderActionsList();

  const lastCard = document.querySelector('#actionsList > .action-editor-card:last-child');
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      lastCard.querySelector('.act-title-input')?.focus({ preventScroll: true });
    }, 300);
  }
}

// ==============================================================================
// LAGRING TIL SUPABASE
// ==============================================================================

async function saveAll(e, triggerBtn) {
  if (e) e.preventDefault();
  setButtonSaving(triggerBtn, true);

  syncCoursesFromDom();
  syncActionsFromDom();

  try {
    // 1. Seksjoner i site_sections
    const heroContent = {
      subheading: document.getElementById('heroSubheading').value.trim(),
      title: document.getElementById('heroTitle').value.trim()
    };

    const rawBody = document.getElementById('introBody').value.replace(/\r\n/g, '\n').trim();
    const paragraphs = rawBody
      ? rawBody.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean)
      : [];

    const introContent = {
      title: document.getElementById('introTitle').value.trim(),
      lead: document.getElementById('introLead').value.trim(),
      body: rawBody,
      paragraphs
    };

    const portefoljeContent = {
      title: document.getElementById('portefoljeTitle').value.trim(),
      text: document.getElementById('portefoljeText').value.trim()
    };

    const actionsContent = {
      title: document.getElementById('actionsTitle').value.trim(),
      subtitle: document.getElementById('actionsSubtitle').value.trim(),
      items: currentActions.map((act, idx) => ({
        id: act.id || crypto.randomUUID(),
        title: act.title,
        description: act.description || '',
        button_label: act.button_label,
        url: act.url,
        icon: act.icon || 'calendar',
        visible: act.visible !== false,
        sort_order: idx + 1
      }))
    };

    const sectionUpserts = [
      supabaseClient.from('site_sections').upsert({
        key: 'kurs.hero',
        page: 'kurs',
        content: heroContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'kurs.intro',
        page: 'kurs',
        content: introContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'kurs.portefolje_intro',
        page: 'kurs',
        content: portefoljeContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'kurs.actions',
        page: 'kurs',
        content: actionsContent
      }, { onConflict: 'key' })
    ];

    const sectionResults = await Promise.all(sectionUpserts);
    for (const res of sectionResults) {
      if (res.error) throw res.error;
    }

    // 2. Slett fjernede kurs fra tabellen public.courses
    if (deletedCourseIds.length > 0) {
      const { error: delErr } = await supabaseClient
        .from('courses')
        .delete()
        .in('id', deletedCourseIds);

      if (delErr) {
        console.error('Feil ved sletting av kurs:', delErr);
        throw delErr;
      }
      deletedCourseIds = [];
    }

    // 3. Upsert kurs til tabellen public.courses
    const coursesToUpsert = currentCourses.map((c, idx) => {
      const courseId = (c.id && c.id.length > 10) ? c.id : crypto.randomUUID();
      c.id = courseId;

      return {
        id: courseId,
        slug: c.slug || slugify(c.title) || `kurs-${idx + 1}`,
        title: c.title,
        description: c.description || '',
        target_group: c.target_group || '',
        visible: c.visible !== false,
        sort_order: idx + 1
      };
    });

    if (coursesToUpsert.length > 0) {
      const { error: coursesErr } = await supabaseClient
        .from('courses')
        .upsert(coursesToUpsert, { onConflict: 'id' });

      if (coursesErr) {
        console.error('Feil ved lagring av kurs:', coursesErr);
        if (coursesErr.message && coursesErr.message.includes('courses')) {
          throw new Error("Databasetabellen 'courses' finnes ikke ennå. Kjør skriptet 'supabase/add_courses.sql' i Supabase SQL Editor!");
        }
        throw coursesErr;
      }
    }

    setButtonSaving(triggerBtn, false, 'Lagret ✓');
    showToast('Endringene er lagret og publisert på nettsiden! ✓', 'success');

    await loadContent();

  } catch (err) {
    console.error('Lagringsfeil:', err);
    setButtonSaving(triggerBtn, false, 'Feil ved lagring');
    showToast(err.message || 'Det oppstod en feil under lagring. Sjekk konsollen.', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

