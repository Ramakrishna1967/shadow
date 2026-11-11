import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scramble } from './utils.js';

/* ── the ten — phase grid ───────────────────────────────────
   cells stagger in diagonally; on hover the phase name
   decodes from glyph noise (original text survives repeats).
────────────────────────────────────────────────────────── */

export function initGrid() {
  const cells = gsap.utils.toArray('.cell');

  cells.forEach((c) => {
    const name = c.querySelector('.c-name');
    name.dataset.t = name.textContent;
    c.addEventListener('mouseenter', () => scramble(name, name.dataset.t, { duration: 380 }));
  });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#grid', start: 'top 72%' },
  });
  tl.fromTo('.sec-head', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);
  tl.fromTo(
    cells,
    { opacity: 0, y: 60, scale: 0.94 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: { each: 0.05, grid: [5, 2], from: 'start' },
    },
    0.15
  );
  /* fade in cell names after cells appear */
  tl.to('.cell .c-name', { opacity: (i, el) => el.closest('.cell.done') ? 0.82 : 0.55, duration: 0.5 }, 0.65);
}
