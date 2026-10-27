// ==============================================================================
// OAMS CMS - Login Logic
// ==============================================================================

import { getSupabase } from '../../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const alertEl = document.getElementById('loginAlert');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('loginBtn');

  // Vis feilmelding fra URL hvis aktuelt
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'forbidden') {
    showAlert('Kontoen din er ikke registrert med administrator-rolle i OAMS-databasen.', 'error');
  }

  function showAlert(msg) {
    alertEl.textContent = msg;
    alertEl.style.display = 'block';
  }

  function hideAlert() {
    alertEl.style.display = 'none';
  }

  const supabase = await getSupabase();
  if (!supabase) {
    showAlert('Supabase er ikke konfigurert ennå. Vennligst legg inn dine API-nøkler i js/supabase-client.js.');
    submitBtn.disabled = true;
    return;
  }

  // Sjekk om brukeren allerede er innlogget
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert('Vennligst fyll ut både e-post og passord.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logger inn...';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showAlert('Feil e-postadresse eller passord.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Logg inn';
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
        showAlert('Innlogging godkjent, men denne kontoen har ikke ADMIN-rettigheter i systemet.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Logg inn';
        return;
      }

      // Vellykket innlogging - naviger til dashboard (eller opprinnelig forespurt side)
      const target = urlParams.get('redirect') || 'index.html';
      window.location.href = target;
    } catch (err) {
      console.error(err);
      showAlert('Det oppstod en uventet feil under innlogging. Prøv igjen.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Logg inn';
    }
  });
});
