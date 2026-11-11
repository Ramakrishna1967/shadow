/* ── shared primitives ─────────────────────────────────────
   scramble()   glyph-noise → decode text effect
   splitChars() hand-rolled char splitter (→ .ch spans)
   rand()       helper
────────────────────────────────────────────────────────── */

const GLYPHS = '█▓▒░<>/\\{}[]()#$%&*+~^?!;:|01';

export const rand = (min, max) => min + Math.random() * (max - min);

export function splitChars(el) {
  if (!el.dataset.split) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? '\u00A0' : c;
      frag.appendChild(s);
    }
    el.appendChild(frag);
    el.dataset.split = '1';
  }
  return el.querySelectorAll('.ch');
}

export function scramble(el, target, { duration = 480 } = {}) {
  const final = target ?? el.dataset.t ?? el.textContent;
  cancelAnimationFrame(el._raf);
  const len = final.length;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const settled = Math.floor(p * p * len); /* decode accelerates */
    let out = final.slice(0, settled);
    for (let i = settled; i < len; i++) {
      const c = final[i];
      out += c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._raf = requestAnimationFrame(tick);
    else el.textContent = final;
  };
  el._raf = requestAnimationFrame(tick);
}
