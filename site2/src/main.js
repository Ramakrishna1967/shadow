/* ── shadow landing — boot ───────────────────────────────────
   fonts → styles → one scroll brain (Lenis synced to the
   gsap ticker) → modules → loader → reveal.
   v2 boot order: non-text modules init immediately; text /
   measure-dependent modules (SplitText, SplitText masks,
   pin spacing) wait for real fonts via Promise.race with a
   3s timeout, AND for the loader to finish. desktop only.
────────────────────────────────────────────────────────── */

import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

import './styles/base.css';
import './styles/loader.css';
import './styles/hero.css';
import './styles/chapter.css';
import './styles/grid.css';
import './styles/run.css';
import './styles/demo.css';
import './styles/faq.css';
import './styles/finale.css';
import './styles/machine.css';
import './styles/hud.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { initGrain, initGrainVelocity } from './js/grain.js';
import { initVelocity } from './js/velocity.js';
import { initCursor } from './js/cursor.js';
import { initField } from './js/field.js';
import { initTilt } from './js/tilt.js';
import { runLoader } from './js/loader.js';
import { initHero, heroIn } from './js/hero.js';
import { initChapters } from './js/chapters.js';
import { initGrid } from './js/grid.js';
import { initRun } from './js/run.js';
import { initChat } from './js/chat.js';
import { initFaq } from './js/faq.js';
import { initFinale } from './js/finale.js';
import { initToggle } from './js/toggle.js';
import { initHud } from './js/hud.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const desktop =
  !matchMedia('(pointer: coarse)').matches && window.innerWidth >= 1024;

if (!desktop) {
  /* mobile wall — the #gate overlay is already up via CSS */
  document.getElementById('loader').style.display = 'none';
} else {
  /* one scroll brain: Lenis glide synced into gsap's ticker */
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.stop(); /* frozen while the loader runs */
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* non-text modules — live immediately, even behind the loader */
  initGrain();
  initVelocity();
  initCursor();
  initField();
  initTilt();

  /* loader runs concurrently */
  const loaderP = new Promise((res) => runLoader(res));

  /* fonts gate — SplitText + pin spacing must measure the real
     typeface, never a fallback. 3s timeout keeps boot snappy. */
  const fontsP = Promise.race([
    Promise.all([
      document.fonts.load("800 100px 'Archivo Variable'"),
      document.fonts.load("400 16px 'JetBrains Mono'"),
    ]),
    new Promise((res) => setTimeout(res, 3000)),
  ]);

  Promise.all([fontsP, loaderP]).then(() => {
    initHero();
    initChapters();
    initGrid();
    initRun();
    initChat();
    initFaq();
    initFinale();
    initToggle();
    initHud();

    lenis.start();
    heroIn();
    initGrainVelocity(); /* takes over after the loader flash */
    ScrollTrigger.refresh();
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
