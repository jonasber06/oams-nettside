// ==============================================================================
// OAMS CMS - Editor for om_oss.html
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving } from '../ui.js';

let supabaseClient = null;
let currentRoles = [];
let currentDocs = [];
let deletedRoleIds = [];
let deletedDocIds = [];

async function initEditor() {
  const auth = await requireAdmin();
  if (!auth) return;

  supabaseClient = auth.supabase;

  // Last data fra databasen
  await loadContent();

  // Hendelseslyttere
  document.getElementById('addRoleBtn').addEventListener('click', addRoleRow);
  document.getElementById('addDocBtn').addEventListener('click', addDocRow);

  const form = document.getElementById('omOssForm');
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
    const [sectionsRes, rolesRes, docsRes] = await Promise.all([
      supabaseClient.from('site_sections').select('key, content').eq('page', 'om_oss'),
      supabaseClient.from('board_roles').select('*').order('sort_order', { ascending: true }),
      supabaseClient.from('documents').select('*').order('sort_order', { ascending: true })
    ]);

    // 1. Seksjoner
    if (sectionsRes.data) {
      const map = new Map(sectionsRes.data.map(s => [s.key, s.content]));

      const hero = map.get('om_oss.hero') || {};
      document.getElementById('heroSubheading').value = hero.subheading || '';
      document.getElementById('heroTitle').value = hero.title || '';

      const hvem = map.get('om_oss.hvem_er_vi') || {};
      document.getElementById('aboutTitle').value = hvem.title || '';
      document.getElementById('aboutLead').value = hvem.lead || '';
      const p = Array.isArray(hvem.paragraphs) ? hvem.paragraphs : [];
      document.getElementById('aboutParagraph1').value = p[0] || '';
      document.getElementById('aboutParagraph2').value = p[1] || '';
    }

    // 2. Roller
    currentRoles = (rolesRes.data || []).map(r => ({
      ...r,
      id: r.id || crypto.randomUUID()
    }));
    renderRolesList();

    // 3. Dokumenter
    currentDocs = (docsRes.data || []).map(d => ({
      ...d,
      id: d.id || crypto.randomUUID()
    }));
    renderDocsList();

  } catch (err) {
    console.error('Feil ved lasting av innhold:', err);
    showToast('Kunne ikke hente innhold fra databasen.', 'error');
  }
}

// Synkroniserer det brukeren har skrevet i skjemaet tilbake til currentRoles
function syncRolesFromDom() {
  const rows = document.querySelectorAll('#rolesList .admin-item-row');
  rows.forEach((row) => {
    const idx = parseInt(row.dataset.index, 10);
    if (currentRoles[idx]) {
      currentRoles[idx].title = row.querySelector('.role-title-input')?.value.trim() || '';
      currentRoles[idx].member_name = row.querySelector('.role-name-input')?.value.trim() || '';
      currentRoles[idx].email = row.querySelector('.role-email-input')?.value.trim() || '';
      currentRoles[idx].visible = row.querySelector('.role-visible-input')?.checked ?? true;
    }
  });
}

let draggedRoleIndex = null;

function renderRolesList() {
  const container = document.getElementById('rolesList');
  container.innerHTML = '';

  if (currentRoles.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen verv lagt inn ennå. Trykk "+ Legg til verv" over.</div>';
    return;
  }

  currentRoles.forEach((role, index) => {
    // Sørg for at vervet alltid har en gyldig UUID
    if (!role.id) role.id = crypto.randomUUID();

    const row = document.createElement('div');
    row.className = 'admin-item-row has-avatar';
    row.dataset.index = index;
    row.setAttribute('draggable', 'true');

    const hasImage = Boolean(role.image_url && role.image_url.trim());

    row.innerHTML = `
      <!-- Rekkefølge med Opp/Ned-knapper -->
      <div class="role-reorder-wrap">
        <button type="button" class="btn-reorder btn-move-up" title="Flytt opp" ${index === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <span class="role-index-num">${index + 1}</span>
        <button type="button" class="btn-reorder btn-move-down" title="Flytt ned" ${index === currentRoles.length - 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>

      <!-- Avatar uploader -->
      <div class="role-avatar-uploader" title="${hasImage ? 'Klikk for å bytte bilde' : 'Klikk for å laste opp bilde'}">
        ${hasImage ? `
          <img src="${escapeHtml(role.image_url)}" alt="Bilde">
          <button type="button" class="avatar-remove-btn" title="Fjern bilde">&times;</button>
        ` : `
          <svg class="avatar-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        `}
        <input type="file" class="role-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;">
      </div>

      <input type="text" class="form-control role-title-input" placeholder="Tittel (f.eks. Leder)" value="${escapeHtml(role.title || '')}" required>
      <input type="text" class="form-control role-name-input" placeholder="Navn" value="${escapeHtml(role.member_name || '')}">
      <input type="email" class="form-control role-email-input" placeholder="navn@oams.no" value="${escapeHtml(role.email || '')}" required>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; margin: 0; cursor: pointer;">
        <input type="checkbox" class="role-visible-input" ${role.visible !== false ? 'checked' : ''}> Synlig
      </label>
      <button type="button" class="btn-admin btn-admin-danger delete-role-btn" style="padding: 6px 10px; font-size: 0.75rem;" title="Slett verv">
        &times;
      </button>
    `;

    // Opp/Ned-knapper
    row.querySelector('.btn-move-up')?.addEventListener('click', (e) => {
      e.preventDefault();
      moveRole(index, -1);
    });

    row.querySelector('.btn-move-down')?.addEventListener('click', (e) => {
      e.preventDefault();
      moveRole(index, 1);
    });

    // Drag & Drop
    row.addEventListener('dragstart', (e) => {
      syncRolesFromDom();
      draggedRoleIndex = index;
      row.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('is-dragging');
      document.querySelectorAll('#rolesList .admin-item-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = row.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      if (offset < rect.height / 2) {
        row.classList.add('drag-over-top');
        row.classList.remove('drag-over-bottom');
      } else {
        row.classList.add('drag-over-bottom');
        row.classList.remove('drag-over-top');
      }
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drag-over-top', 'drag-over-bottom');
      if (draggedRoleIndex === null || draggedRoleIndex === index) return;

      const rect = row.getBoundingClientRect();
      const dropTop = (e.clientY - rect.top) < rect.height / 2;
      let targetIndex = dropTop ? index : index + 1;
      if (draggedRoleIndex < targetIndex) targetIndex--;

      const [movedItem] = currentRoles.splice(draggedRoleIndex, 1);
      currentRoles.splice(targetIndex, 0, movedItem);

      currentRoles.forEach((r, idx) => {
        r.sort_order = idx + 1;
      });

      draggedRoleIndex = null;
      renderRolesList();
    });

    // Sletting
    row.querySelector('.delete-role-btn').addEventListener('click', () => {
      syncRolesFromDom();
      if (confirm(`Er du sikker på at du vil fjerne vervet "${role.title || 'Uten navn'}"?`)) {
        if (role.id) deletedRoleIds.push(role.id);
        currentRoles.splice(index, 1);
        renderRolesList();
      }
    });

    // Bilde-håndtering
    const uploader = row.querySelector('.role-avatar-uploader');
    const fileInput = row.querySelector('.role-file-input');
    const removeBtn = row.querySelector('.avatar-remove-btn');

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        syncRolesFromDom();
        role.image_url = null;
        renderRolesList();
        showToast('Bilde fjernet fra vervet. Husk å lagre endringene.', 'success');
      });
    }

    uploader.addEventListener('click', (e) => {
      if (e.target.closest('.avatar-remove-btn')) return;
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
        const cleanName = `${role.id}-${Date.now()}.${fileExt}`;
        const filePath = `styret/${cleanName}`;

        const { error: uploadErr } = await supabaseClient.storage
          .from('media')
          .upload(filePath, file, { upsert: true });

        if (uploadErr) {
          console.error('Storage upload error:', uploadErr);
          throw new Error('Kunne ikke laste opp til "media" bucket. Sjekk at supabase/add_board_images.sql er kjørt i Supabase SQL Editor.');
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from('media')
          .getPublicUrl(filePath);

        syncRolesFromDom();
        role.image_url = publicUrlData.publicUrl;
        renderRolesList();
        showToast(`Bilde lastet opp for ${role.title || 'vervet'}! Husk å lagre alle endringer.`, 'success');
      } catch (err) {
        console.error('Feil under bildeopplasting:', err);
        showToast(err.message || 'Feil ved opplasting av bilde.', 'error');
      } finally {
        uploader.classList.remove('uploading');
      }
    });

    container.appendChild(row);
  });
}

function moveRole(fromIndex, delta) {
  syncRolesFromDom();
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= currentRoles.length) return;

  const [movedItem] = currentRoles.splice(fromIndex, 1);
  currentRoles.splice(toIndex, 0, movedItem);

  currentRoles.forEach((role, idx) => {
    role.sort_order = idx + 1;
  });

  renderRolesList();
}

function addRoleRow() {
  syncRolesFromDom();
  currentRoles.push({
    id: crypto.randomUUID(), // Alltid generer en gyldig UUID så id aldri er null
    title: '',
    member_name: '',
    email: 'post@oams.no',
    image_url: null,
    visible: true,
    sort_order: currentRoles.length + 1
  });
  renderRolesList();
}

// Synkroniserer det brukeren har skrevet i dokumentfeltene
function syncDocsFromDom() {
  const cards = document.querySelectorAll('#docsList > div');
  cards.forEach((card, idx) => {
    if (currentDocs[idx]) {
      currentDocs[idx].title = card.querySelector('.doc-title-input')?.value.trim() || '';
      currentDocs[idx].button_label = card.querySelector('.doc-btn-label-input')?.value.trim() || '';
      currentDocs[idx].description = card.querySelector('.doc-desc-input')?.value.trim() || '';
      currentDocs[idx].url = card.querySelector('.doc-url-input')?.value.trim() || '';
      currentDocs[idx].icon = card.querySelector('.doc-icon-input')?.value || 'file';
      currentDocs[idx].visible = card.querySelector('.doc-visible-input')?.checked ?? true;
    }
  });
}

function renderDocsList() {
  const container = document.getElementById('docsList');
  container.innerHTML = '';

  if (currentDocs.length === 0) {
    container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen dokumenter lagt inn ennå.</div>';
    return;
  }

  currentDocs.forEach((doc, index) => {
    if (!doc.id) doc.id = crypto.randomUUID();

    const card = document.createElement('div');
    card.style.cssText = 'background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <strong style="font-size: 0.9rem;">Dokument ${index + 1}</strong>
        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; margin: 0; cursor: pointer;">
            <input type="checkbox" class="doc-visible-input" ${doc.visible !== false ? 'checked' : ''}> Synlig på nettsiden
          </label>
          <button type="button" class="btn-admin btn-admin-danger delete-doc-btn" style="padding: 4px 8px; font-size: 0.75rem;">
            Slett
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tittel</label>
          <input type="text" class="form-control doc-title-input" value="${escapeHtml(doc.title || '')}" required>
        </div>
        <div class="form-group">
          <label>Knappetekst (uten pil)</label>
          <input type="text" class="form-control doc-btn-label-input" value="${escapeHtml(doc.button_label || '')}" required>
        </div>
      </div>

      <div class="form-group">
        <label>Beskrivelse</label>
        <input type="text" class="form-control doc-desc-input" value="${escapeHtml(doc.description || '')}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>URL (lenke til Google Doc/Drive)</label>
          <input type="url" class="form-control doc-url-input" value="${escapeHtml(doc.url || '')}" placeholder="https://..." required>
        </div>
        <div class="form-group">
          <label>Ikon</label>
          <select class="form-control doc-icon-input">
            <option value="doc" ${doc.icon === 'doc' ? 'selected' : ''}>Dokument (papirark)</option>
            <option value="book" ${doc.icon === 'book' ? 'selected' : ''}>Vedtekter (bok)</option>
            <option value="folder" ${doc.icon === 'folder' ? 'selected' : ''}>Mappe (referater)</option>
            <option value="scale" ${doc.icon === 'scale' ? 'selected' : ''}>Økonomi (skålvekt)</option>
            <option value="file" ${doc.icon === 'file' ? 'selected' : ''}>Generell fil</option>
          </select>
        </div>
      </div>
    `;

    card.querySelector('.delete-doc-btn').addEventListener('click', () => {
      syncDocsFromDom();
      if (confirm(`Er du sikker på at du vil fjerne "${doc.title || 'Dette dokumentet'}"?`)) {
        if (doc.id) deletedDocIds.push(doc.id);
        currentDocs.splice(index, 1);
        renderDocsList();
      }
    });

    container.appendChild(card);
  });
}

function addDocRow() {
  syncDocsFromDom();
  currentDocs.push({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    button_label: '',
    url: 'https://',
    icon: 'doc',
    visible: true,
    sort_order: currentDocs.length + 1
  });
  renderDocsList();
}

async function saveAll(e, triggerBtn) {
  if (e) e.preventDefault();
  setButtonSaving(triggerBtn, true);

  // Synkroniser alle felter fra DOM-en
  syncRolesFromDom();
  syncDocsFromDom();

  try {
    // 1. Samle og lagre seksjoner
    const heroContent = {
      subheading: document.getElementById('heroSubheading').value.trim(),
      title: document.getElementById('heroTitle').value.trim()
    };

    const paragraphs = [];
    const p1 = document.getElementById('aboutParagraph1').value.trim();
    const p2 = document.getElementById('aboutParagraph2').value.trim();
    if (p1) paragraphs.push(p1);
    if (p2) paragraphs.push(p2);

    const hvemContent = {
      title: document.getElementById('aboutTitle').value.trim(),
      lead: document.getElementById('aboutLead').value.trim(),
      paragraphs
    };

    const sectionUpserts = [
      supabaseClient.from('site_sections').upsert({
        key: 'om_oss.hero',
        page: 'om_oss',
        content: heroContent
      }),
      supabaseClient.from('site_sections').upsert({
        key: 'om_oss.hvem_er_vi',
        page: 'om_oss',
        content: hvemContent
      })
    ];

    await Promise.all(sectionUpserts);

    // 2. Slett fjernede roller
    if (deletedRoleIds.length > 0) {
      const { error: delRolesErr } = await supabaseClient
        .from('board_roles')
        .delete()
        .in('id', deletedRoleIds);

      if (delRolesErr) {
        console.error('Feil ved sletting av roller:', delRolesErr);
        throw delRolesErr;
      }
      deletedRoleIds = [];
    }

    // 3. Lagre gjenværende roller (hver rad har garantert en gyldig UUID)
    const rolesToUpsert = currentRoles.map((role, idx) => {
      const roleId = (role.id && role.id.length > 10) ? role.id : crypto.randomUUID();
      role.id = roleId;

      const payload = {
        id: roleId,
        title: role.title,
        member_name: role.member_name ? role.member_name.trim() : null,
        email: role.email ? role.email.trim() : 'post@oams.no',
        visible: role.visible !== false,
        sort_order: idx + 1
      };

      if (role.image_url !== undefined) {
        payload.image_url = role.image_url && role.image_url.trim() !== '' ? role.image_url.trim() : null;
      }

      return payload;
    });

    if (rolesToUpsert.length > 0) {
      const { error: rolesErr } = await supabaseClient
        .from('board_roles')
        .upsert(rolesToUpsert, { onConflict: 'id' });

      if (rolesErr) {
        console.error('Feil ved lagring av roller:', rolesErr);
        if (rolesErr.message && rolesErr.message.includes('image_url')) {
          throw new Error("Databasen mangler kolonnen 'image_url'. Kjør skriptet 'supabase/add_board_images.sql' i Supabase SQL Editor!");
        }
        throw rolesErr;
      }
    }

    // 4. Slett fjernede dokumenter
    if (deletedDocIds.length > 0) {
      const { error: delDocsErr } = await supabaseClient
        .from('documents')
        .delete()
        .in('id', deletedDocIds);

      if (delDocsErr) {
        console.error('Feil ved sletting av dokumenter:', delDocsErr);
        throw delDocsErr;
      }
      deletedDocIds = [];
    }

    // 5. Lagre dokumenter
    const docsToUpsert = currentDocs.map((doc, idx) => {
      const docId = (doc.id && doc.id.length > 10) ? doc.id : crypto.randomUUID();
      doc.id = docId;

      return {
        id: docId,
        title: doc.title,
        description: doc.description || '',
        button_label: doc.button_label,
        url: doc.url,
        icon: doc.icon || 'file',
        visible: doc.visible !== false,
        sort_order: idx + 1
      };
    });

    if (docsToUpsert.length > 0) {
      const { error: docsErr } = await supabaseClient
        .from('documents')
        .upsert(docsToUpsert, { onConflict: 'id' });

      if (docsErr) {
        console.error('Feil ved lagring av dokumenter:', docsErr);
        throw docsErr;
      }
    }

    setButtonSaving(triggerBtn, false, 'Lagret ✓');
    showToast('Endringene er lagret og publisert på nettsiden! ✓', 'success');

    // Last inn ferske data
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
