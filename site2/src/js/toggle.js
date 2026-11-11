import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { scramble } from './utils.js';

/* ── MACHINE mode ───────────────────────────────────────────
   one click: capture layout state, flip body.machine, and
   let GSAP FLIP physically fly every spec row / cell /
   command card / chapter title to its new shape while all
   prose decodes from human words into JSON event lines.
────────────────────────────────────────────────────────── */

export function initToggle() {
  gsap.registerPlugin(Flip);

  const btn = document.getElementById('mode-toggle');
  const swaps = gsap.utils.toArray('[data-o]');
  let busy = false;

  btn.addEventListener('click', () => {
    if (busy) return;
    busy = true;

    const machine = !document.body.classList.contains('machine');

    /* capture BEFORE the class flip */
    const state = Flip.getState('.spec-row, .cell, .cmd-card, .ch-title');
    document.body.classList.toggle('machine', machine);
    Flip.from(state, {
      duration: 0.7,
      ease: 'power3.inOut',
      stagger: 0.015,
      scale: true,
    });

    /* decode cascade — every data-o element swaps its text */
    swaps.forEach((el, i) => {
      setTimeout(
        () => scramble(el, machine ? el.dataset.m : el.dataset.o, { duration: 420 }),
        60 + i * 22
      );
    });

    setTimeout(() => { busy = false; }, 1000);
  });
}
