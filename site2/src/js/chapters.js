import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { splitChars } from './utils.js';
import { isMobile } from './device.js';

/* ── chapters ───────────────────────────────────────────────
   each chapter pins for +190% of viewport and is DRAGGED
   through its states by scrub. polarity of the whole page
   inverts per section (black ↔ white scene cuts) — and
   v2: every polarity cut is a MELT — the stage liquefies
   through an SVG turbulence displacement.
────────────────────────────────────────────────────────── */

/* the melt — one shared displacement filter, guarded per target */
function melt(target) {
  /* the displacement filter is a full-viewport SVG pass — skip it
     on touch hardware, the polarity cut still happens */
  if (isMobile) return;
  const el = target.querySelector('.ch-stage') || target;
  if (el._melting) return;
  el._melting = true;
  gsap
    .timeline({
      onComplete: () => {
        el._melting = false;
        el.style.filter = '';
      },
    })
    .set(el, { filter: 'url(#melt2)' })
    .to('#melt2-disp', { attr: { scale: 80 }, duration: 0.42, ease: 'power2.in' })
    .to('#melt2-disp', { attr: { scale: 0 }, duration: 0.5, ease: 'power2.out' });
}

/* zone engine — deterministic scroll zones.
   ScrollTrigger positions measured ON pinned elements are
   unreliable (they fired at wrong offsets and then died),
   so polarity + HUD stage are driven by real flow layout:
   one zone per section (measured through its pin-spacer),
   entered when the section's flow top crosses 55% of the
   viewport. entering a zone flips page polarity (with melt)
   and notifies listeners (HUD stage). */
const zoneListeners = [];
export function onZoneChange(cb) {
  zoneListeners.push(cb);
}

function initZones() {
  const secs = [...document.querySelectorAll('main [data-polarity], #footer')];
  let pol = document.body.dataset.polarity || 'dark';
  let active = null;

  const flowTop = (sec) => {
    const holder = sec.closest('.pin-spacer') || sec; /* pin-aware */
    return holder.getBoundingClientRect().top + window.scrollY;
  };

  let flips = [];
  const measure = () => {
    flips = secs.map((sec) => ({ sec, at: flowTop(sec) - innerHeight * 0.55 }));
  };

  const apply = () => {
    if (!flips.length) return;
    const y = window.scrollY;
    let cur = flips[0].sec;
    for (const f of flips) if (y >= f.at) cur = f.sec;
    if (cur === active) return;
    active = cur;

    const p = cur.dataset.polarity;
    if (p !== pol) {
      pol = p;
      document.body.dataset.polarity = p;
      melt(cur);
    }
    for (const cb of zoneListeners) cb(cur);
  };

  measure();
  /* pin spacers shift layout — re-measure on every refresh */
  ScrollTrigger.addEventListener('refresh', () => {
    measure();
    apply();
  });
  gsap.ticker.add(apply);
}

export function initChapters() {
  initZones();

  chapterProblem();
  chapterDelegate();
  chapterSteps();
  chapterTools();
  chapterTrust();
}

function pinned(ch, build) {
  if (isMobile) {
    /* touch: no pin, no scrub. the same timeline is built, but
       it plays once when the chapter enters the viewport. */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ch, start: 'top 78%', once: true },
    });
    build(tl, ch);
    return tl;
  }
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ch,
      start: 'top top',
      end: '+=190%',
      pin: true,
      scrub: 1,
      anticipatePin: 1,
    },
  });
  build(tl, ch);
  return tl;
}

/* shared intro: title chars rise, prose reveals line-by-line
   through real SplitText masks (fallback: plain fade), spec
   rows cascade. */
function intro(tl, ch) {
  const chars = splitChars(ch.querySelector('.ch-title'));
  tl.fromTo(
    chars,
    { yPercent: 115 },
    { yPercent: 0, duration: 0.5, ease: 'power3.out', stagger: 0.035 },
    0
  );

  let t = 0.25;
  ch.querySelectorAll('.ch-line').forEach((line) => {
    let lines = null;
    try {
      const sp = new SplitText(line, { type: 'lines', mask: 'lines' });
      if (sp.lines.length) lines = sp.lines;
    } catch (e) {
      /* SplitText unavailable → plain fallback below */
    }
    if (lines) {
      tl.fromTo(
        lines,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.6, ease: 'power4.out', stagger: 0.09 },
        t
      );
    } else {
      tl.fromTo(
        line,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' },
        t
      );
    }
    t += 0.1;
  });

  tl.fromTo(
    ch.querySelectorAll('.spec-row'),
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.07 },
    0.8
  );
}

function stampIn(tl, ch, at) {
  tl.fromTo(
    ch.querySelector('.ch-stamp'),
    { opacity: 0, scale: 1.7 },
    { opacity: 1, scale: 1, duration: 0.35, ease: 'power4.out' },
    at
  );
}

/* 1 · PROBLEM — your day drawn as a wireframe, a scan beam
   sweeps the routine, the probe strikes the chore that
   never ends. */
function chapterProblem() {
  const ch = document.getElementById('ch-problem');
  pinned(ch, (tl) => {
    intro(tl, ch);

    const lines = ch.querySelectorAll('.wf line');
    lines.forEach((ln) => {
      const L = ln.getTotalLength();
      gsap.set(ln, { strokeDasharray: L, strokeDashoffset: L });
    });
    tl.to(lines, { strokeDashoffset: 0, duration: 1.1, ease: 'none', stagger: 0.04 }, 0.2);

    tl.fromTo('.scan', { attr: { x: -60 }, opacity: 0 }, { attr: { x: 620 }, opacity: 0.85, duration: 1.6, ease: 'none' }, 0.5);
    tl.to('.scan', { opacity: 0, duration: 0.3 }, 1.9);

    const probe = ch.querySelector('.probe path');
    const pl = probe.getTotalLength();
    gsap.set(probe, { strokeDasharray: pl, strokeDashoffset: pl });
    tl.to(probe, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, 1.1);

    tl.fromTo(
      '.pdot',
      { opacity: 0, scale: 0, transformOrigin: '50% 50%' },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' },
      1.15
    );
    tl.to('.pdot', { opacity: 0.35, duration: 0.2, yoyo: true, repeat: 3 }, 1.5);

    stampIn(tl, ch, 3.1);
  });
}

/* 2 · DELEGATE — the lattice fills agent by agent while
   the crew count climbs to 20. */
function chapterDelegate() {
  const ch = document.getElementById('ch-delegate');
  pinned(ch, (tl) => {
    intro(tl, ch);

    tl.fromTo(
      ch.querySelectorAll('.lc-f'),
      { scaleX: 0.08 },
      { scaleX: 1, duration: 0.5, ease: 'power2.inOut', stagger: 0.05 },
      0.5
    );
    tl.to(ch.querySelectorAll('.lc'), { opacity: 0.5, duration: 0.4, stagger: 0.05 }, 0.5);

    const conf = { v: 0 };
    const confEl = document.getElementById('conf-val');
    tl.to(
      conf,
      {
        v: 20,
        duration: 1.4,
        ease: 'power1.inOut',
        onUpdate: () => { confEl.textContent = Math.round(conf.v); },
      },
      0.6
    );

    stampIn(tl, ch, 3.1);
  });
}

/* 3 · STEPS — blocks assemble into the plan, the four-step
   checklist lights up, the boot bar fills, approved. */
function chapterSteps() {
  const ch = document.getElementById('ch-steps');
  pinned(ch, (tl) => {
    intro(tl, ch);

    tl.fromTo(
      ch.querySelectorAll('.blk'),
      { opacity: 0, scale: 0.3, y: 60 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.08 },
      0.5
    );

    tl.to(ch.querySelectorAll('.blind span'), { opacity: 1, duration: 0.3, stagger: 0.12 }, 1.8);
    tl.fromTo(
      ch.querySelector('.bootbar i'),
      { scaleX: 0 },
      { scaleX: 1, duration: 0.9, ease: 'power2.inOut' },
      2.0
    );

    stampIn(tl, ch, 3.1);
  });
}

/* 4 · TOOLS — the big one. six tools converge under one
   grant, the asks-before table resolves row by row, tools
   count 0 → 6, the viewport shakes, ASKS FIRST slams. */
function chapterTools() {
  const ch = document.getElementById('ch-tools');
  pinned(ch, (tl) => {
    intro(tl, ch);

    tl.to('.pr-a', { attr: { cx: 200 }, duration: 1.8, ease: 'power2.inOut' }, 0.4);
    tl.to('.pr-b', { attr: { cx: 200 }, duration: 1.8, ease: 'power2.inOut' }, 0.4);
    tl.fromTo(
      '.pr-c',
      { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' },
      1.9
    );

    tl.to(ch.querySelectorAll('.dv-row'), { opacity: 1, duration: 0.25, stagger: 0.16 }, 0.9);
    tl.to(
      ch.querySelectorAll('.dv-st'),
      { scale: 1, duration: 0.3, ease: 'back.out(3)', stagger: 0.16 },
      1.0
    );

    const dc = { v: 0 };
    const dcEl = document.getElementById('div-count');
    tl.to(
      dc,
      {
        v: 6,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => { dcEl.textContent = Math.round(dc.v); },
      },
      1.2
    );

    /* shake + slam */
    tl.to(ch.querySelector('.ch-stage'), { x: 9, duration: 0.03, repeat: 5, yoyo: true, ease: 'none' }, 2.9);
    tl.set(ch.querySelector('.ch-stage'), { x: 0 }, 3.15);
    tl.to(ch.querySelector('.exit-stamp'), { opacity: 1, scale: 1, duration: 0.4, ease: 'power4.out' }, 3.2);
  });
}

/* 5 · TRUST — scattered permissions collapse into one
   contained box, the seal draws itself, deny wins. */
function chapterTrust() {
  const ch = document.getElementById('ch-trust');
  const spots = [
    [-260, -160], [180, -200], [-320, 60], [300, 90], [-90, -260],
    [220, 220], [-240, 190], [120, -120], [-380, -40],
  ];
  pinned(ch, (tl) => {
    intro(tl, ch);

    ch.querySelectorAll('.ex-b').forEach((b, i) => {
      tl.fromTo(
        b,
        { x: spots[i][0], y: spots[i][1], opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.8, ease: 'power3.inOut' },
        0.4 + i * 0.06
      );
    });

    tl.to(ch.querySelector('.ex-fill'), { opacity: 1, duration: 0.4 }, 1.7);

    const rect = ch.querySelector('.ex-box rect');
    const rl = rect.getTotalLength();
    gsap.set(rect, { strokeDasharray: rl, strokeDashoffset: rl });
    tl.to(rect, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 1.8);

    stampIn(tl, ch, 3.1);
  });
}
