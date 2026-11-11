import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initGrain } from './js/grain.js';
import { initCursor, mouse } from './js/cursor.js';
import { splitChars, scramble } from './js/utils.js';
import './styles/legal.css';

/* ── legal pages — motion ───────────────────────────────────
   the landing's grammar, scaled down to a document: headline
   decodes out of the baseline, mono codes scramble in, spec
   rows rise on scroll, a hairline reads your progress, and
   the outlined wordmark ignites under the cursor.
────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger);

document.body.classList.add('anim');

initGrain();
initCursor();

/* headline: chars rise out of the floor, like a chapter title */
const h1 = document.querySelector('.lg-h1');
if (h1) {
  const chars = splitChars(h1);
  gsap.set(chars, { yPercent: 130 });
  gsap.to(chars, {
    yPercent: 0,
    duration: 1.15,
    ease: 'expo.out',
    stagger: 0.032,
    delay: 0.12,
  });
}

/* mono codes decode, left to right */
document.querySelectorAll('[data-scramble]').forEach((el, i) => {
  const final = el.textContent;
  setTimeout(() => scramble(el, final, { duration: 620 }), 240 + i * 110);
});

/* spec rows rise as they enter */
ScrollTrigger.batch('.lrow', {
  start: 'top 88%',
  onEnter: (batch) =>
    batch.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 70)),
});

/* reading progress */
const fill = document.getElementById('lg-progress');
const paint = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  fill.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 1})`;
};
addEventListener('scroll', paint, { passive: true });
addEventListener('resize', paint);
paint();

/* cursor labels — every link names its action */
const label = document.getElementById('cursor-label');
document.querySelectorAll('a').forEach((a) => {
  const word = a.classList.contains('tb-back')
    ? 'BACK'
    : a.classList.contains('cta-btn')
      ? 'GET'
      : 'OPEN';
  a.addEventListener('mouseenter', () => {
    label.textContent = word;
    gsap.to(label, { opacity: 1, duration: 0.25 });
  });
  a.addEventListener('mouseleave', () => gsap.to(label, { opacity: 0, duration: 0.25 }));
});

/* footer wordmark: rises, then fills solid under the cursor */
const mark = document.querySelector('.lg-mark');
if (mark) {
  const chars = [...splitChars(mark)];
  gsap.fromTo(
    chars,
    { yPercent: 112 },
    {
      yPercent: 0,
      duration: 1.05,
      ease: 'expo.out',
      stagger: 0.05,
      scrollTrigger: { trigger: '#lg-footer', start: 'top 92%' },
    }
  );

  let live = false;
  ScrollTrigger.create({
    trigger: '#lg-footer',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      live = self.isActive;
    },
  });
  gsap.ticker.add(() => {
    if (!live) return;
    for (const c of chars) {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(
        mouse.x - (r.left + r.width / 2),
        mouse.y - (r.top + r.height / 2)
      );
      c.classList.toggle('hot', d < 170);
    }
  });
}
