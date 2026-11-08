// ==============================================================================
// OAMS CMS - Editor for medisinstudent.html (og kursene på forsiden)
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving } from '../ui.js';

let supabaseClient = null;
let currentCourses = [];
let deletedCourseIds = [];

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
      supabaseClient.from('site_sections').select('key, content').in('page', ['student', 'kurs']),
      supabaseClient.from('courses').select('*').order('sort_order', { ascending: true })
    ]);

    const map = new Map((sectionsRes.data || []).map(s => [s.key, s.content]));

    // 1. Hero
    const hero = map.get('student.hero') || map.get('kurs.hero') || DEFAULT_HERO;
    document.getElementById('heroSubheading').value = hero.subheading ?? DEFAULT_HERO.subheading;
    document.getElementById('heroTitle').value = hero.title ?? DEFAULT_HERO.title;

    // 2. Medlemskap & Vipps
    const medlemskap = map.get('student.medlemskap') || map.get('kurs.medlemskap') || DEFAULT_MEDLEMSKAP;
    document.getElementById('medlemTitle').value = medlemskap.title ?? DEFAULT_MEDLEMSKAP.title;
    document.getElementById('medlemLead').value = medlemskap.lead ?? DEFAULT_MEDLEMSKAP.lead;
    document.getElementById('medlemBtnLabel').value = medlemskap.button_label ?? DEFAULT_MEDLEMSKAP.button_label;
    document.getElementById('medlemBtnUrl').value = medlemskap.button_url ?? DEFAULT_MEDLEMSKAP.button_url;

    // 3. Kursoversikt-overskrift + Kursliste
    const portefolje = map.get('student.portefolje_intro') || map.get('kurs.portefolje_intro') || DEFAULT_PORTEFOLJE;
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

    // 4. Sosiale medier (SoMe-boks under kursene)
    const some = map.get('student.some') || map.get('kurs.some') || DEFAULT_SOME;
    document.getElementById('someTitle').value = some.title ?? DEFAULT_SOME.title;
    document.getElementById('someText').value = some.text ?? DEFAULT_SOME.text;
    document.getElementById('someFacebookLabel').value = some.facebook_label ?? DEFAULT_SOME.facebook_label;
    document.getElementById('someFacebookUrl').value = some.facebook_url ?? DEFAULT_SOME.facebook_url;
    document.getElementById('someInstagramLabel').value = some.instagram_label ?? DEFAULT_SOME.instagram_label;
    document.getElementById('someInstagramUrl').value = some.instagram_url ?? DEFAULT_SOME.instagram_url;

    // 5. OAMS-Merch
    const merch = map.get('student.merch') || map.get('kurs.merch') || DEFAULT_MERCH;
    document.getElementById('merchTitle').value = merch.title ?? DEFAULT_MERCH.title;
    document.getElementById('merchText').value = merch.text ?? DEFAULT_MERCH.text;
    document.getElementById('merchBtnLabel').value = merch.button_label ?? DEFAULT_MERCH.button_label;
    document.getElementById('merchBtnUrl').value = merch.button_url ?? DEFAULT_MERCH.button_url;
    document.getElementById('merchListTitle').value = merch.list_title ?? DEFAULT_MERCH.list_title;

    const merchItemsArr = Array.isArray(merch.items) && merch.items.length > 0
      ? merch.items
      : DEFAULT_MERCH.items;
    document.getElementById('merchItems').value = merchItemsArr.join('\n');

  } catch (err) {
    console.error('Feil ved lasting av innhold:', err);
    showToast('Kunne ikke hente alt innhold fra databasen.', 'error');
  }
}

// ==============================================================================
// KURSOVERSIKT (Tabellen public.courses)
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
      currentCourses[idx].title = title;
      currentCourses[idx].slug = currentCourses[idx].slug || slugify(title) || `kurs-${idx + 1}`;
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
          <label>Målgruppe (valgfritt)</label>
          <input type="text" class="form-control course-target-input" value="${escapeHtml(course.target_group || '')}" placeholder="Alle medisinstudenter (ingen forkunnskapskrav)">
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label>Kort kursbeskrivelse</label>
        <textarea class="form-control course-desc-input" rows="3" placeholder="Kort beskrivelse av kurset..." required>${escapeHtml(course.description || '')}</textarea>
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
    target_group: '',
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
// LAGRING TIL SUPABASE
// ==============================================================================

async function saveAll(e, triggerBtn) {
  if (e) e.preventDefault();
  setButtonSaving(triggerBtn, true);

  syncCoursesFromDom();

  try {
    // 1. Seksjoner i site_sections
    const heroContent = {
      subheading: document.getElementById('heroSubheading').value.trim(),
      title: document.getElementById('heroTitle').value.trim()
    };

    const medlemskapContent = {
      title: document.getElementById('medlemTitle').value.trim(),
      lead: document.getElementById('medlemLead').value.replace(/\r\n/g, '\n').trim(),
      button_label: document.getElementById('medlemBtnLabel').value.trim(),
      button_url: document.getElementById('medlemBtnUrl').value.trim() || '#'
    };

    const portefoljeContent = {
      title: document.getElementById('portefoljeTitle').value.trim(),
      text: document.getElementById('portefoljeText').value.trim()
    };

    const someContent = {
      title: document.getElementById('someTitle').value.trim(),
      text: document.getElementById('someText').value.replace(/\r\n/g, '\n').trim(),
      facebook_label: document.getElementById('someFacebookLabel').value.trim() || 'Facebook',
      facebook_url: document.getElementById('someFacebookUrl').value.trim() || '#',
      instagram_label: document.getElementById('someInstagramLabel').value.trim() || 'Instagram',
      instagram_url: document.getElementById('someInstagramUrl').value.trim() || '#'
    };

    const rawMerchItems = document.getElementById('merchItems').value.replace(/\r\n/g, '\n');
    const merchItemsList = rawMerchItems
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const merchContent = {
      title: document.getElementById('merchTitle').value.trim(),
      text: document.getElementById('merchText').value.replace(/\r\n/g, '\n').trim(),
      button_label: document.getElementById('merchBtnLabel').value.trim(),
      button_url: document.getElementById('merchBtnUrl').value.trim() || '#',
      list_title: document.getElementById('merchListTitle').value.trim(),
      items: merchItemsList
    };

    const sectionUpserts = [
      supabaseClient.from('site_sections').upsert({
        key: 'student.hero',
        page: 'student',
        content: heroContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'student.medlemskap',
        page: 'student',
        content: medlemskapContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'student.portefolje_intro',
        page: 'student',
        content: portefoljeContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'student.some',
        page: 'student',
        content: someContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'student.merch',
        page: 'student',
        content: merchContent
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
        slug: slugify(c.title) || c.slug || `kurs-${idx + 1}`,
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
