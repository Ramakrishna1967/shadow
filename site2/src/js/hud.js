import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { scramble } from './utils.js';
import { onZoneChange } from './chapters.js';

/* ── scroll HUD ──────────────────────────────────────────────
   left rail: progress bar fills with scroll · the stage
   glyph MORPHS through the pipeline (arrow → diamond →
   cube → lens → box) as you cross each section ·
   chapter number odometer-flips · label decodes.
────────────────────────────────────────────────────────── */

const SHAPES = {
  problem: 'M18 18 L82 50 L18 82 L40 50 Z',
  delegate: 'M50 12 L88 50 L50 88 L12 50 Z',
  steps: 'M50 14 L86 33 V67 L50 86 L14 67 V33 Z',
  tools: 'M50 24 A30 30 0 0 1 50 76 A30 30 0 0 1 50 24 Z',
  trust: 'M22 22 H78 V78 H22 Z',
};

export function initHud() {
  gsap.registerPlugin(MorphSVGPlugin);

  const num = document.getElementById('hud-num');
  const lab = document.getElementById('hud-lab');
  const fill = document.getElementById('hud-fill');

  /* progress rail */
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => gsap.set(fill, { scaleY: self.progress }),
  });

  /* idle glyph breathe — slow pulse instead of constant spin */
  gsap.to('#hud-glyph', { rotation: 15, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  let cur = '';
  const setStage = (n, l) => {
    if (n === cur) return;
    cur = n;
    if (SHAPES[l]) {
      gsap.to('#hud-path', { morphSVG: SHAPES[l], duration: 0.7, ease: 'power3.inOut' });
    }
    gsap
      .timeline()
      .to(num, { yPercent: -110, duration: 0.18, ease: 'power2.in' })
      .add(() => { num.textContent = n; })
      .fromTo(num, { yPercent: 110 }, { yPercent: 0, duration: 0.22, ease: 'power2.out' });
    /* brand label renders as the wordmark: SHADOW */
    scramble(lab, l.toUpperCase(), { duration: 260 });
  };

  /* stage tracking — driven by the zone engine (pinned-element
     triggers were unreliable); label tracks the scene cuts */
  const STAGES = {
    hero: ['00', 'init'],
    'ch-problem': ['01', 'problem'],
    'ch-delegate': ['02', 'delegate'],
    'ch-steps': ['03', 'steps'],
    'ch-tools': ['04', 'tools'],
    'ch-trust': ['05', 'trust'],
    grid: ['06', 'the ten'],
    run: ['07', 'commands'],
    demo: ['08', 'demo'],
    faq: ['09', 'faq'],
    finale: ['10', 'SHADOW'],
    footer: ['11', 'ready'],
  };
  onZoneChange((sec) => {
    const [n, l] = STAGES[sec.id] || ['--', ''];
    setStage(n, l);
  });
}
