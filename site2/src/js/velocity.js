import gsap from 'gsap';

/* ── shared scroll-velocity brain ──────────────────────────
   one ticker measures scroll velocity, decays it, and feeds:
   · marquee speed/direction (via exported vel)
   · field anchors, grain burn, hero ticker
   type is never skewed - headlines stay level at any scroll
   speed, so the reveal masks never slice a letter.
────────────────────────────────────────────────────────── */

export const vel = { v: 0, cur: 0, target: 0, dir: -1 };

export function initVelocity() {
  let lastY = window.scrollY;

  gsap.ticker.add(() => {
    const y = window.scrollY;
    vel.target += (y - lastY) * 0.55;
    lastY = y;

    vel.cur += (vel.target - vel.cur) * 0.15;
    vel.target *= 0.88;

    const v = gsap.utils.clamp(-9, 9, vel.cur);
    vel.v = v;
    if (v > 0.6) vel.dir = -1;      /* scrolling down → drift left */
    else if (v < -0.6) vel.dir = 1; /* scrolling up   → reverse   */
  });
}
