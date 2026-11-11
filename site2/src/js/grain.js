import gsap from 'gsap';
import { vel } from './velocity.js';

/* ── live film grain ───────────────────────────────────────
   half-res noise canvas re-rolled every ~90ms.
   v2: velocity mode — scroll speed burns the film. the
   ticker takes over ONLY after the loader's exit flash
   has finished (called from the reveal callback).
────────────────────────────────────────────────────────── */

export function initGrain() {
  const c = document.getElementById('grain');
  const ctx = c.getContext('2d');
  let img;

  const resize = () => {
    c.width = Math.max(2, Math.ceil(innerWidth / 2));
    c.height = Math.max(2, Math.ceil(innerHeight / 2));
    img = ctx.createImageData(c.width, c.height);
  };
  resize();
  addEventListener('resize', resize);

  setInterval(() => {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, 90);
}

/* velocity-reactive intensity — base 0.08, burns to 0.3 */
export function initGrainVelocity() {
  const g = document.getElementById('grain');
  let cur = 0.08;
  gsap.ticker.add(() => {
    const target = Math.min(0.3, 0.08 + Math.abs(vel.v) * 0.013);
    cur += (target - cur) * 0.09;
    g.style.opacity = cur.toFixed(3);
  });
}
