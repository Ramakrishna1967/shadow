import gsap from 'gsap';
import { mouse } from './cursor.js';
import { vel } from './velocity.js';

/* ── warping particle field ────────────────────────────────
   a square-dot grid behind everything. dots flee the cursor
   with squared falloff, breathe with idle noise, smear with
   scroll velocity, and draw elastic anchor lines back to
   their homes. difference blend = self-inverting through
   every polarity flip. no circles — squares only.
────────────────────────────────────────────────────────── */

export function initField() {
  const c = document.getElementById('field');
  const ctx = c.getContext('2d');
  const GAP = 58;
  let dots = [];
  const sm = { x: -9999, y: -9999 };

  const build = () => {
    c.width = innerWidth;
    c.height = innerHeight;
    dots = [];
    for (let y = GAP / 2; y < innerHeight + GAP; y += GAP) {
      for (let x = GAP / 2; x < innerWidth + GAP; x += GAP) {
        dots.push({ hx: x, hy: y, x, y, ph: Math.random() * Math.PI * 2 });
      }
    }
  };
  build();
  addEventListener('resize', build);

  gsap.ticker.add(() => {
    sm.x += (mouse.x - sm.x) * 0.12;
    sm.y += (mouse.y - sm.y) * 0.12;

    const t = performance.now() / 1000;
    const smear = vel.v * -2.2;

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fff';

    const R = 200, R2 = R * R;
    for (const d of dots) {
      const ox = d.hx + Math.sin(t * 0.7 + d.ph) * 3;
      const oy = d.hy + Math.cos(t * 0.6 + d.ph) * 3 + smear;

      let tx = ox, ty = oy;
      const dx = ox - sm.x, dy = oy - sm.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < R2 && dist2 > 0.01) {
        const dist = Math.sqrt(dist2);
        let f = 1 - dist / R;
        f *= f;
        const push = f * 46;
        tx = ox + (dx / dist) * push;
        ty = oy + (dy / dist) * push;
      }

      d.x += (tx - d.x) * 0.14;
      d.y += (ty - d.y) * 0.14;

      const disp = Math.hypot(d.x - d.hx, d.y - d.hy);
      if (disp > 3) {
        ctx.globalAlpha = Math.min(0.35, 0.1 + disp * 0.004);
        ctx.beginPath();
        ctx.moveTo(d.hx, d.hy);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      ctx.globalAlpha = Math.min(0.75, 0.3 + disp * 0.012);
      const s = 1.3 + disp * 0.02;
      ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  });
}
