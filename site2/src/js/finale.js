import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars } from './utils.js';
import { mouse } from './cursor.js';

/* ── finale + footer mark ───────────────────────────────────
   the finale is one screen, not a pin: as it enters, the ring
   draws its crosshairs and turns, a scanner crosses the stage,
   and the headline rises out of its own mask char by char.
   the footer mark then rises per char and fills solid under
   the cursor.
────────────────────────────────────────────────────────── */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* splitChars() wraps every character in its own inline-block, which lets
   the browser break a line between any two letters. For the finale the
   copy has to break at word boundaries only, so words are wrapped in a
   nowrap inline-block and the chars are built inside them. */
function splitWords(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.ch')];
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const frag = document.createDocumentFragment();
  const chars = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      frag.appendChild(document.createTextNode(' '));
      continue;
    }
    const word = document.createElement('span');
    word.className = 'wd';
    for (const c of part) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      word.appendChild(s);
      chars.push(s);
    }
    frag.appendChild(word);
  }
  el.appendChild(frag);
  el.dataset.split = '1';
  return chars;
}

export function initFinale() {
  initStage();
  initFooterMark();
}

function initStage() {
  const stage = document.querySelector('.fin-stage');
  const frame = document.querySelector('.fin-frame');
  const sweep = document.querySelector('.fin-sweep');
  const l1 = document.querySelector('.fin-l1');
  if (!stage || !frame || !l1) return;

  const chars = splitWords(l1);

  if (REDUCED) {
    gsap.set(frame, { '--fx': 1, '--fy': 1 });
    return;
  }

  /* the ring turns slowly with the section — never scrubbed hard */
  gsap.fromTo(
    frame,
    { rotation: -10 },
    {
      rotation: 16,
      ease: 'none',
      scrollTrigger: {
        trigger: '#finale',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    }
  );

  /* one-shot entrance, fired once as the stage comes into view */
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#finale', start: 'top 74%', once: true },
  });

  tl.fromTo(
    frame,
    { scale: 1.14, '--fx': 0, '--fy': 0 },
    {
      scale: 1,
      '--fx': 1,
      '--fy': 1,
      duration: 1.5,
      ease: 'power3.out',
    },
    0
  );

  /* scanner crosses the stage once */
  tl.fromTo(sweep, { x: '-8vw', opacity: 0 }, { opacity: 0.75, duration: 0.14 }, 0.15);
  tl.to(sweep, { x: '108vw', duration: 1.05, ease: 'power2.inOut' }, 0.15);
  tl.to(sweep, { opacity: 0, duration: 0.28, ease: 'power2.out' }, 0.95);

  /* headline — each char climbs out of its mask */
  tl.fromTo(
    chars,
    { yPercent: 118, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 0.72,
      ease: 'back.out(1.7)',
      stagger: 0.013,
    },
    0.2
  );
}

function initFooterMark() {
  const mark = document.querySelector('.ft-mark');
  if (!mark) return;

  const chars = [...splitChars(mark)];

  if (REDUCED) {
    gsap.set(chars, { yPercent: 0 });
    return;
  }

  gsap.fromTo(
    chars,
    { yPercent: 112 },
    {
      yPercent: 0,
      duration: 1.05,
      ease: 'expo.out',
      stagger: 0.05,
      scrollTrigger: { trigger: '#footer', start: 'top 92%' },
    }
  );

  let live = false;
  ScrollTrigger.create({
    trigger: '#footer',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => { live = self.isActive; },
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
