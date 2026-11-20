// ==============================================================================
// OAMS CMS - Admin UI Helpers
// ==============================================================================

export function showToast(message, type = 'success') {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `admin-toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

export function setButtonSaving(button, isSaving, successMessage = 'Lagret ✓') {
  if (!button) return;

  if (isSaving) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
      <svg style="animation: spin 1s linear infinite; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      Lagrer...
    `;
  } else {
    button.innerHTML = successMessage;
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || 'Lagre endringer';
    }, 2000);
  }
}

/**
 * Oppretter en automatisk lagringskontroller (Auto-Save) for et admin-skjema.
 *
 * @param {Object} options
 * @param {HTMLFormElement} options.form - Skjemaelementet som skal overvåkes
 * @param {Function} options.onSave - Async funksjon `({ isAuto, triggerBtn }) => Promise<void>` som utfører selve lagringen
 * @param {number} [options.debounceMs=1000] - Forsinkelse i ms etter siste tastetrykk før autolagring kjører
 */
export function createAutoSaver({ form, onSave, debounceMs = 1000 }) {
  let timer = null;
  let isSaving = false;
  let hasPendingChanges = false;
  let queuedAfterSave = false;

  // Opprett status-indikator i .admin-actions hvis den ikke finnes fra før
  let statusEl = document.getElementById('autosaveStatus');
  if (!statusEl) {
    const actionsEl = document.querySelector('.admin-actions');
    if (actionsEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'autosaveStatus';
      statusEl.className = 'autosave-status is-saved';
      statusEl.setAttribute('aria-live', 'polite');
      statusEl.innerHTML = `
        <span class="autosave-dot"></span>
        <span class="autosave-text">Automatisk lagring aktiv</span>
      `;
      actionsEl.insertBefore(statusEl, actionsEl.firstChild);
    }
  }

  function setStatus(state, message, tooltip = '') {
    if (!statusEl) return;
    statusEl.className = `autosave-status is-${state}`;
    statusEl.title = tooltip;
    const textEl = statusEl.querySelector('.autosave-text');
    if (textEl) textEl.textContent = message;
  }

  function formatTimeNow() {
    const now = new Date();
    return now.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  async function executeSave({ isAuto = true, triggerBtn = null } = {}) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (isSaving) {
      queuedAfterSave = true;
      return;
    }

    isSaving = true;
    hasPendingChanges = false;
    queuedAfterSave = false;

    setStatus('saving', isAuto ? 'Lagrer automatisk...' : 'Lagrer...');

    try {
      await onSave({ isAuto, triggerBtn });

      if (queuedAfterSave || hasPendingChanges) {
        setStatus('dirty', 'Ulagrede endringer...');
      } else {
        setStatus('saved', `Lagret kl. ${formatTimeNow()} ✓`);
      }
    } catch (err) {
      const msg = err?.message || 'Kunne ikke lagre endringer';
      setStatus('error', msg.length > 38 ? 'Kunne ikke autolagre' : msg, msg);
    } finally {
      isSaving = false;
      if (queuedAfterSave) {
        queuedAfterSave = false;
        scheduleSave(400);
      }
    }
  }

  function scheduleSave(delay = debounceMs) {
    hasPendingChanges = true;
    if (!isSaving) {
      setStatus('dirty', 'Ulagrede endringer...');
    } else {
      queuedAfterSave = true;
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      executeSave({ isAuto: true });
    }, delay);
  }

  if (form) {
    // Tekstinput (skriving) -> vanlig debounce (f.eks. 1000ms)
    form.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || target.type === 'file') return;
      scheduleSave(debounceMs);
    });

    // Sjekkbokser og nedtrekksmenyer -> raskere respons (350ms)
    form.addEventListener('change', (e) => {
      const target = e.target;
      if (!target || target.type === 'file') return;
      if (target.type === 'checkbox' || target.tagName === 'SELECT' || target.type === 'radio') {
        scheduleSave(350);
      }
    });

    // Aktiver støtte for **fet tekst** (B Fet-knapp, Cmd/Ctrl+B og forhåndsvisning) på alle tekstfelt
    initBoldFormatting(form);
  }

  // Hurtigtast Cmd+S / Ctrl+S for umiddelbar lagring
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const topBtn = document.getElementById('saveTopBtn');
      executeSave({ isAuto: false, triggerBtn: topBtn });
    }
  });

  // Lagre umiddelbart hvis brukeren bytter fane mens det finnes ventende endringer
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && hasPendingChanges && !isSaving) {
      executeSave({ isAuto: true });
    }
  });

  // Varsle kun dersom brukeren lukker fanen midt i en pågående lagring eller før debounce har kjørt
  window.addEventListener('beforeunload', (e) => {
    if (hasPendingChanges || isSaving) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  return {
    /** Planlegg en automatisk lagring (f.eks. etter flytting, sletting eller opplasting) */
    trigger(delay = 300) {
      scheduleSave(delay);
    },
    /** Utfør lagring umiddelbart (f.eks. ved klikk på Lagre-knapp) */
    saveNow(triggerBtn = null) {
      return executeSave({ isAuto: false, triggerBtn });
    }
  };
}

// ==============================================================================
// Global støtte for **fet skrift** i alle tekstfelt i admin-panelet
// ==============================================================================

function isBoldEligibleField(el) {
  if (!el) return false;
  if (el.readOnly || el.disabled) return false;
  if (el.dataset && el.dataset.noBold === 'true') return false;

  const tag = el.tagName;
  if (tag !== 'TEXTAREA' && tag !== 'INPUT') return false;
  if (tag === 'INPUT') {
    const type = (el.type || 'text').toLowerCase();
    if (type !== 'text') return false;
  }

  const meta = `${el.id || ''} ${el.name || ''} ${el.className || ''} ${el.placeholder || ''}`;
  if (/\b(url|link|href|email|e-post|epost|slug)\b|url$|link$|email$|https?:\/\//i.test(meta)) {
    return false;
  }
  return true;
}

export function applyBoldToField(field) {
  if (!field) return;
  const start = field.selectionStart ?? 0;
  const end = field.selectionEnd ?? 0;
  const value = field.value;
  const selected = value.slice(start, end);

  if (selected) {
    const replacement = (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4)
      ? selected.slice(2, -2)
      : `**${selected}**`;
    field.value = value.slice(0, start) + replacement + value.slice(end);
    field.focus();
    field.setSelectionRange(start, start + replacement.length);
  } else {
    const placeholder = '**fet tekst**';
    field.value = value.slice(0, start) + placeholder + value.slice(end);
    field.focus();
    field.setSelectionRange(start + 2, start + placeholder.length - 2);
  }

  field.dispatchEvent(new Event('input', { bubbles: true }));
}

function renderInlineBoldPreview(el, rawText) {
  el.textContent = '';
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n');
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) el.appendChild(document.createElement('br'));
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part) => {
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

function syncFieldBoldPreview(field) {
  if (!isBoldEligibleField(field)) return;
  // Ikke legg til duplikat forhåndsvisning hvis feltet allerede har egen forhåndsvisning
  if (field.closest('.practical-item-card')) return;

  const hasBold = /\*\*[^*]+\*\*/.test(field.value || '');
  let preview = field.nextElementSibling;
  const isExistingPreview = preview && preview.classList.contains('admin-bold-preview');

  if (!hasBold) {
    if (isExistingPreview) preview.remove();
    return;
  }

  if (!isExistingPreview) {
    preview = document.createElement('div');
    preview.className = 'admin-bold-preview';
    preview.innerHTML = '<span class="admin-bold-preview-label">Forhåndsvisning:</span><span class="admin-bold-preview-content"></span>';
    field.insertAdjacentElement('afterend', preview);
  }

  renderInlineBoldPreview(preview.querySelector('.admin-bold-preview-content'), field.value);
}

function initBoldFormatting(form) {
  if (!form || form.dataset.boldFormattingInit === 'true') return;
  form.dataset.boldFormattingInit = 'true';

  let activeField = null;

  // Flytende «B Fet»-knapp som dukker opp øverst til høyre for aktivt tekstfelt
  let floatBtn = document.getElementById('adminBoldFloatBtn');
  if (!floatBtn) {
    floatBtn = document.createElement('button');
    floatBtn.id = 'adminBoldFloatBtn';
    floatBtn.type = 'button';
    floatBtn.className = 'admin-bold-float-btn';
    floatBtn.title = 'Gjør markert tekst fet (**tekst**) – hurtigtast Cmd/Ctrl+B';
    floatBtn.innerHTML = '<strong>B</strong> Fet';
    floatBtn.hidden = true;
    document.body.appendChild(floatBtn);
  }

  function positionFloatBtn() {
    if (!activeField || !document.body.contains(activeField)) {
      floatBtn.hidden = true;
      return;
    }
    const rect = activeField.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      floatBtn.hidden = true;
      return;
    }
    floatBtn.hidden = false;
    const btnWidth = floatBtn.offsetWidth || 62;
    const top = Math.max(8, rect.top + window.scrollY - 30);
    const left = Math.max(8, rect.right + window.scrollX - btnWidth);
    floatBtn.style.top = `${top}px`;
    floatBtn.style.left = `${left}px`;
  }

  floatBtn.addEventListener('mousedown', (e) => {
    // Hindre at tekstmarkeringen i feltet mistes når brukeren trykker på knappen
    e.preventDefault();
    if (activeField) {
      applyBoldToField(activeField);
      syncFieldBoldPreview(activeField);
      positionFloatBtn();
    }
  });

  form.addEventListener('focusin', (e) => {
    const target = e.target;
    if (isBoldEligibleField(target) && !target.closest('.practical-item-card')) {
      activeField = target;
      syncFieldBoldPreview(target);
      positionFloatBtn();
    } else {
      activeField = null;
      floatBtn.hidden = true;
    }
  });

  form.addEventListener('focusout', () => {
    setTimeout(() => {
      if (document.activeElement !== activeField && document.activeElement !== floatBtn) {
        activeField = null;
        floatBtn.hidden = true;
      }
    }, 0);
  });

  form.addEventListener('input', (e) => {
    if (isBoldEligibleField(e.target)) {
      syncFieldBoldPreview(e.target);
      if (e.target === activeField) positionFloatBtn();
    }
  });

  // Hurtigtast Cmd+B / Ctrl+B i alle tekstfelt
  form.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'b') {
      if (isBoldEligibleField(e.target)) {
        e.preventDefault();
        applyBoldToField(e.target);
        syncFieldBoldPreview(e.target);
      }
    }
  });

  window.addEventListener('scroll', positionFloatBtn, { passive: true });
  window.addEventListener('resize', positionFloatBtn, { passive: true });

  // Vis forhåndsvisning for felt som allerede har **fet tekst** ved lasting
  const refreshAllPreviews = () => {
    form.querySelectorAll('input[type="text"], textarea').forEach(syncFieldBoldPreview);
  };
  setTimeout(refreshAllPreviews, 300);
}
