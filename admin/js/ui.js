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
