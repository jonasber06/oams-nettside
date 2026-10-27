// ==============================================================================
// OAMS CMS - Login & Password Reset Logic
// ==============================================================================

import { getSupabase } from '../../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Visninger
  const loginView = document.getElementById('loginView');
  const forgotView = document.getElementById('forgotView');
  const resetView = document.getElementById('resetView');
  const alertEl = document.getElementById('loginAlert');

  // Skjemaer og knapper
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const toForgotBtn = document.getElementById('toForgotBtn');

  const forgotForm = document.getElementById('forgotForm');
  const forgotEmailInput = document.getElementById('forgotEmail');
  const forgotBtn = document.getElementById('forgotBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');

  const resetForm = document.getElementById('resetForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const resetBtn = document.getElementById('resetBtn');

  // Visningsbytte
  function showView(view) {
    hideAlert();
    loginView.style.display = view === 'login' ? 'block' : 'none';
    forgotView.style.display = view === 'forgot' ? 'block' : 'none';
    resetView.style.display = view === 'reset' ? 'block' : 'none';
  }

  function showAlert(msg, type = 'error') {
    alertEl.textContent = msg;
    alertEl.className = `login-alert ${type}`;
    alertEl.style.display = 'block';
  }

  function hideAlert() {
    alertEl.style.display = 'none';
  }

  // Navigasjon mellom visninger
  toForgotBtn?.addEventListener('click', () => {
    if (emailInput.value.trim()) {
      forgotEmailInput.value = emailInput.value.trim();
    }
    showView('forgot');
    forgotEmailInput.focus();
  });

  backToLoginBtn?.addEventListener('click', () => {
    showView('login');
    emailInput.focus();
  });

  // Håndter feilmelding fra URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'forbidden') {
    showAlert('Kontoen din er ikke registrert med administrator-rolle i OAMS-databasen.', 'error');
  }

  const supabase = await getSupabase();
  if (!supabase) {
    showAlert('Supabase er ikke konfigurert ennå. Vennligst legg inn dine API-nøkler i js/supabase-client.js.', 'error');
    loginBtn.disabled = true;
    return;
  }

  // Sjekk om siden ble åpnet via en tilbakestillingslenke for passord
  const isRecoveryHash = window.location.hash.includes('type=recovery');
  if (isRecoveryHash) {
    showView('reset');
    showAlert('Oppgi et nytt passord nedenfor for å fullføre tilbakestillingen.', 'info');
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      showView('reset');
      showAlert('Oppgi et nytt passord nedenfor for å fullføre tilbakestillingen.', 'info');
    }
  });

  // Sjekk om brukeren allerede er innlogget (hoppes over ved passord-tilbakestilling)
  if (!isRecoveryHash) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile && profile.role === 'ADMIN') {
        window.location.href = urlParams.get('redirect') || 'index.html';
        return;
      }
    }
  }

  // ============================================================================
  // 1. Vanlig innlogging
  // ============================================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert('Vennligst fyll ut både e-post og passord.', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logger inn...';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showAlert('Feil e-postadresse eller passord.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Logg inn';
        return;
      }

      // Sjekk ADMIN-rolle
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profError || !profile || profile.role !== 'ADMIN') {
        await supabase.auth.signOut();
        showAlert('Innlogging godkjent, men denne kontoen har ikke ADMIN-rettigheter i systemet.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Logg inn';
        return;
      }

      // Vellykket innlogging - naviger til dashboard (eller opprinnelig forespurt side)
      const target = urlParams.get('redirect') || 'index.html';
      window.location.href = target;
    } catch (err) {
      console.error(err);
      showAlert('Det oppstod en uventet feil under innlogging. Prøv igjen.', 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Logg inn';
    }
  });

  // ============================================================================
  // 2. Glemt passord: Sjekk at e-post finnes før lenke sendes
  // ============================================================================
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = forgotEmailInput.value.trim();
    if (!email) {
      showAlert('Vennligst oppgi en e-postadresse.', 'error');
      return;
    }

    forgotBtn.disabled = true;
    forgotBtn.textContent = 'Sjekker e-post...';

    try {
      // 1. Sjekk først om e-posten faktisk eksisterer som aktiv ADMIN i databasen
      let adminExists = false;
      const { data: existsData, error: rpcError } = await supabase.rpc('check_admin_email_exists', {
        email_input: email
      });

      if (rpcError) {
        console.warn('RPC check_admin_email_exists error:', rpcError);
        // Dersom funksjonen ikke er opprettet i databasen ennå
        if (rpcError.code === 'PGRST202' || rpcError.message?.includes('check_admin_email_exists')) {
          showAlert('Funksjonen for e-postsjekk er ikke aktivert i Supabase ennå. Vennligst kjør filen supabase/password_reset.sql i SQL Editor i Supabase.', 'error');
          forgotBtn.disabled = false;
          forgotBtn.textContent = 'Send tilbakestillingslenke';
          return;
        }
      } else {
        adminExists = Boolean(existsData);
      }

      // Dersom e-posten IKKE finnes i databasen: Ikke send noe, gi beskjed!
      if (!adminExists) {
        showAlert('Finner ingen administratorkonto registrert med denne e-postadressen.', 'error');
        forgotBtn.disabled = false;
        forgotBtn.textContent = 'Send tilbakestillingslenke';
        return;
      }

      // 2. E-posten finnes: Send password recovery link via Supabase Auth
      forgotBtn.textContent = 'Sender lenke...';
      const redirectUrl = window.location.origin + window.location.pathname;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (resetErr) {
        showAlert(resetErr.message || 'Kunne ikke sende tilbakestillingslenke. Vennligst prøv igjen.', 'error');
        forgotBtn.disabled = false;
        forgotBtn.textContent = 'Send tilbakestillingslenke';
        return;
      }

      showAlert(`En e-post med lenke for å tilbakestille passordet er sendt til ${email}! Sjekk innboksen din (og eventuelt søppelpost).`, 'success');
      forgotEmailInput.value = '';
      forgotBtn.disabled = false;
      forgotBtn.textContent = 'Send tilbakestillingslenke';

    } catch (err) {
      console.error('Password reset error:', err);
      showAlert('Det oppstod en uventet feil. Vennligst prøv igjen.', 'error');
      forgotBtn.disabled = false;
      forgotBtn.textContent = 'Send tilbakestillingslenke';
    }
  });

  // ============================================================================
  // 3. Oppdater nytt passord (når bruker har åpnet recovery-lenke fra e-post)
  // ============================================================================
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || newPassword.length < 6) {
      showAlert('Nytt passord må være på minst 6 tegn.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Passordene samsvarer ikke. Vennligst skriv dem inn på nytt.', 'error');
      return;
    }

    resetBtn.disabled = true;
    resetBtn.textContent = 'Oppdaterer passord...';

    try {
      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        showAlert(updateErr.message || 'Kunne ikke oppdatere passordet. Lenken kan være utløpt.', 'error');
        resetBtn.disabled = false;
        resetBtn.textContent = 'Oppdater passord';
        return;
      }

      showAlert('Passordet ditt er oppdatert! Du blir nå sendt videre...', 'success');

      // Tøm hash fra adressefeltet
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);

    } catch (err) {
      console.error('Update password error:', err);
      showAlert('En uventet feil oppstod under oppdatering av passord.', 'error');
      resetBtn.disabled = false;
      resetBtn.textContent = 'Oppdater passord';
    }
  });

});
