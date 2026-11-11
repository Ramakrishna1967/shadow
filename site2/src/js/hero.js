import gsap from 'gsap';
import { scramble } from './utils.js';
import { vel } from './velocity.js';
import { mouse } from './cursor.js';

const CIRC = 2 * Math.PI * 46; /* r=46 ring */

/* ── hero — persistent behavior ─────────────────────────────
   v2: every shadow letter is magnetized — the variable font's
   weight + width physically swell toward the cursor while
   each letter breathes on its own phase, and drifts slightly
   toward the pointer. glyph chase + velocity ticker remain.
────────────────────────────────────────────────────────── */

export function initHero() {
  /* glyph chase — centered first, then quickTo offsets */
  gsap.set('.hero-glyph', { xPercent: -50, yPercent: -50 });
  const gX = gsap.quickTo('.hero-glyph', 'x', { duration: 1.0, ease: 'power3' });
  const gY = gsap.quickTo('.hero-glyph', 'y', { duration: 1.0, ease: 'power3' });
  addEventListener('mousemove', (e) => {
    gX((e.clientX - innerWidth / 2) * 0.35);
    gY((e.clientY - innerHeight / 2) * 0.35);
  });

  /* global variable-font breathing — tag + meta still morph */
  gsap.to('#hero', {
    '--wght': 430,
    '--wdth': 76,
    duration: 3.6,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  });

  /* per-letter magnetism — the word thickens where you point */
  const letters = gsap.utils.toArray('#hero-mark .ltr');
  const st = letters.map(() => ({ w: 720, wd: 100, y: 0 }));
  const heroEl = document.getElementById('hero');

  gsap.ticker.add(() => {
    const hr = heroEl.getBoundingClientRect();
    if (hr.bottom < -60 || hr.top > innerHeight + 60) return; /* offscreen */

    const t = performance.now() / 1000;
    const rects = letters.map((l) => l.getBoundingClientRect()); /* batch read */

    letters.forEach((l, i) => {
      const s = st[i];
      const rc = rects[i];
      const dx = mouse.x - (rc.left + rc.width / 2);
      const dy = mouse.y - (rc.top + rc.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - d / 460); /* cursor influence */

      const breath = 720 + Math.sin(t * 1.4 + i * 0.45) * 80; /* 640–800 */
      const tw = Math.min(900, breath + f * 100);
      const twd = Math.min(100, 96 + f * 4); /* caps stay on one line */
      const ty = -(dy / d) * f * f * 18;

      s.w += (tw - s.w) * 0.14;
      s.wd += (twd - s.wd) * 0.14;
      s.y += (ty - s.y) * 0.14;

      l.style.fontVariationSettings = `'wght' ${s.w.toFixed(0)}, 'wdth' ${s.wd.toFixed(1)}`;
      gsap.set(l, { y: s.y }); /* composes with heroIn's yPercent */
    });
  });

  /* velocity-reactive ticker */
  const track = document.getElementById('ticker-track');
  while (track.scrollWidth < innerWidth * 2.2) track.innerHTML += track.innerHTML;
  let x = 0;
  gsap.ticker.add(() => {
    const speed = 1.6 + Math.abs(vel.v) * 2.4;
    x -= speed;
    if (vel.dir > 0) x += speed * 2; /* scrolling up → reverse */
    const h2 = track.scrollWidth / 2;
    if (x <= -h2) x += h2;
    else if (x > 0) x -= h2;
    gsap.set(track, { x });
  });
}

/* ── hero — entrance (fires when the loader finishes) ────── */

export function heroIn() {
  const letters = gsap.utils.toArray('#hero-mark .ltr');
  const ring = document.querySelector('.hg-ring');

  const tl = gsap.timeline();

  letters.forEach((l, i) => {
    tl.add(() => scramble(l, l.dataset.t, { duration: 520 }), 0.04 + i * 0.07);
  });

  tl.fromTo(
    letters,
    { yPercent: 72 },
    { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.07 },
    0
  );
  tl.fromTo(
    '.hg-fill',
    { scale: 0.4, transformOrigin: '50% 50%' },
    { scale: 1, duration: 1.3, ease: 'expo.out' },
    0.15
  );
  tl.set(ring, { strokeDasharray: CIRC, strokeDashoffset: CIRC }, 0);
  tl.to(ring, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 0.35);
  tl.fromTo(
    '.hero-meta',
    { opacity: 0, y: 14 },
    { opacity: 0.55, y: 0, duration: 0.9, ease: 'power2.out' },
    0.55
  );
  tl.fromTo(
    '.hero-tag',
    { opacity: 0, y: 34 },
    { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' },
    0.7
  );
  tl.fromTo('.hero-pipe', { opacity: 0 }, { opacity: 0.55, duration: 0.9 }, 0.95);

  return tl;
}
