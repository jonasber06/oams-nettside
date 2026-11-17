// ==============================================================================
// OAMS CMS - Editor for "Forsiden" (index.html)
// Håndterer redigering av:
//   - forside.intro (Førstehjelpskurs av medisinstudenter + Book oss-knapp)
//   - forside.slideshow (Overskrift, undertittel og dynamisk bildeliste med opplasting)
//   - kontakt_oss.kontaktinfo (Overskrift og introtekst i kontaktboksen nederst)
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving, createAutoSaver } from '../ui.js';

let supabaseClient = null;
let autoSaver = null;
let currentSlides = [];
let cachedContactInfo = null;
let draggedSlideIndex = null;

const DEFAULT_INTRO = {
  title: 'Førstehjelpskurs av medisinstudenter',
  text: 'Vi er en faglig studentforening ved medisinstudiet på Universitetet i Oslo. Vi arrangerer praktiske akuttmedisinske kurs for medisinstudenter, men holder også førstehjelpskurs for bedrifter, skoler og andre eksterne!',
  button_label: 'Book oss her',
  button_url: 'bookoss.html'
};

const DEFAULT_SLIDESHOW = {
  title: 'Glimt fra våre kurs',
  subtitle: 'Praktisk trening, simulering og livreddende førstehjelp i aksjon.',
  items: [
    { id: 'slide-1', url: '', caption: 'Bilde 1', visible: true, sort_order: 1 },
    { id: 'slide-2', url: '', caption: 'Bilde 2', visible: true, sort_order: 2 },
    { id: 'slide-3', url: '', caption: 'Bilde 3', visible: true, sort_order: 3 },
    { id: 'slide-4', url: '', caption: 'Bilde 4', visible: true, sort_order: 4 }
  ]
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

async function initEditor() {
  const auth = await requireAdmin();
  if (!auth) return;

  supabaseClient = auth.supabase;

  await loadContent();

  const form = document.getElementById('forsideForm');
  autoSaver = createAutoSaver({
    form,
    onSave: ({ isAuto, triggerBtn }) => saveAll({ isAuto, triggerBtn })
  });

  document.getElementById('addSlideBtn').addEventListener('click', addSlideRow);
  document.getElementById('saveTopBtn').addEventListener('click', (e) => {
    e.preventDefault();
    autoSaver.saveNow(document.getElementById('saveTopBtn'));
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    autoSaver.saveNow(document.getElementById('saveBottomBtn'));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}

async function loadContent() {
  try {
    const { data: sections, error } = await supabaseClient
      .from('site_sections')
      .select('key, content')
      .in('page', ['forside', 'kontakt_oss']);

    if (error) throw error;

    const map = new Map((sections || []).map(s => [s.key, s.content]));

    // 1. Intro / Book-oss
    const intro = map.get('forside.intro') || DEFAULT_INTRO;
    document.getElementById('introTitle').value = intro.title ?? DEFAULT_INTRO.title;
    document.getElementById('introText').value = intro.text ?? DEFAULT_INTRO.text;
    document.getElementById('introBtnLabel').value = intro.button_label ?? DEFAULT_INTRO.button_label;
    document.getElementById('introBtnUrl').value = intro.button_url ?? DEFAULT_INTRO.button_url;

    // 2. Bilde-slideshow
    const slideshow = map.get('forside.slideshow') || DEFAULT_SLIDESHOW;
    document.getElementById('slideshowTitle').value = slideshow.title ?? DEFAULT_SLIDESHOW.title;
    document.getElementById('slideshowSubtitle').value = slideshow.subtitle ?? DEFAULT_SLIDESHOW.subtitle;

    const rawSlides = Array.isArray(slideshow.items) && slideshow.items.length > 0
      ? slideshow.items
      : DEFAULT_SLIDESHOW.items;

    currentSlides = rawSlides.map((s, idx) => ({
      id: s.id || crypto.randomUUID(),
      url: s.url || s.image_url || '',
      caption: s.caption || '',
      visible: s.visible !== false,
      sort_order: s.sort_order ?? idx + 1
    }));
    renderSlidesList();

    // 3. Kontaktinfo-tittel & undertittel
    cachedContactInfo = map.get('kontakt_oss.kontaktinfo') || DEFAULT_CONTACT_INFO;
    document.getElementById('contactTitle').value = cachedContactInfo.title ?? DEFAULT_CONTACT_INFO.title;
    document.getElementById('contactSubtitle').value = cachedContactInfo.subtitle ?? DEFAULT_CONTACT_INFO.subtitle;

  } catch (err) {
    console.error('Feil ved lasting av forside-innhold:', err);
    showToast('Kunne ikke hente alt innhold fra databasen.', 'error');
  }
}

// ==============================================================================
// BILDE-SLIDESHOW LISTE
// ==============================================================================

function renderSlidesList() {
  const container = document.getElementById('slidesList');
  container.innerHTML = '';

  if (currentSlides.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--admin-text-muted); padding: 16px;">Ingen bilder lagt til ennå. Klikk «+ Legg til bilde» for å opprette et nytt bilde i karusellen.</div>';
    return;
  }

  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 860;

  currentSlides.forEach((slide, index) => {
    const card = document.createElement('div');
    card.className = 'slide-item-card';
    card.dataset.index = index;

    if (!isMobile) {
      card.setAttribute('draggable', 'true');
    } else {
      card.setAttribute('draggable', 'false');
    }

    const hasImage = Boolean(slide.url && slide.url.trim());

    card.innerHTML = `
      <!-- Rekkefølge med Opp/Ned-knapper -->
      <div class="role-reorder-wrap">
        <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" aria-label="Flytt opp" ${index === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <span class="role-index-num">${index + 1}</span>
        <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" aria-label="Flytt ned" ${index === currentSlides.length - 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>

      <!-- 16:9 Bilde-opplaster / Forhåndsvisning -->
      <div class="slide-thumb-uploader" title="${hasImage ? 'Klikk for å bytte bilde' : 'Klikk for å laste opp bilde'}">
        ${hasImage ? `
          <img src="${escapeHtml(slide.url)}" alt="Forhåndsvisning">
          <button type="button" class="thumb-remove-btn" title="Fjern bilde">&times;</button>
        ` : `
          <svg class="thumb-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span class="thumb-placeholder-text">Last opp bilde</span>
        `}
        <input type="file" class="slide-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;">
      </div>

      <!-- Felter for bilde-URL og bildetekst -->
      <div class="slide-fields-grid">
        <div class="form-group">
          <label style="font-size: 0.78rem; color: var(--admin-text-muted); margin-bottom: 4px;">Bilde-URL (eller klikk bildet til venstre for å laste opp)</label>
          <input type="text" class="form-control slide-url-input" placeholder="https://... eller assets/..." value="${escapeHtml(slide.url || '')}">
        </div>
        <div class="form-group">
          <label style="font-size: 0.78rem; color: var(--admin-text-muted); margin-bottom: 4px;">Bildetekst / beskrivelse (valgfritt)</label>
          <input type="text" class="form-control slide-caption-input" value="${escapeHtml(slide.caption || '')}">
        </div>
      </div>

      <!-- Synlighet & Slett -->
      <div class="slide-actions-col">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; margin: 0; cursor: pointer;">
          <input type="checkbox" class="slide-visible-input" ${slide.visible !== false ? 'checked' : ''}> Synlig
        </label>
        <button type="button" class="btn-admin btn-admin-danger delete-slide-btn" style="padding: 6px 12px; font-size: 0.78rem;" title="Slett bilde">
          Slett
        </button>
      </div>
    `;

    // Opp/Ned
    card.querySelector('.btn-move-up')?.addEventListener('click', (e) => {
      e.preventDefault();
      moveSlide(index, -1);
    });

    card.querySelector('.btn-move-down')?.addEventListener('click', (e) => {
      e.preventDefault();
      moveSlide(index, 1);
    });

    // Drag & Drop på desktop
    if (!isMobile) {
      card.addEventListener('dragstart', (e) => {
        if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          return;
        }
        syncSlidesFromDom();
        draggedSlideIndex = index;
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        document.querySelectorAll('#slidesList .slide-item-card').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = card.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        if (offset < rect.height / 2) {
          card.classList.add('drag-over-top');
          card.classList.remove('drag-over-bottom');
        } else {
          card.classList.add('drag-over-bottom');
          card.classList.remove('drag-over-top');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over-top', 'drag-over-bottom');
        if (draggedSlideIndex === null || draggedSlideIndex === index) return;

        const rect = card.getBoundingClientRect();
        const dropTop = (e.clientY - rect.top) < rect.height / 2;
        let targetIndex = dropTop ? index : index + 1;
        if (draggedSlideIndex < targetIndex) targetIndex--;

        const [movedItem] = currentSlides.splice(draggedSlideIndex, 1);
        currentSlides.splice(targetIndex, 0, movedItem);

        currentSlides.forEach((s, idx) => {
          s.sort_order = idx + 1;
        });

        draggedSlideIndex = null;
        renderSlidesList();
        autoSaver?.trigger(250);
      });
    }

    // Oppdater forhåndsvisning når bruker endrer bilde-URL manuelt
    const urlInput = card.querySelector('.slide-url-input');
    urlInput.addEventListener('change', () => {
      syncSlidesFromDom();
      renderSlidesList();
    });

    // Bildeopplasting til Supabase Storage ('media' bucket)
    const uploader = card.querySelector('.slide-thumb-uploader');
    const fileInput = card.querySelector('.slide-file-input');
    const removeBtn = card.querySelector('.thumb-remove-btn');

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        syncSlidesFromDom();
        currentSlides[index].url = '';
        renderSlidesList();
        autoSaver?.trigger(100);
        showToast('Bilde fjernet og lagret automatisk.', 'success');
      });
    }

    uploader.addEventListener('click', (e) => {
      if (e.target.closest('.thumb-remove-btn')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showToast('Bildet er for stort. Maks tillatt størrelse er 5 MB.', 'error');
        return;
      }

      uploader.classList.add('uploading');
      showToast('Laster opp bilde...', 'success');

      try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const cleanName = `slide-${slide.id || Date.now()}-${Date.now()}.${fileExt}`;
        const filePath = `forside/${cleanName}`;

        const { error: uploadErr } = await supabaseClient.storage
          .from('media')
          .upload(filePath, file, { upsert: true });

        if (uploadErr) {
          console.error('Storage upload error:', uploadErr);
          throw new Error('Kunne ikke laste opp til "media" bucket i Supabase Storage.');
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from('media')
          .getPublicUrl(filePath);

        syncSlidesFromDom();
        currentSlides[index].url = publicUrlData.publicUrl;
        renderSlidesList();
        autoSaver?.trigger(100);
        showToast('Bilde lastet opp og lagret automatisk! ✓', 'success');
      } catch (err) {
        console.error('Feil under bildeopplasting:', err);
        showToast(err.message || 'Feil ved opplasting av bilde.', 'error');
      } finally {
        uploader.classList.remove('uploading');
      }
    });

    // Slett bilde-rad
    card.querySelector('.delete-slide-btn').addEventListener('click', () => {
      syncSlidesFromDom();
      if (confirm(`Er du sikker på at du vil slette bilde nr. ${index + 1} fra karusellen?`)) {
        currentSlides.splice(index, 1);
        currentSlides.forEach((s, idx) => {
          s.sort_order = idx + 1;
        });
        renderSlidesList();
        autoSaver?.trigger(100);
      }
    });

    container.appendChild(card);
  });
}

function moveSlide(fromIndex, delta) {
  syncSlidesFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentSlides.length) return;

  const [movedItem] = currentSlides.splice(fromIndex, 1);
  currentSlides.splice(toIndex, 0, movedItem);

  currentSlides.forEach((s, idx) => {
    s.sort_order = idx + 1;
  });

  renderSlidesList();
  autoSaver?.trigger(250);
}

function addSlideRow() {
  syncSlidesFromDom();
  currentSlides.push({
    id: crypto.randomUUID(),
    url: '',
    caption: '',
    visible: true,
    sort_order: currentSlides.length + 1
  });
  renderSlidesList();
  autoSaver?.trigger(300);
}

function syncSlidesFromDom() {
  const cards = document.querySelectorAll('#slidesList .slide-item-card');
  cards.forEach((card, index) => {
    if (!currentSlides[index]) return;
    currentSlides[index].url = card.querySelector('.slide-url-input').value.trim();
    currentSlides[index].caption = card.querySelector('.slide-caption-input').value.trim();
    currentSlides[index].visible = card.querySelector('.slide-visible-input').checked;
    currentSlides[index].sort_order = index + 1;
  });
}

// ==============================================================================
// LAGRING AV ALLE ENDRINGER
// ==============================================================================

async function saveAll({ isAuto = false, triggerBtn = null } = {}) {
  if (triggerBtn) setButtonSaving(triggerBtn, true);

  syncSlidesFromDom();

  try {
    const introContent = {
      title: document.getElementById('introTitle').value.trim(),
      text: document.getElementById('introText').value.replace(/\r\n/g, '\n').trim(),
      button_label: document.getElementById('introBtnLabel').value.trim(),
      button_url: document.getElementById('introBtnUrl').value.trim() || 'bookoss.html'
    };

    const slideshowContent = {
      title: document.getElementById('slideshowTitle').value.trim(),
      subtitle: document.getElementById('slideshowSubtitle').value.trim(),
      items: currentSlides.map((s, idx) => ({
        id: s.id || crypto.randomUUID(),
        url: s.url,
        caption: s.caption,
        visible: s.visible !== false,
        sort_order: idx + 1
      }))
    };

    const updatedContactInfo = {
      ...(cachedContactInfo || DEFAULT_CONTACT_INFO),
      title: document.getElementById('contactTitle').value.trim(),
      subtitle: document.getElementById('contactSubtitle').value.trim()
    };

    const upserts = [
      supabaseClient.from('site_sections').upsert({
        key: 'forside.intro',
        page: 'forside',
        content: introContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'forside.slideshow',
        page: 'forside',
        content: slideshowContent
      }, { onConflict: 'key' }),
      supabaseClient.from('site_sections').upsert({
        key: 'kontakt_oss.kontaktinfo',
        page: 'kontakt_oss',
        content: updatedContactInfo
      }, { onConflict: 'key' })
    ];

    const results = await Promise.all(upserts);
    for (const res of results) {
      if (res.error) throw res.error;
    }

    cachedContactInfo = updatedContactInfo;
    if (triggerBtn) setButtonSaving(triggerBtn, false, 'Lagret ✓');
    if (!isAuto) {
      showToast('Endringene er lagret og publisert på nettsiden! ✓', 'success');
    }
  } catch (err) {
    console.error('Feil ved lagring av forside:', err);
    if (triggerBtn) setButtonSaving(triggerBtn, false, 'Feil ved lagring');
    if (!isAuto) {
      showToast(err.message || 'Kunne ikke lagre endringene.', 'error');
    }
    throw err;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

