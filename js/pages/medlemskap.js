// ==============================================================================
// OAMS CMS - Frontend Content Loader for medlemskap.html
// Henter dynamisk innhold fra Supabase (site_sections) for både medlemskap-siden
// og den delte Vipps-boksen (student.medlemskap).
// ==============================================================================

import { getSupabase } from '../supabase-client.js';
import { renderFormattedText } from '../text-format.js';

const BENEFIT_ICONS = {
  pulse: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  `,
  users: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  `,
  heart: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  `,
  check: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  `
};

const CHECK_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
`;

const ARROW_ICON_SVG = `
  <svg class="btn-arrow" viewBox="0 0 448 512" fill="currentColor">
    <path d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z" />
  </svg>
`;

const DEFAULT_HERO = {
  subheading: 'Bli en del av Oslo Akuttmedisinske Studentforening',
  title: 'OAMS-Medlemskap'
};

const DEFAULT_MEDLEMSKAP_VIPPS = {
  title: 'Bli medlem!',
  lead: 'Som medlem i OAMS får du tilgang til våre populære akuttmedisinske kurs til medlemspris, mulighet til å utdanne deg som instruktør (med betalte eksterne kursoppdrag) og bli en del av et engasjert faglig miljø på medisinstudiet.',
  button_label: 'Betal medlemskap på Vipps',
  button_url: '#'
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

async function initMedlemskap() {
  try {
    const supabase = await getSupabase();
    let sectionsMap = new Map();

    if (supabase) {
      const { data, error } = await supabase
        .from('site_sections')
        .select('key, content')
        .in('page', ['medlemskap', 'student', 'kurs']);

      if (!error && Array.isArray(data)) {
        sectionsMap = new Map(data.map(s => [s.key, s.content]));
      }
    }

    // 1. Hero
    const hero = sectionsMap.get('medlemskap.hero') || DEFAULT_HERO;
    const heroSub = document.querySelector('[data-cms="medlemskap-hero-subheading"]');
    const heroTitle = document.querySelector('[data-cms="medlemskap-hero-title"]');
    if (heroSub && hero.subheading) renderFormattedText(heroSub, hero.subheading, { multiline: false });
    if (heroTitle && hero.title) renderFormattedText(heroTitle, hero.title, { multiline: false });

    // 2. Delt Vipps-boks (synkronisert med medisinstudent.html)
    const vippsBox = sectionsMap.get('student.medlemskap') || sectionsMap.get('kurs.medlemskap') || DEFAULT_MEDLEMSKAP_VIPPS;
    const mTitle = document.querySelector('[data-cms="medlem-title"]');
    const mLead = document.querySelector('[data-cms="medlem-lead"]');
    const mBtnLabel = document.querySelector('[data-cms="medlem-btn-label"]');
    if (mTitle && vippsBox.title) renderFormattedText(mTitle, vippsBox.title, { multiline: false });
    if (mLead && vippsBox.lead) renderFormattedText(mLead, vippsBox.lead);
    if (mBtnLabel && vippsBox.button_label) renderFormattedText(mBtnLabel, vippsBox.button_label, { multiline: false });
    applyLinkHref('[data-cms-href="medlem-btn-url"]', vippsBox.button_url || DEFAULT_MEDLEMSKAP_VIPPS.button_url);

    // 3. Hva innebærer et OAMS-medlemskap? + Fordelsbokser
    const info = sectionsMap.get('medlemskap.info') || DEFAULT_INFO;
    const infoTitle = document.querySelector('[data-cms="info-title"]');
    const infoText = document.querySelector('[data-cms="info-text"]');
    if (infoTitle && info.title) renderFormattedText(infoTitle, info.title, { multiline: false });
    if (infoText && info.text) renderFormattedText(infoText, info.text);

    const benefitsContainer = document.querySelector('[data-cms-list="membership-benefits"]');
    if (benefitsContainer) {
      const benefits = Array.isArray(info.benefits) ? info.benefits : DEFAULT_INFO.benefits;
      benefitsContainer.innerHTML = '';

      benefits.forEach(benefit => {
        const iconKey = BENEFIT_ICONS[benefit.icon] ? benefit.icon : 'pulse';
        const article = document.createElement('article');
        article.className = 'membership-benefit-card';

        article.innerHTML = `
          <div class="membership-benefit-icon" aria-hidden="true">${BENEFIT_ICONS[iconKey]}</div>
          <h3 class="membership-benefit-title"></h3>
          <p class="membership-benefit-desc"></p>
        `;

        renderFormattedText(article.querySelector('.membership-benefit-title'), benefit.title || '', { multiline: false });
        renderFormattedText(article.querySelector('.membership-benefit-desc'), benefit.description || '');
        benefitsContainer.appendChild(article);
      });
    }

    // 4. Praktisk informasjon om medlemskapet
    const practical = sectionsMap.get('medlemskap.practical') || DEFAULT_PRACTICAL;
    const pTitle = document.querySelector('[data-cms="practical-title"]');
    const pIntro = document.querySelector('[data-cms="practical-intro"]');

    if (pTitle && practical.title) renderFormattedText(pTitle, practical.title, { multiline: false });
    if (pIntro && practical.intro) renderFormattedText(pIntro, practical.intro);

    const itemsContainer = document.querySelector('[data-cms-list="membership-practical-items"]');
    if (itemsContainer) {
      const items = Array.isArray(practical.items) ? practical.items : DEFAULT_PRACTICAL.items;
      itemsContainer.innerHTML = '';

      items.forEach(item => {
        const rawText = typeof item === 'string' ? item : (item?.text || '');
        if (!rawText.trim()) return;

        const li = document.createElement('li');
        li.innerHTML = `${CHECK_ICON_SVG}<span class="membership-practical-text"></span>`;
        renderFormattedText(li.querySelector('.membership-practical-text'), rawText);
        itemsContainer.appendChild(li);
      });
    }

    const buttonsContainer = document.querySelector('[data-cms-list="membership-practical-buttons"]');
    if (buttonsContainer) {
      const buttons = resolvePracticalButtons(practical).filter(b => b && String(b.label || '').trim() !== '');
      buttonsContainer.innerHTML = '';

      if (buttons.length === 0) {
        buttonsContainer.style.display = 'none';
      } else {
        buttonsContainer.style.display = '';
        buttons.forEach(btn => {
          const a = document.createElement('a');
          const safeUrl = sanitizeHref(btn.url || '#');
          a.setAttribute('href', safeUrl);
          if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          }

          const style = btn.style || 'outline';
          if (style === 'outline' || style === 'outline-arrow') {
            a.className = 'btn btn-outline-red';
          } else if (style === 'vipps') {
            a.className = 'btn btn-vipps';
          } else {
            a.className = 'btn btn-solid-red';
          }

          const span = document.createElement('span');
          renderFormattedText(span, btn.label || '', { multiline: false });
          a.appendChild(span);

          if (style !== 'outline') {
            a.insertAdjacentHTML('beforeend', ARROW_ICON_SVG);
          }

          buttonsContainer.appendChild(a);
        });
      }
    }

  } catch (err) {
    console.warn('OAMS CMS: Feil under lasting av medlemskap-siden.', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMedlemskap);
} else {
  initMedlemskap();
}
