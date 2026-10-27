// ==============================================================================
// OAMS - Supabase Client Config
// Fyll inn din Project URL og anon public key fra Supabase Dashboard -> Settings -> API
// ==============================================================================

export const SUPABASE_URL = 'https://sqmfhjxebqaolbmuxqph.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbWZoanhlYnFhb2xibXV4cXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTY1ODMsImV4cCI6MjEwODY3MjU4M30.RMCwHrKYwkaj3dURqZH7XiU9uiBybIQ7T7j3VbxkiiE';

// Last inn Supabase JS-bibliotek fra CDN dersom det ikke allerede finnes
let _supabaseInstance = null;

export async function getSupabase() {
  if (_supabaseInstance) return _supabaseInstance;

  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Hvis nøklene ennå ikke er satt, returner null slik at fallback-innhold beholdes
  if (SUPABASE_URL.includes('DITT-PROSJEKT-ID') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('DIN-ANON')) {
    console.warn('OAMS CMS: Supabase URL og anon key er ikke konfigurert ennå i js/supabase-client.js. Viser statisk fallback.');
    return null;
  }

  _supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _supabaseInstance;
}
