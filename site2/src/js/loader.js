import gsap from 'gsap';
import { scramble } from './utils.js';

/* ── loader ─────────────────────────────────────────────────
   boot lines decode in · counter ticks 000→100 (steps ease)
   EXIT 0 stamps · then the whole screen melts away through
   an SVG turbulence-displacement wipe into the hero.
────────────────────────────────────────────────────────── */

export function runLoader(onDone) {
  const el = document.getElementById('ld-count');
  const lines = gsap.utils.toArray('.ld-line');
  const stamp = document.getElementById('ld-stamp');
  const disp = document.getElementById('melt-disp');
  const loader = document.getElementById('loader');
  const count = { v: 0 };

  /* park the real text so nothing reads before its decode */
  lines.forEach((l) => {
    l.dataset.t = l.textContent;
    l.textContent = '\u00A0';
  });

  const tl = gsap.timeline({ onComplete: onDone });

  lines.forEach((l, i) => {
    tl.add(() => scramble(l, l.dataset.t, { duration: 300 }), 0.2 + i * 0.34);
  });

  tl.to(
    count,
    {
      v: 100,
      duration: 2.4,
      ease: 'steps(60)',
      onUpdate: () => {
        el.textContent = String(Math.round(count.v)).padStart(3, '0');
      },
    },
    0.35
  );

  tl.fromTo(
    stamp,
    { opacity: 0, scale: 2.4 },
    { opacity: 1, scale: 1, duration: 0.3, ease: 'power4.out' },
    2.55
  );

  /* melt exit */
  tl.add('exit', 2.95);
  tl.set(loader, { filter: 'url(#melt)' }, 'exit');
  tl.to(disp, { attr: { scale: 120 }, duration: 0.55, ease: 'power2.in' }, 'exit');
  tl.to('#grain', { opacity: 0.22, duration: 0.16, yoyo: true, repeat: 1 }, 'exit+=0.25');
  tl.to(
    loader,
    { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'power4.inOut' },
    'exit+=0.1'
  );
  tl.to(disp, { attr: { scale: 0 }, duration: 0.45, ease: 'power2.out' }, 'exit+=0.7');
  tl.set(loader, { display: 'none' });
}
