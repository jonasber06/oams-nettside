// ==============================================================================
// OAMS CMS - Frontend Content Loader for index.html (Forsiden)
// Henter dynamisk innhold fra Supabase (forside.* og kontakt_oss.*) og oppdaterer DOM-en.
// Beholder statisk HTML som fallback ved nettfeil eller manglende konfigurasjon.
// ==============================================================================

import { getSupabase } from '../supabase-client.js';

const CONTACT_ICONS = {
  location: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  `,
  mail: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  `,
  phone: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  `,
  syringe: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m18 2 4 4"></path>
      <path d="m17 7 3-3"></path>
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"></path>
      <path d="m9 11 4 4"></path>
      <path d="m5 19-3 3"></path>
      <path d="m14 4 6 6"></path>
    </svg>
  `,
  calendar: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  `,
  info: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  `
};

const SOCIAL_ICONS = {
  facebook: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  `,
  instagram: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  `,
  linkedin: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  `,
  globe: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  `
};

const DEFAULT_INTRO = {
  title: 'Førstehjelpskurs av medisinstudenter',
  text: 'Vi er en faglig studentforening ved medisinstudiet på Universitetet i Oslo. Vi arrangerer praktiske akuttmedisinske kurs for medisinstudenter, men holder også førstehjelpskurs for bedrifter, skoler og andre eksterne!',
  button_label: 'Book oss her',
  button_url: 'bookoss.html'
};

const DEFAULT_SLIDESHOW = {
  title: 'Glimt fra våre kurs',
  subtitle: 'Praktisk trening, simulering og livreddende førstehjelp i aksjon.',
  items: []
};

const DEFAULT_CONTACT_INFO = {
  title: 'Kontaktinfo',
  subtitle: 'Har du spørsmål om kurs, booking eller medlemskap? Ta gjerne kontakt med oss på e-post eller via våre sosiale medier.',
  items: [
    {
      title: 'Adresse',
      text: 'Domus Medica, Sognsvannsveien 9,\n0372 Oslo',
      link: '',
      icon: 'location',
      visible: true
    },
    {
      title: 'Email oss',
      text: 'post@oams.no',
      link: 'mailto:post@oams.no',
      icon: 'mail',
      visible: true
    }
  ]
};

const DEFAULT_SOCIALS = {
  items: [
    {
      platform: 'facebook',
      label: 'Facebook',
      url: 'https://www.facebook.com/OsloAMS/',
      visible: true
    },
    {
      platform: 'instagram',
      label: 'Instagram',
      url: 'https://www.instagram.com/osloams/',
      visible: true
    },
    {
      platform: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/company/oslo-akuttmedisinske-studentforening/',
      visible: true
    }
  ]
};

function sanitizeHref(rawHref) {
  if (!rawHref) return '';
  const trimmed = String(rawHref).trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    /^[a-zA-Z0-9_-]+\.html(#.*)?$/.test(trimmed)
  ) {
    return trimmed;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }
  return '';
}

function setMultilineText(el, text) {
  if (!el) return;
  el.textContent = '';
  const lines = String(text || '').split('\n');
  lines.forEach((line, idx) => {
    if (idx > 0) el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(line));
  });
}

async function initForside() {
  try {
    const supabase = await getSupabase();
    let sectionsMap = new Map();

    if (supabase) {
      const { data: sections, error } = await supabase
        .from('site_sections')
        .select('key, content')
        .in('page', ['forside', 'kontakt_oss']);

      if (!error && sections) {
        sectionsMap = new Map(sections.map(s => [s.key, s.content]));
      }
    }

    // 1. Intro / Book-oss seksjon ("Førstehjelpskurs av medisinstudenter")
    const intro = sectionsMap.get('forside.intro') || DEFAULT_INTRO;
    if (intro) {
      const introTitleEl = document.querySelector('[data-cms="intro-title"]');
      const introTextEl = document.querySelector('[data-cms="intro-text"]');
      const introBtnLabelEl = document.querySelector('[data-cms="intro-btn-label"]');
      const introBtnLinkEl = document.querySelector('[data-cms-href="intro-btn-url"]');

      if (introTitleEl && intro.title) introTitleEl.textContent = intro.title;
      // Bare overskriv brødtekst hvis den er lagret i databasen, slik at fet skrift i statisk HTML beholdes ved standardtekst
      if (introTextEl && sectionsMap.has('forside.intro') && typeof intro.text === 'string' && intro.text.trim()) {
        setMultilineText(introTextEl, intro.text);
      }
      if (introBtnLabelEl && intro.button_label) introBtnLabelEl.textContent = intro.button_label;
      if (introBtnLinkEl) {
        const safeUrl = sanitizeHref(intro.button_url || DEFAULT_INTRO.button_url);
        if (safeUrl) {
          introBtnLinkEl.setAttribute('href', safeUrl);
          if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) {
            introBtnLinkEl.setAttribute('target', '_blank');
            introBtnLinkEl.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }
    }

    // 2. Bilde-slideshow seksjon
    const slideshow = sectionsMap.get('forside.slideshow') || DEFAULT_SLIDESHOW;
    if (slideshow) {
      const slideTitleEl = document.querySelector('[data-cms="slideshow-title"]');
      const slideSubEl = document.querySelector('[data-cms="slideshow-subtitle"]');

      if (slideTitleEl && slideshow.title) slideTitleEl.textContent = slideshow.title;
      if (slideSubEl && typeof slideshow.subtitle === 'string') {
        slideSubEl.textContent = slideshow.subtitle;
        slideSubEl.style.display = slideshow.subtitle.trim() ? '' : 'none';
      }

      if (Array.isArray(slideshow.items)) {
        const visibleSlides = slideshow.items
          .filter(item => item && item.visible !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        if (visibleSlides.length > 0 && typeof window.setFrontpageSlideshowImages === 'function') {
          window.setFrontpageSlideshowImages(visibleSlides);
        }
      }
    }

    // 3. Kontaktinfo-boks (synkronisert med kontakt_oss.html)
    const info = sectionsMap.get('kontakt_oss.kontaktinfo') || DEFAULT_CONTACT_INFO;
    if (info) {
      const titleEl = document.querySelector('[data-cms="contact-title"]');
      const subEl = document.querySelector('[data-cms="contact-subtitle"]');

      if (titleEl && info.title) titleEl.textContent = info.title;
      if (subEl && typeof info.subtitle === 'string') {
        subEl.textContent = info.subtitle;
        subEl.style.display = info.subtitle.trim() ? '' : 'none';
      }

      if (Array.isArray(info.items)) {
        const itemsContainer = document.querySelector('[data-cms-list="contact-items"]');
        const visibleItems = info.items.filter(item => item.visible !== false);

        if (itemsContainer && visibleItems.length > 0) {
          itemsContainer.innerHTML = '';
          visibleItems.forEach(item => {
            const box = document.createElement('div');
            box.className = 'contact-item-box';

            const iconSvg = CONTACT_ICONS[item.icon] || CONTACT_ICONS.info;
            const safeHref = sanitizeHref(item.link);

            box.innerHTML = `
              <div class="contact-item-icon">${iconSvg}</div>
              <div class="contact-item-content">
                <h3 class="contact-item-title"></h3>
                <p class="contact-item-desc"></p>
              </div>
            `;

            box.querySelector('.contact-item-title').textContent = item.title || '';
            const descEl = box.querySelector('.contact-item-desc');

            if (safeHref) {
              const a = document.createElement('a');
              a.href = safeHref;
              a.className = 'contact-item-link';
              if (safeHref.startsWith('http')) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
              }
              a.textContent = item.text || safeHref.replace(/^mailto:/, '');
              descEl.appendChild(a);
            } else {
              const lines = String(item.text || '').split('\n');
              lines.forEach((line, idx) => {
                if (idx > 0) descEl.appendChild(document.createElement('br'));
                descEl.appendChild(document.createTextNode(line));
              });
            }

            itemsContainer.appendChild(box);
          });
        }
      }
    }

    // 4. Sosiale medier i Kontaktinfo-boksen
    const socials = sectionsMap.get('kontakt_oss.socials') || DEFAULT_SOCIALS;
    if (socials && Array.isArray(socials.items)) {
      const socialsContainer = document.querySelector('[data-cms-list="social-links"]');
      const visibleSocials = socials.items.filter(s => s.visible !== false && sanitizeHref(s.url));

      if (socialsContainer) {
        const wrapper = socialsContainer.closest('.contact-socials-section');
        if (visibleSocials.length === 0) {
          if (wrapper) wrapper.style.display = 'none';
        } else {
          if (wrapper) wrapper.style.display = '';
          socialsContainer.innerHTML = '';

          visibleSocials.forEach(social => {
            const a = document.createElement('a');
            const safeUrl = sanitizeHref(social.url);
            a.href = safeUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'contact-social-btn';
            a.setAttribute('aria-label', social.label || social.platform || 'Sosiale medier');

            const iconSvg = SOCIAL_ICONS[social.platform] || SOCIAL_ICONS.globe;
            a.innerHTML = `${iconSvg}<span class="social-btn-label"></span>`;
            a.querySelector('.social-btn-label').textContent = social.label || social.platform || 'Lenke';

            socialsContainer.appendChild(a);
          });
        }
      }
    }

  } catch (err) {
    console.warn('OAMS CMS: Feil under lasting av forside. Beholder statisk fallback.', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForside);
} else {
  initForside();
}
