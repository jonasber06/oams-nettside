// ==============================================================================
// OAMS CMS - Frontend Content Loader for om_oss.html
// Henter dynamisk innhold fra Supabase og oppdaterer DOM-en.
// Beholder statisk HTML som fallback ved nettfeil eller manglende konfigurasjon.
// ==============================================================================

import { getSupabase } from '../supabase-client.js';

// SVG-ikoner for dokumenter
const ICONS = {
  doc: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `,
  book: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  `,
  folder: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  `,
  scale: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  `,
  file: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  `
};

async function initOmOss() {
  try {
    const supabase = await getSupabase();
    if (!supabase) return; // Fallback forblir urørt

    // Hent all data for siden parallelt
    const [sectionsRes, rolesRes, docsRes] = await Promise.all([
      supabase.from('site_sections').select('key, content').eq('page', 'om_oss'),
      supabase.from('board_roles').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('documents').select('*').eq('visible', true).order('sort_order', { ascending: true })
    ]);

    // 1. Oppdater seksjonstekster hvis data finnes
    if (sectionsRes.data && sectionsRes.data.length > 0) {
      const sectionsMap = new Map(sectionsRes.data.map(s => [s.key, s.content]));

      // Hero
      const hero = sectionsMap.get('om_oss.hero');
      if (hero) {
        const sub = document.querySelector('[data-cms="hero-subheading"]');
        const title = document.querySelector('[data-cms="hero-title"]');
        if (sub && hero.subheading) sub.textContent = hero.subheading;
        if (title && hero.title) title.textContent = hero.title;
      }

      // Hvem er vi
      const hvem = sectionsMap.get('om_oss.hvem_er_vi');
      if (hvem) {
        const title = document.querySelector('[data-cms="about-title"]');
        const lead = document.querySelector('[data-cms="about-lead"]');
        const bodyContainer = document.querySelector('[data-cms="about-paragraphs"]');

        if (title && hvem.title) title.textContent = hvem.title;
        if (lead && hvem.lead) lead.textContent = hvem.lead;
        if (bodyContainer && Array.isArray(hvem.paragraphs)) {
          bodyContainer.innerHTML = '';
          hvem.paragraphs.forEach(pText => {
            const p = document.createElement('p');
            p.textContent = pText;
            bodyContainer.appendChild(p);
          });
        }
      }

      // Kjerneverdier (hvis boksen finnes i DOM)
      const kjerneverdier = sectionsMap.get('om_oss.kjerneverdier');
      if (kjerneverdier) {
        const kvTitle = document.querySelector('[data-cms="values-title"]');
        const kvText = document.querySelector('[data-cms="values-text"]');
        if (kvTitle && kjerneverdier.title) kvTitle.textContent = kjerneverdier.title;
        if (kvText && kjerneverdier.text) kvText.textContent = kjerneverdier.text;
      }
    }

    // 2. Rendrer Styreverv
    if (rolesRes.data && rolesRes.data.length > 0) {
      const rolesContainer = document.querySelector('[data-cms-list="board-roles"]');
      if (rolesContainer) {
        rolesContainer.innerHTML = '';
        rolesRes.data.forEach(role => {
          const card = document.createElement('div');
          card.className = 'role-card';

          const isPlaceholder = !role.member_name || role.member_name.trim() === '';
          const memberDisplay = isPlaceholder ? 'Styremedlem oppdateres' : role.member_name.trim();

          const avatarHtml = role.image_url && role.image_url.trim() !== ''
            ? `<div class="role-avatar-wrap"><img src="${escapeHtml(role.image_url)}" alt="${escapeHtml(role.title)}" class="role-avatar-img"></div>`
            : `<div class="role-avatar-wrap role-avatar-empty">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="role-avatar-icon">
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                   <circle cx="12" cy="7" r="4"></circle>
                 </svg>
               </div>`;

          card.innerHTML = `
            <div>
              ${avatarHtml}
              <h3 class="role-title"></h3>
              <p class="role-member-notice ${isPlaceholder ? 'placeholder' : ''}"></p>
            </div>
            <a href="mailto:${encodeURIComponent(role.email)}" class="role-contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <span></span>
            </a>
          `;

          // Bruk textContent for XSS-sikkerhet på tekstfeltene
          card.querySelector('.role-title').textContent = role.title;
          card.querySelector('.role-member-notice').textContent = memberDisplay;
          card.querySelector('.role-contact-link span').textContent = role.email;

          rolesContainer.appendChild(card);
        });
      }
    }

    // 3. Rendrer Dokumenter
    if (docsRes.data && docsRes.data.length > 0) {
      const docsContainer = document.querySelector('[data-cms-list="documents"]');
      if (docsContainer) {
        docsContainer.innerHTML = '';
        docsRes.data.forEach(doc => {
          const card = document.createElement('div');
          card.className = 'doc-card';

          const iconSvg = ICONS[doc.icon] || ICONS.file;
          const safeUrl = doc.url.startsWith('https://') || doc.url.startsWith('http://')
            ? doc.url
            : '#';

          card.innerHTML = `
            <div class="doc-icon-wrap">${iconSvg}</div>
            <h3 class="doc-card-title"></h3>
            <p class="doc-card-desc"></p>
            <div class="btn-wrap">
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-red">
                <span><span class="btn-doc-text"></span><br>&nearr;</span>
              </a>
            </div>
          `;

          card.querySelector('.doc-card-title').textContent = doc.title;
          card.querySelector('.doc-card-desc').textContent = doc.description || '';
          card.querySelector('.btn-doc-text').textContent = doc.button_label;

          docsContainer.appendChild(card);
        });
      }
    }

  } catch (err) {
    console.warn('OAMS CMS: Feil under lasting av dynamisk innhold. Beholder statisk fallback.', err);
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

// Kjør umiddelbart dersom DOM allerede er parset
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOmOss);
} else {
  initOmOss();
}
