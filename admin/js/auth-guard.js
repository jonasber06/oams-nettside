// ==============================================================================
// OAMS CMS - Auth Guard
// Kjøres automatisk på alle beskyttede /admin/*-sider.
// Avviser uautentiserte eller ikke-admins og sender dem til login.html.
// ==============================================================================

import { getSupabase } from '../../js/supabase-client.js';

export async function requireAdmin() {
  document.body.classList.add('auth-pending');

  try {
    const supabase = await getSupabase();
    if (!supabase) {
      window.location.href = 'login.html';
      return null;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}`;
      return null;
    }

    // Sjekk om brukeren har ADMIN-rolle i profiles-tabellen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      console.warn('OAMS CMS: Bruker mangler ADMIN-rolle:', session.user.email);
      await supabase.auth.signOut();
      window.location.href = 'login.html?error=forbidden';
      return null;
    }

    // Vis siden når sjekk er godkjent
    document.body.classList.remove('auth-pending');

    // Vis den innloggede administratorens faktiske e-post
    const emailEl = document.getElementById('adminUserEmail');
    if (emailEl) {
      emailEl.textContent = profile.email || session.user.email;
    }

    // Funksjonell Logg ut-knapp
    setupLogout(supabase);

    return { supabase, user: session.user, profile };
  } catch (err) {
    console.error('Auth guard feil:', err);
    window.location.href = 'login.html';
    return null;
  }
}

function setupLogout(supabase) {
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    // Fjern eventuelle tidligere lyttere
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);

    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      newBtn.disabled = true;
      newBtn.style.opacity = '0.6';
      newBtn.textContent = 'Logger ut...';

      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Feil under Supabase signOut:', err);
      } finally {
        window.location.href = 'login.html';
      }
    });
  }
}
