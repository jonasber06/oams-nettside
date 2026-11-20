// ==============================================================================
// OAMS CMS - Editor for medlemskap.html
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving, createAutoSaver } from '../ui.js';

let supabaseClient = null;
let autoSaver = null;
let currentBenefits = [];
let currentPracticalItems = [];
let currentPracticalButtons = [];

const BUTTON_STYLES = {
  'outline-arrow': 'Rød ramme (med pil)',
  outline: 'Rød ramme (uten pil)',
  solid: 'Rød fylt knapp (med pil)',
  vipps: 'Oransje knapp (Vipps-farge med pil)'
};

const BENEFIT_ICONS = {
  pulse: {
    label: 'Puls / EKG (Kurs)',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    `
  },
  users: {
    label: 'Personer / Gruppe (Instruktør)',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    `
  },
  heart: {
    label: 'Hjerte (Fellesskap)',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    `
  },
  check: {
    label: 'Avkrysningsboks (Medbestemmelse)',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    `
  }
};

const DEFAULT_HERO = {
  subheading: 'Bli en del av Oslo Akuttmedisinske Studentforening',
  title: 'OAMS-Medlemskap'
};

const DEFAULT_INFO = {
  title: 'Hva innebærer et OAMS-medlemskap?',
  text: 'Medlemskapet gir deg praktisk akuttmedisinsk erfaring ved siden av studiet, tilgang til kurs og fagkvelder, og muligheten til å engasjere deg i en av Norges mest aktive medisinstudentforeninger.',
  benefits: [
    {
      id: 'kurs',
      icon: 'pulse',
      title: 'Praktiske kurs til medlemspris',
      description: 'Få tilgang til våre populære kurs som AMK 1, AMK 2 og temakvelder med simulering, casetrening og tett veiledning – til redusert medlemspris gjennom hele studietiden.'
    },
    {
      id: 'instruktor',
      icon: 'users',
      title: 'Utdanning som instruktør',
      description: 'Etter fullført AMK 1 kan du søke om å ta instruktørkurs. Som godkjent OAMS-instruktør får du undervisningserfaring på interne kurs og mulighet til å ta betalte eksterne førstehjelpsoppdrag.'
    },
    {
      id: 'fellesskap',
      icon: 'heart',
      title: 'Faglig og sosialt fellesskap',
      description: 'Møt andre medisinstudenter på tvers av kull som deler interessen for akuttmedisin. Vi arrangerer fagkvelder, foredrag med erfarne klinikere og sosiale samlinger gjennom hele studieåret.'
    },
    {
      id: 'medbestemmelse',
      icon: 'check',
      title: 'Medbestemmelse og styreverv',
      description: 'Som medlem har du møte- og stemmerett på OAMS sin generalforsamling, og du kan stille til valg i styret for å være med på å utvikle kurs, utstyr og drift i foreningen.'
    }
  ]
};

const DEFAULT_PRACTICAL = {
  title: 'Praktisk informasjon om medlemskapet',
  intro: 'Medlemskapet er enkelt å komme i gang med og krever ingen forkunnskaper i akuttmedisin.',
  items: [
    {
      id: 'hvem',
      text: '**Hvem kan bli medlem?** Alle medisinstudenter ved Universitetet i Oslo (UiO), uansett modul og erfaring.'
    },
    {
      id: 'innmelding',
      text: '**Slik melder du deg inn:** Betal medlemskontingenten via Vipps-knappen øverst på denne siden for å registrere medlemskapet ditt.'
    },
    {
      id: 'pamelding',
      text: '**Påmelding til kurs:** Datoer og påmeldingslenker til kommende kurs og arrangementer publiseres fortløpende på Facebook og Instagram.'
    },
    {
      id: 'sporsmal',
      text: '**Spørsmål eller endringer?** Ta gjerne kontakt med styret på **post@oams.no** dersom du lurer på noe om medlemskapet.'
    }
  ],
  buttons: [
    {
      id: 'kurs-btn',
      label: 'Se våre kurs',
      url: 'medisinstudent.html#kursoversikt',
      style: 'outline-arrow'
    },
    {
      id: 'kontakt-btn',
      label: 'Kontakt oss',
      url: 'kontakt_oss.html',
      style: 'outline'
    }
  ]
};

function resolvePracticalButtons(practical) {
  if (Array.isArray(practical?.buttons)) {
    return practical.buttons;
  }
  const legacy = [];
  if (practical?.primary_btn_label) {
    legacy.push({
      id: 'kurs-btn',
      label: practical.primary_btn_label,
      url: practical.primary_btn_url || 'medisinstudent.html#kursoversikt',
      style: 'outline-arrow'
    });
  }
  if (practical?.secondary_btn_label) {
    legacy.push({
      id: 'kontakt-btn',
      label: practical.secondary_btn_label,
      url: practical.secondary_btn_url || 'kontakt_oss.html',
      style: 'outline'
    });
  }
  return legacy.length > 0 ? legacy : DEFAULT_PRACTICAL.buttons;
}

async function initEditor() {
  const auth = await requireAdmin();
  if (!auth) return;

  supabaseClient = auth.supabase;

  await loadContent();

  const form = document.getElementById('medlemskapForm');
  autoSaver = createAutoSaver({
    form,
    onSave: ({ isAuto, triggerBtn }) => saveAll({ isAuto, triggerBtn })
  });

  document.getElementById('addBenefitBtn').addEventListener('click', addBenefitRow);
  document.getElementById('addPracticalItemBtn').addEventListener('click', addPracticalItemRow);
  document.getElementById('addPracticalBtn').addEventListener('click', addPracticalButtonRow);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    autoSaver.saveNow(document.getElementById('saveBottomBtn'));
  });
  document.getElementById('saveTopBtn').addEventListener('click', (e) => {
    e.preventDefault();
    autoSaver.saveNow(document.getElementById('saveTopBtn'));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}

async function loadContent() {
  try {
    const { data, error } = await supabaseClient
      .from('site_sections')
      .select('key, content')
      .eq('page', 'medlemskap');

    if (error) throw error;

    const map = new Map((data || []).map(s => [s.key, s.content]));

    // 1. Hero
    const hero = map.get('medlemskap.hero') || DEFAULT_HERO;
    document.getElementById('heroTitle').value = hero.title ?? DEFAULT_HERO.title;
    document.getElementById('heroSubheading').value = hero.subheading ?? DEFAULT_HERO.subheading;

    // 2. Hva innebærer et OAMS-medlemskap? + Fordelsbokser
    const info = map.get('medlemskap.info') || DEFAULT_INFO;
    document.getElementById('infoTitle').value = info.title ?? DEFAULT_INFO.title;
    document.getElementById('infoText').value = info.text ?? DEFAULT_INFO.text;

    const rawBenefits = Array.isArray(info.benefits) ? info.benefits : DEFAULT_INFO.benefits;
    currentBenefits = rawBenefits.map(b => ({
      id: b.id || crypto.randomUUID(),
      icon: BENEFIT_ICONS[b.icon] ? b.icon : 'pulse',
      title: b.title || '',
      description: b.description || ''
    }));
    renderBenefitsList();

    // 3. Praktisk informasjon om medlemskapet
    const practical = map.get('medlemskap.practical') || DEFAULT_PRACTICAL;
    document.getElementById('practicalTitle').value = practical.title ?? DEFAULT_PRACTICAL.title;
    document.getElementById('practicalIntro').value = practical.intro ?? DEFAULT_PRACTICAL.intro;

    const rawItems = Array.isArray(practical.items) ? practical.items : DEFAULT_PRACTICAL.items;
    currentPracticalItems = rawItems.map(item => ({
      id: (item && typeof item === 'object' && item.id) ? item.id : crypto.randomUUID(),
      text: typeof item === 'string' ? item : (item?.text || '')
    }));
    renderPracticalItemsList();

    const rawButtons = resolvePracticalButtons(practical);
    currentPracticalButtons = rawButtons.map(btn => ({
      id: btn.id || crypto.randomUUID(),
      label: btn.label || '',
      url: btn.url || '',
      style: BUTTON_STYLES[btn.style] ? btn.style : 'solid'
    }));
    renderPracticalButtonsList();

  } catch (err) {
    console.error('Feil ved lasting av medlemskap-innhold:', err);
    showToast('Kunne ikke hente innhold fra databasen.', 'error');
  }
}

// ==============================================================================
// FORDELSBOKSER
// ==============================================================================

function syncBenefitsFromDom() {
  const cards = document.querySelectorAll('#benefitsList > .benefit-editor-card');
  cards.forEach((card, idx) => {
    if (currentBenefits[idx]) {
      const iconVal = card.querySelector('.benefit-icon-select')?.value || 'pulse';
      currentBenefits[idx].icon = BENEFIT_ICONS[iconVal] ? iconVal : 'pulse';
      currentBenefits[idx].title = card.querySelector('.benefit-title-input')?.value.trim() || '';
      currentBenefits[idx].description = card.querySelector('.benefit-desc-input')?.value.replace(/\r\n/g, '\n').trim() || '';
    }
  });
}

function moveBenefit(fromIndex, delta) {
  syncBenefitsFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentBenefits.length) return;

  const [moved] = currentBenefits.splice(fromIndex, 1);
  currentBenefits.splice(toIndex, 0, moved);

  renderBenefitsList();
  autoSaver?.trigger(250);
}

function renderBenefitsList() {
  const container = document.getElementById('benefitsList');
  container.innerHTML = '';

  if (currentBenefits.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen bokser lagt inn ennå. Trykk «+ Legg til boks» over.</div>';
    return;
  }

  const iconOptionsHtml = (selectedKey) => Object.entries(BENEFIT_ICONS)
    .map(([key, info]) => `<option value="${key}" ${key === selectedKey ? 'selected' : ''}>${escapeHtml(info.label)}</option>`)
    .join('');

  currentBenefits.forEach((benefit, index) => {
    if (!benefit.id) benefit.id = crypto.randomUUID();
    const iconKey = BENEFIT_ICONS[benefit.icon] ? benefit.icon : 'pulse';

    const card = document.createElement('div');
    card.className = 'benefit-editor-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentBenefits.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Boks ${index + 1}</strong>
        </div>

        <button type="button" class="btn-admin btn-admin-danger delete-benefit-btn" style="padding: 4px 8px; font-size: 0.75rem;">
          Slett
        </button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tittel</label>
          <input type="text" class="form-control benefit-title-input" value="${escapeHtml(benefit.title || '')}" placeholder="F.eks. Praktiske kurs til medlemspris" required>
        </div>
        <div class="form-group">
          <label>SVG-ikon</label>
          <div class="benefit-icon-select-wrap">
            <div class="benefit-icon-preview" aria-hidden="true">${BENEFIT_ICONS[iconKey].svg}</div>
            <select class="form-control benefit-icon-select">
              ${iconOptionsHtml(iconKey)}
            </select>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label>Beskrivelse</label>
        <textarea class="form-control benefit-desc-input" rows="3" placeholder="Beskriv fordelen..." required>${escapeHtml(benefit.description || '')}</textarea>
      </div>
    `;

    const iconSelect = card.querySelector('.benefit-icon-select');
    const iconPreview = card.querySelector('.benefit-icon-preview');
    iconSelect.addEventListener('change', () => {
      const selected = BENEFIT_ICONS[iconSelect.value] ? iconSelect.value : 'pulse';
      iconPreview.innerHTML = BENEFIT_ICONS[selected].svg;
    });

    card.querySelector('.btn-move-up').addEventListener('click', () => moveBenefit(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => moveBenefit(index, 1));

    card.querySelector('.delete-benefit-btn').addEventListener('click', () => {
      syncBenefitsFromDom();
      if (confirm(`Er du sikker på at du vil slette boksen "${benefit.title || 'Uten tittel'}"?`)) {
        currentBenefits.splice(index, 1);
        renderBenefitsList();
        autoSaver?.trigger(100);
      }
    });

    container.appendChild(card);
  });
}

function addBenefitRow() {
  syncBenefitsFromDom();
  currentBenefits.push({
    id: crypto.randomUUID(),
    icon: 'pulse',
    title: '',
    description: ''
  });
  renderBenefitsList();
  autoSaver?.trigger(300);

  const lastCard = document.querySelector('#benefitsList > .benefit-editor-card:last-child');
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      lastCard.querySelector('.benefit-title-input')?.focus({ preventScroll: true });
    }, 300);
  }
}

// ==============================================================================
// PRAKTISK INFORMASJON (PUNKT-OBJEKTER MED STØTTE FOR FET SKRIFT)
// ==============================================================================

function renderFormattedPreview(el, rawText) {
  if (!el) return;
  el.innerHTML = '';
  const text = String(rawText || '').trim();
  if (!text) {
    el.textContent = 'Forhåndsvisning vises her...';
    return;
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) el.appendChild(document.createElement('br'));
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach(part => {
      if (!part) return;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const strong = document.createElement('strong');
        strong.textContent = part.slice(2, -2);
        el.appendChild(strong);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  });
}

function applyBoldToTextarea(textarea) {
  if (!textarea) return;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const value = textarea.value;
  const selected = value.slice(start, end);

  if (selected) {
    const replacement = (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4)
      ? selected.slice(2, -2)
      : `**${selected}**`;
    textarea.value = value.slice(0, start) + replacement + value.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
  } else {
    const placeholder = '**fet tekst**';
    textarea.value = value.slice(0, start) + placeholder + value.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start + 2, start + placeholder.length - 2);
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function syncPracticalItemsFromDom() {
  const cards = document.querySelectorAll('#practicalItemsList > .practical-item-card');
  cards.forEach((card, idx) => {
    if (currentPracticalItems[idx]) {
      currentPracticalItems[idx].text = card.querySelector('.practical-text-input')?.value.replace(/\r\n/g, '\n').trim() || '';
    }
  });
}

function movePracticalItem(fromIndex, delta) {
  syncPracticalItemsFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentPracticalItems.length) return;

  const [moved] = currentPracticalItems.splice(fromIndex, 1);
  currentPracticalItems.splice(toIndex, 0, moved);

  renderPracticalItemsList();
  autoSaver?.trigger(250);
}

function renderPracticalItemsList() {
  const container = document.getElementById('practicalItemsList');
  container.innerHTML = '';

  if (currentPracticalItems.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen punkter lagt inn ennå. Trykk «+ Legg til punkt» over.</div>';
    return;
  }

  currentPracticalItems.forEach((item, index) => {
    if (!item.id) item.id = crypto.randomUUID();

    const card = document.createElement('div');
    card.className = 'practical-item-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentPracticalItems.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Punkt ${index + 1}</strong>
        </div>

        <div class="practical-item-toolbar">
          <button type="button" class="btn-format-bold" title="Gjør markert tekst fet (**tekst**)">
            <strong>B</strong> Fet
          </button>
          <button type="button" class="btn-admin btn-admin-danger delete-practical-btn" style="padding: 4px 8px; font-size: 0.75rem;">
            Slett
          </button>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 8px;">
        <textarea class="form-control practical-text-input" rows="2" placeholder="F.eks. **Hvem kan bli medlem?** Alle medisinstudenter ved UiO...">${escapeHtml(item.text || '')}</textarea>
      </div>

      <div class="practical-item-preview">
        <span class="practical-preview-label">Forhåndsvisning:</span>
        <span class="practical-preview-content"></span>
      </div>
    `;

    const textarea = card.querySelector('.practical-text-input');
    const previewContent = card.querySelector('.practical-preview-content');
    renderFormattedPreview(previewContent, item.text || '');

    textarea.addEventListener('input', () => {
      renderFormattedPreview(previewContent, textarea.value);
    });

    card.querySelector('.btn-format-bold').addEventListener('click', () => {
      applyBoldToTextarea(textarea);
    });

    card.querySelector('.btn-move-up').addEventListener('click', () => movePracticalItem(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => movePracticalItem(index, 1));

    card.querySelector('.delete-practical-btn').addEventListener('click', () => {
      syncPracticalItemsFromDom();
      if (confirm(`Er du sikker på at du vil slette punkt ${index + 1}?`)) {
        currentPracticalItems.splice(index, 1);
        renderPracticalItemsList();
        autoSaver?.trigger(100);
      }
    });

    container.appendChild(card);
  });
}

function addPracticalItemRow() {
  syncPracticalItemsFromDom();
  currentPracticalItems.push({
    id: crypto.randomUUID(),
    text: ''
  });
  renderPracticalItemsList();
  autoSaver?.trigger(300);

  const lastCard = document.querySelector('#practicalItemsList > .practical-item-card:last-child');
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      lastCard.querySelector('.practical-text-input')?.focus({ preventScroll: true });
    }, 300);
  }
}

// ==============================================================================
// KNAPPER NEDERST I MEDLEMSKAP
// ==============================================================================

function syncPracticalButtonsFromDom() {
  const cards = document.querySelectorAll('#practicalButtonsList > .practical-btn-card');
  cards.forEach((card, idx) => {
    if (currentPracticalButtons[idx]) {
      currentPracticalButtons[idx].label = card.querySelector('.practical-btn-label-input')?.value.trim() || '';
      currentPracticalButtons[idx].url = card.querySelector('.practical-btn-url-input')?.value.trim() || '';
      const styleVal = card.querySelector('.practical-btn-style-select')?.value || 'solid';
      currentPracticalButtons[idx].style = BUTTON_STYLES[styleVal] ? styleVal : 'solid';
    }
  });
}

function movePracticalButton(fromIndex, delta) {
  syncPracticalButtonsFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentPracticalButtons.length) return;

  const [moved] = currentPracticalButtons.splice(fromIndex, 1);
  currentPracticalButtons.splice(toIndex, 0, moved);

  renderPracticalButtonsList();
  autoSaver?.trigger(250);
}

function renderPracticalButtonsList() {
  const container = document.getElementById('practicalButtonsList');
  if (!container) return;
  container.innerHTML = '';

  if (currentPracticalButtons.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen knapper lagt inn. Trykk «+ Legg til knapp» for å opprette en knapp.</div>';
    return;
  }

  const styleOptionsHtml = (selectedStyle) => Object.entries(BUTTON_STYLES)
    .map(([key, label]) => `<option value="${key}" ${key === selectedStyle ? 'selected' : ''}>${escapeHtml(label)}</option>`)
    .join('');

  currentPracticalButtons.forEach((btn, index) => {
    if (!btn.id) btn.id = crypto.randomUUID();
    const styleKey = BUTTON_STYLES[btn.style] ? btn.style : 'solid';

    const card = document.createElement('div');
    card.className = 'practical-btn-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentPracticalButtons.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Knapp ${index + 1}</strong>
        </div>

        <button type="button" class="btn-admin btn-admin-danger delete-practical-btn-item" style="padding: 4px 8px; font-size: 0.75rem;">
          Slett
        </button>
      </div>

      <div class="form-row" style="margin-bottom: 0;">
        <div class="form-group" style="margin-bottom: 0;">
          <label>Knappetekst</label>
          <input type="text" class="form-control practical-btn-label-input" value="${escapeHtml(btn.label || '')}" placeholder="F.eks. Se våre kurs">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label>Lenke / URL</label>
          <input type="text" class="form-control practical-btn-url-input" value="${escapeHtml(btn.url || '')}" placeholder="F.eks. medisinstudent.html#kursoversikt">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label>Utseende</label>
          <select class="form-control practical-btn-style-select">
            ${styleOptionsHtml(styleKey)}
          </select>
        </div>
      </div>
    `;

    card.querySelector('.btn-move-up').addEventListener('click', () => movePracticalButton(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => movePracticalButton(index, 1));

    card.querySelector('.delete-practical-btn-item').addEventListener('click', () => {
      syncPracticalButtonsFromDom();
      if (confirm(`Er du sikker på at du vil slette knappen "${btn.label || `Knapp ${index + 1}`}"?`)) {
        currentPracticalButtons.splice(index, 1);
        renderPracticalButtonsList();
        autoSaver?.trigger(100);
      }
    });

    container.appendChild(card);
  });
}

function addPracticalButtonRow() {
  syncPracticalButtonsFromDom();
  currentPracticalButtons.push({
    id: crypto.randomUUID(),
    label: '',
    url: '',
    style: currentPracticalButtons.length === 0 ? 'solid' : 'outline'
  });
  renderPracticalButtonsList();
  autoSaver?.trigger(300);

  const lastCard = document.querySelector('#practicalButtonsList > .practical-btn-card:last-child');
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      lastCard.querySelector('.practical-btn-label-input')?.focus({ preventScroll: true });
    }, 300);
  }
}

// ==============================================================================
// LAGRING TIL SUPABASE
// ==============================================================================

async function saveAll({ isAuto = false, triggerBtn = null } = {}) {
  if (triggerBtn) setButtonSaving(triggerBtn, true);

  syncBenefitsFromDom();
  syncPracticalItemsFromDom();
  syncPracticalButtonsFromDom();

  try {
    const heroContent = {
      title: document.getElementById('heroTitle').value.trim(),
      subheading: document.getElementById('heroSubheading').value.trim()
    };

    const infoContent = {
      title: document.getElementById('infoTitle').value.trim(),
      text: document.getElementById('infoText').value.replace(/\r\n/g, '\n').trim(),
      benefits: currentBenefits.map(b => ({
        id: b.id || crypto.randomUUID(),
        icon: BENEFIT_ICONS[b.icon] ? b.icon : 'pulse',
        title: b.title || '',
        description: b.description || ''
      }))
    };

    const practicalContent = {
      title: document.getElementById('practicalTitle').value.trim(),
      intro: document.getElementById('practicalIntro').value.trim(),
      items: currentPracticalItems
        .filter(item => item.text && item.text.trim() !== '')
        .map(item => ({
          id: item.id || crypto.randomUUID(),
          text: item.text.trim()
        })),
      buttons: currentPracticalButtons
        .filter(btn => btn.label && btn.label.trim() !== '')
        .map(btn => ({
          id: btn.id || crypto.randomUUID(),
          label: btn.label.trim(),
          url: btn.url.trim() || '#',
          style: BUTTON_STYLES[btn.style] ? btn.style : 'solid'
        }))
    };

    const sectionUpserts = [
      supabaseClient.from('site_sections').upsert({
        key: 'medlemskap.hero',
        page: 'medlemskap',
        content: heroContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'medlemskap.info',
        page: 'medlemskap',
        content: infoContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'medlemskap.practical',
        page: 'medlemskap',
        content: practicalContent
      }, { onConflict: 'key' })
    ];

    const results = await Promise.all(sectionUpserts);
    for (const res of results) {
      if (res.error) throw res.error;
    }

    if (!isAuto) {
      showToast('Endringene på OAMS-Medlemskap ble lagret!', 'success');
    }
    return true;
  } catch (err) {
    console.error('Feil ved lagring av medlemskap:', err);
    showToast('Kunne ikke lagre: ' + (err.message || 'Ukjent feil'), 'error');
    return false;
  } finally {
    if (triggerBtn) setButtonSaving(triggerBtn, false);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
