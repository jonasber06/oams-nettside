// ==============================================================================
// OAMS Admin - Editor for "Kontakt oss" (kontakt_oss.html)
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving } from '../ui.js';

let supabaseClient = null;
let currentContactItems = [];
let currentSocials = [];

const DEFAULT_HERO = {
  subheading: 'Oslo Akuttmedisinske Studentforening',
  title: 'Kontakt oss'
};

const DEFAULT_CONTACT_INFO = {
  title: 'Kontaktinfo',
  subtitle: 'Har du spørsmål om kurs, booking eller medlemskap? Ta gjerne kontakt med oss på e-post eller via våre sosiale medier.',
  items: [
    {
      id: 'default-address',
      title: 'Adresse',
      text: 'Domus Medica, Sognsvannsveien 9,\n0372 Oslo',
      link: '',
      icon: 'location',
      visible: true
    },
    {
      id: 'default-email',
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
      id: 'default-fb',
      platform: 'facebook',
      label: 'Facebook',
      url: 'https://www.facebook.com/OsloAMS/',
      visible: true
    },
    {
      id: 'default-ig',
      platform: 'instagram',
      label: 'Instagram',
      url: 'https://www.instagram.com/osloams/',
      visible: true
    },
    {
      id: 'default-li',
      platform: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/company/oslo-akuttmedisinske-studentforening/',
      visible: true
    }
  ]
};

async function initEditor() {
  const auth = await requireAdmin();
  if (!auth) return;

  supabaseClient = auth.supabase;

  await loadContent();

  document.getElementById('addContactItemBtn').addEventListener('click', addContactItemRow);
  document.getElementById('addSocialBtn').addEventListener('click', addSocialRow);

  const form = document.getElementById('kontaktOssForm');
  const saveTopBtn = document.getElementById('saveTopBtn');
  const saveBottomBtn = document.getElementById('saveBottomBtn');

  form.addEventListener('submit', (e) => saveAll(e, saveBottomBtn));
  saveTopBtn.addEventListener('click', (e) => saveAll(e, saveTopBtn));
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
      .eq('page', 'kontakt_oss');

    if (error) throw error;

    const map = new Map((data || []).map(s => [s.key, s.content]));

    // 1. Hero
    const hero = map.get('kontakt_oss.hero') || DEFAULT_HERO;
    document.getElementById('heroSubheading').value = hero.subheading ?? DEFAULT_HERO.subheading;
    document.getElementById('heroTitle').value = hero.title ?? DEFAULT_HERO.title;

    // 2. Kontaktinfo
    const info = map.get('kontakt_oss.kontaktinfo') || DEFAULT_CONTACT_INFO;
    document.getElementById('contactTitle').value = info.title ?? DEFAULT_CONTACT_INFO.title;
    document.getElementById('contactSubtitle').value = info.subtitle ?? DEFAULT_CONTACT_INFO.subtitle;

    const rawItems = Array.isArray(info.items) ? info.items : DEFAULT_CONTACT_INFO.items;
    currentContactItems = rawItems.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      visible: item.visible !== false
    }));
    renderContactItemsList();

    // 3. Sosiale medier
    const socials = map.get('kontakt_oss.socials') || DEFAULT_SOCIALS;
    const rawSocials = Array.isArray(socials.items) ? socials.items : DEFAULT_SOCIALS.items;
    currentSocials = rawSocials.map(s => ({
      ...s,
      id: s.id || crypto.randomUUID(),
      visible: s.visible !== false
    }));
    renderSocialsList();

  } catch (err) {
    console.error('Feil ved lasting av innhold:', err);
    showToast('Kunne ikke hente innhold fra databasen.', 'error');
  }
}

// ==============================================================================
// KONTAKTPUNKTER (Adresse, E-post osv.)
// ==============================================================================

function syncContactItemsFromDom() {
  const cards = document.querySelectorAll('#contactItemsList > .contact-editor-card');
  cards.forEach((card, idx) => {
    if (currentContactItems[idx]) {
      currentContactItems[idx].title = card.querySelector('.ci-title-input')?.value.trim() || '';
      currentContactItems[idx].text = card.querySelector('.ci-text-input')?.value.trim() || '';
      currentContactItems[idx].link = card.querySelector('.ci-link-input')?.value.trim() || '';
      currentContactItems[idx].icon = card.querySelector('.ci-icon-input')?.value || 'location';
      currentContactItems[idx].visible = card.querySelector('.ci-visible-input')?.checked ?? true;
    }
  });
}

function moveContactItem(fromIndex, delta) {
  syncContactItemsFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentContactItems.length) return;

  const [moved] = currentContactItems.splice(fromIndex, 1);
  currentContactItems.splice(toIndex, 0, moved);
  renderContactItemsList();
}

function renderContactItemsList() {
  const container = document.getElementById('contactItemsList');
  container.innerHTML = '';

  if (currentContactItems.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen kontaktpunkter lagt inn ennå. Trykk «+ Legg til kontaktpunkt» over.</div>';
    return;
  }

  currentContactItems.forEach((item, index) => {
    if (!item.id) item.id = crypto.randomUUID();

    const card = document.createElement('div');
    card.className = 'contact-editor-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentContactItems.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Kontaktpunkt ${index + 1}</strong>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; margin: 0; cursor: pointer;">
            <input type="checkbox" class="ci-visible-input" ${item.visible !== false ? 'checked' : ''}> Synlig på nettsiden
          </label>
          <button type="button" class="btn-admin btn-admin-danger delete-ci-btn" style="padding: 4px 8px; font-size: 0.75rem;">
            Slett
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Overskrift (f.eks. Adresse eller Email oss)</label>
          <input type="text" class="form-control ci-title-input" value="${escapeHtml(item.title || '')}" placeholder="Adresse" required>
        </div>
        <div class="form-group">
          <label>Ikon</label>
          <select class="form-control ci-icon-input">
            <option value="location" ${item.icon === 'location' ? 'selected' : ''}>Kartnål (Adresse)</option>
            <option value="mail" ${item.icon === 'mail' ? 'selected' : ''}>Konvolutt (E-post)</option>
            <option value="phone" ${item.icon === 'phone' ? 'selected' : ''}>Telefon</option>
            <option value="syringe" ${item.icon === 'syringe' ? 'selected' : ''}>Sprøyte (Medisinsk)</option>
            <option value="calendar" ${item.icon === 'calendar' ? 'selected' : ''}>Kalender (Booking / Kurs)</option>
            <option value="info" ${item.icon === 'info' ? 'selected' : ''}>Info-ikon</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tekst / visningsverdi (støtter linjeskift)</label>
          <textarea class="form-control ci-text-input" rows="2" placeholder="Domus Medica, Sognsvannsveien 9, 0372 Oslo" style="min-height: 62px;" required>${escapeHtml(item.text || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Klikkbar lenke (valgfritt, f.eks. mailto:post@oams.no)</label>
          <input type="text" class="form-control ci-link-input" value="${escapeHtml(item.link || '')}" placeholder="mailto:post@oams.no eller https://...">
        </div>
      </div>
    `;

    card.querySelector('.btn-move-up').addEventListener('click', () => moveContactItem(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => moveContactItem(index, 1));

    card.querySelector('.delete-ci-btn').addEventListener('click', () => {
      syncContactItemsFromDom();
      if (confirm(`Er du sikker på at du vil slette "${item.title || 'dette kontaktpunktet'}"?`)) {
        currentContactItems.splice(index, 1);
        renderContactItemsList();
      }
    });

    container.appendChild(card);
  });
}

function addContactItemRow() {
  syncContactItemsFromDom();
  currentContactItems.push({
    id: crypto.randomUUID(),
    title: '',
    text: '',
    link: '',
    icon: 'mail',
    visible: true
  });
  renderContactItemsList();
}

// ==============================================================================
// SOSIALE MEDIER (Facebook, Instagram, LinkedIn osv.)
// ==============================================================================

function syncSocialsFromDom() {
  const rows = document.querySelectorAll('#socialsList > .social-editor-card');
  rows.forEach((row, idx) => {
    if (currentSocials[idx]) {
      currentSocials[idx].platform = row.querySelector('.soc-platform-input')?.value || 'facebook';
      currentSocials[idx].label = row.querySelector('.soc-label-input')?.value.trim() || '';
      currentSocials[idx].url = row.querySelector('.soc-url-input')?.value.trim() || '';
      currentSocials[idx].visible = row.querySelector('.soc-visible-input')?.checked ?? true;
    }
  });
}

function moveSocial(fromIndex, delta) {
  syncSocialsFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentSocials.length) return;

  const [moved] = currentSocials.splice(fromIndex, 1);
  currentSocials.splice(toIndex, 0, moved);
  renderSocialsList();
}

function renderSocialsList() {
  const container = document.getElementById('socialsList');
  container.innerHTML = '';

  if (currentSocials.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen sosiale medier lagt inn ennå. Trykk «+ Legg til kanal» over.</div>';
    return;
  }

  currentSocials.forEach((soc, index) => {
    if (!soc.id) soc.id = crypto.randomUUID();

    const card = document.createElement('div');
    card.className = 'social-editor-card';
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="role-reorder-wrap" style="flex-direction: row; gap: 4px;">
            <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentSocials.length - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <strong style="font-size: 0.9rem;">Kanal ${index + 1}</strong>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; margin: 0; cursor: pointer;">
            <input type="checkbox" class="soc-visible-input" ${soc.visible !== false ? 'checked' : ''}> Synlig på nettsiden
          </label>
          <button type="button" class="btn-admin btn-admin-danger delete-soc-btn" style="padding: 4px 8px; font-size: 0.75rem;">
            Slett
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Plattform / Ikon</label>
          <select class="form-control soc-platform-input">
            <option value="facebook" ${soc.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
            <option value="instagram" ${soc.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
            <option value="linkedin" ${soc.platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
            <option value="globe" ${soc.platform === 'globe' ? 'selected' : ''}>Annen lenke / Nettside</option>
          </select>
        </div>
        <div class="form-group">
          <label>Knappetekst (f.eks. Facebook)</label>
          <input type="text" class="form-control soc-label-input" value="${escapeHtml(soc.label || '')}" placeholder="Facebook" required>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label>URL (full adresse inkl. https://)</label>
        <input type="url" class="form-control soc-url-input" value="${escapeHtml(soc.url || '')}" placeholder="https://www.facebook.com/OsloAMS/" required>
      </div>
    `;

    card.querySelector('.btn-move-up').addEventListener('click', () => moveSocial(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => moveSocial(index, 1));

    card.querySelector('.delete-soc-btn').addEventListener('click', () => {
      syncSocialsFromDom();
      if (confirm(`Er du sikker på at du vil fjerne "${soc.label || 'denne kanalen'}"?`)) {
        currentSocials.splice(index, 1);
        renderSocialsList();
      }
    });

    container.appendChild(card);
  });
}

function addSocialRow() {
  syncSocialsFromDom();
  currentSocials.push({
    id: crypto.randomUUID(),
    platform: 'facebook',
    label: 'Facebook',
    url: 'https://',
    visible: true
  });
  renderSocialsList();
}

// ==============================================================================
// LAGRING TIL SUPABASE
// ==============================================================================

async function saveAll(e, triggerBtn) {
  if (e) e.preventDefault();
  setButtonSaving(triggerBtn, true);

  syncContactItemsFromDom();
  syncSocialsFromDom();

  try {
    const heroContent = {
      subheading: document.getElementById('heroSubheading').value.trim(),
      title: document.getElementById('heroTitle').value.trim()
    };

    const contactInfoContent = {
      title: document.getElementById('contactTitle').value.trim(),
      subtitle: document.getElementById('contactSubtitle').value.trim(),
      items: currentContactItems.map((item, idx) => ({
        id: item.id || crypto.randomUUID(),
        title: item.title,
        text: item.text,
        link: item.link,
        icon: item.icon || 'location',
        visible: item.visible !== false,
        sort_order: idx + 1
      }))
    };

    const socialsContent = {
      items: currentSocials.map((soc, idx) => ({
        id: soc.id || crypto.randomUUID(),
        platform: soc.platform || 'facebook',
        label: soc.label,
        url: soc.url,
        visible: soc.visible !== false,
        sort_order: idx + 1
      }))
    };

    const upserts = [
      supabaseClient.from('site_sections').upsert({
        key: 'kontakt_oss.hero',
        page: 'kontakt_oss',
        content: heroContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'kontakt_oss.kontaktinfo',
        page: 'kontakt_oss',
        content: contactInfoContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'kontakt_oss.socials',
        page: 'kontakt_oss',
        content: socialsContent
      }, { onConflict: 'key' })
    ];

    const results = await Promise.all(upserts);
    for (const res of results) {
      if (res.error) throw res.error;
    }

    showToast('Endringene er lagret og publisert!', 'success');
  } catch (err) {
    console.error('Feil ved lagring av Kontakt oss:', err);
    showToast(err.message || 'Kunne ikke lagre endringene. Sjekk konsollen.', 'error');
  } finally {
    setButtonSaving(triggerBtn, false);
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

