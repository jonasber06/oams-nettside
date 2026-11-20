// ==============================================================================
// OAMS CMS - XSS-sikker tekstformatering med støtte for **fet skrift**
// Brukes på tvers av alle frontend-sidene for innhold fra Supabase.
// ==============================================================================

/**
 * Rendrer tekst sikkert i et DOM-element med støtte for **fet skrift**
 * (og valgfrie linjeskift som <br>). Bruker kun DOM-noder (textContent / createTextNode),
 * slik at ingen rå HTML kan injiseres.
 *
 * @param {HTMLElement|null} el
 * @param {string} rawText
 * @param {{ multiline?: boolean }} [options]
 */
export function renderFormattedText(el, rawText, { multiline = true } = {}) {
  if (!el) return;
  el.textContent = '';

  const normalized = String(rawText || '').replace(/\r\n/g, '\n');
  const lines = multiline ? normalized.split('\n') : [normalized];

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
