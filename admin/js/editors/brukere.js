// ==============================================================================
// OAMS CMS - Opprett og administrer admin-brukere (brukere.html)
// ==============================================================================

import { requireAdmin } from '../auth-guard.js';
import { showToast, setButtonSaving } from '../ui.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../js/supabase-client.js';

let supabaseClient = null;
let currentUserEmail = '';

// Opprett en separat, ikke-persistert Supabase-klient slik at signUp for en ny
// bruker aldri overskriver eller logger ut den nåværende administratorens sesjon.
function createEphemeralClient() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'oams-ephemeral-invite-auth'
    }
  });
}

async function initPage() {
  const auth = await requireAdmin();
  if (!auth) return;

  supabaseClient = auth.supabase;
  currentUserEmail = (auth.profile?.email || auth.user?.email || '').toLowerCase().trim();

  await loadAdmins();

  const form = document.getElementById('inviteAdminForm');
  form.addEventListener('submit', handleInviteSubmit);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}

let feedbackTimeoutId = null;

function showFeedback(message, type = 'success') {
  const box = document.getElementById('inviteFeedback');
  if (!box) return;

  if (feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  }

  box.style.display = 'block';
  if (type === 'error') {
    box.style.background = '#fef2f2';
    box.style.border = '1px solid #fecaca';
    box.style.color = '#991b1b';
  } else {
    box.style.background = '#f0fdf4';
    box.style.border = '1px solid #bbf7d0';
    box.style.color = '#166534';
  }
  box.textContent = message;

  feedbackTimeoutId = setTimeout(() => {
    box.style.display = 'none';
    feedbackTimeoutId = null;
  }, 5000);
}

async function handleInviteSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newAdminEmail');
  const inviteBtn = document.getElementById('inviteBtn');
  const email = (emailInput.value || '').trim().toLowerCase();

  if (!email) return;

  setButtonSaving(inviteBtn, true);
  const feedbackBox = document.getElementById('inviteFeedback');
  if (feedbackBox) feedbackBox.style.display = 'none';

  try {
    // 1. Opprett brukeren direkte i auth.users + public.profiles (med ADMIN-rolle) via sikker RPC-funksjon.
    // Dette fungerer selv når offentlig "Allow new users to sign up" er skrudd AV i Supabase!
    const { error: rpcErr } = await supabaseClient.rpc('admin_authorize_user', {
      target_email: email
    });

    if (rpcErr) {
      console.error('RPC admin_authorize_user error:', rpcErr);
      if (rpcErr.code === 'PGRST202' || rpcErr.message?.includes('admin_authorize_user')) {
        throw new Error('Databasefunksjonen er ikke aktivert ennå. Kjør skriptet "supabase/add_admin_invites.sql" i Supabase SQL Editor først!');
      }
      throw rpcErr;
    }

    // 2. Send e-post med lenke for å velge passord (resetPasswordForEmail fungerer alltid for eksisterende brukere)
    const setupRedirectUrl = `${window.location.origin}/admin/login.html?setup=1`;
    const { error: resetErr } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: setupRedirectUrl
    });

    if (resetErr) {
      throw resetErr;
    }

    emailInput.value = '';
    showFeedback(
      `Kontoen ${email} er opprettet med ADMIN-tilgang! Det er nå sendt en e-post til ${email} med lenke for å velge eget passord og logge inn på /admin/.`,
      'success'
    );
    showToast(`E-post med passordlenke sendt til ${email}!`, 'success');

    await loadAdmins();

  } catch (err) {
    console.error('Feil ved opprettelse av ny admin:', err);
    showFeedback(err.message || 'Kunne ikke sende invitasjon. Sjekk konsollen.', 'error');
    showToast(err.message || 'Feil ved opprettelse av bruker', 'error');
  } finally {
    setButtonSaving(inviteBtn, false, 'Send invitasjon på e-post');
  }
}

async function loadAdmins() {
  const container = document.getElementById('adminsList');
  if (!container) return;

  try {
    const [profilesRes, invitesRes] = await Promise.all([
      supabaseClient.from('profiles').select('id, email, role, created_at').eq('role', 'ADMIN').order('created_at', { ascending: true }),
      supabaseClient.from('admin_invites').select('email, created_at').order('created_at', { ascending: false })
    ]);

    const activeAdmins = profilesRes.data || [];
    const activeEmails = new Set(activeAdmins.map(a => (a.email || '').toLowerCase().trim()));

    // Ventende invitasjoner som ennå ikke er opprettet i profiles med ADMIN
    const pendingInvites = (invitesRes.data || []).filter(
      inv => !activeEmails.has((inv.email || '').toLowerCase().trim())
    );

    container.innerHTML = '';

    if (activeAdmins.length === 0 && pendingInvites.length === 0) {
      container.innerHTML = '<div style="color: var(--admin-text-muted); padding: 12px;">Ingen administratorer funnet.</div>';
      return;
    }

    activeAdmins.forEach(admin => {
      const email = (admin.email || '').trim();
      const isSelf = email.toLowerCase() === currentUserEmail;

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #f8fafc; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); padding: 14px 16px;';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; text-transform: uppercase;">
            Aktiv Admin
          </span>
          <strong style="font-size: 0.95rem;">${escapeHtml(email)}</strong>
          ${isSelf ? '<span style="color: var(--admin-text-muted); font-size: 0.8rem;">(Deg)</span>' : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn-admin btn-admin-secondary resend-pass-btn" style="padding: 6px 12px; font-size: 0.78rem;">
            Send ny passordlenke
          </button>
          ${!isSelf ? `
            <button type="button" class="btn-admin btn-admin-danger revoke-admin-btn" style="padding: 6px 12px; font-size: 0.78rem;">
              Slett bruker
            </button>
          ` : ''}
        </div>
      `;

      row.querySelector('.resend-pass-btn')?.addEventListener('click', () => sendPasswordLink(email));
      row.querySelector('.revoke-admin-btn')?.addEventListener('click', () => revokeAdmin(email));

      container.appendChild(row);
    });

    pendingInvites.forEach(inv => {
      const email = (inv.email || '').trim();

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 14px 16px;';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #fef3c7; color: #92400e; font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; text-transform: uppercase;">
            Invitert
          </span>
          <strong style="font-size: 0.95rem;">${escapeHtml(email)}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn-admin btn-admin-danger revoke-admin-btn" style="padding: 6px 12px; font-size: 0.78rem;">
            Trekk tilbake
          </button>
        </div>
      `;

      row.querySelector('.revoke-admin-btn')?.addEventListener('click', () => revokeAdmin(email));

      container.appendChild(row);
    });

  } catch (err) {
    console.error('Feil ved lasting av administratorer:', err);
  }
}

async function sendPasswordLink(email) {
  try {
    const setupRedirectUrl = `${window.location.origin}/admin/login.html?setup=1`;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: setupRedirectUrl
    });
    if (error) throw error;
    showToast(`Ny passordlenke ble sendt til ${email}!`, 'success');
  } catch (err) {
    console.error('Feil ved utsending av passordlenke:', err);
    showToast(err.message || 'Kunne ikke sende passordlenke.', 'error');
  }
}

async function revokeAdmin(email) {
  if (!confirm(`Er du sikker på at du vil slette brukeren ${email} helt fra systemet?`)) return;

  try {
    const { error } = await supabaseClient.rpc('admin_revoke_user', {
      target_email: email
    });
    if (error) throw error;

    showToast(`Brukeren ${email} ble slettet fra systemet.`, 'success');
    await loadAdmins();
  } catch (err) {
    console.error('Feil ved sletting av bruker:', err);
    showToast(err.message || 'Kunne ikke slette bruker.', 'error');
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

