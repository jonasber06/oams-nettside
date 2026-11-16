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
