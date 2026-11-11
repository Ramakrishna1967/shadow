import gsap from 'gsap';

/* ── ARROW cursor ───────────────────────────────────────────
   custom SVG arrowhead IS the pointer (near-zero lag).
   leans into movement direction, squashes/stretches with
   speed, spawns a fading echo trail, morphs + labels on
   interactive targets. difference blend — always visible.
────────────────────────────────────────────────────────── */

/* shared mouse state — consumed by hero magnetism, field, footer */
export const mouse = { x: innerWidth / 2, y: innerHeight / 2 };

const ARROW =
  '<svg viewBox="0 0 24 24"><path d="M5 2 L5 17 L9 13.5 L11.5 19.5 L14 18.5 L11.5 13 L17 13 Z"/></svg>';

export function initCursor() {
  const cur = document.getElementById('cursor');
  const label = document.getElementById('cursor-label');
  const trail = document.getElementById('cursor-trail');

  gsap.set(cur, { autoAlpha: 0, transformOrigin: '21% 8%' }); /* pivot = tip */

  const xTo = gsap.quickTo(cur, 'x', { duration: 0.06, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.06, ease: 'power3' });
  const rotTo = gsap.quickTo(cur, 'rotation', { duration: 0.4, ease: 'power3' });
  const sxTo = gsap.quickTo(cur, 'scaleX', { duration: 0.3, ease: 'power3' });
  const syTo = gsap.quickTo(cur, 'scaleY', { duration: 0.3, ease: 'power3' });
  const lxTo = gsap.quickTo(label, 'x', { duration: 0.35, ease: 'power3' });
  const lyTo = gsap.quickTo(label, 'y', { duration: 0.35, ease: 'power3' });

  let px = mouse.x, py = mouse.y;
  let shown = false, hoverBoost = 1, hoverTilt = 0, press = 1, lastSpawn = 0;

  addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!shown) {
      shown = true;
      gsap.to(cur, { autoAlpha: 1, duration: 0.25 });
    }

    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    const speed = Math.hypot(dx, dy);

    xTo(e.clientX);
    yTo(e.clientY);
    lxTo(e.clientX + 24);
    lyTo(e.clientY + 20);

    /* lean into the movement direction */
    if (speed > 5) {
      let r = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (r > 180) r -= 360;
      if (r < -180) r += 360;
      rotTo(hoverTilt || gsap.utils.clamp(-20, 20, r * 0.22));
    } else if (!hoverTilt) {
      rotTo(0);
    }

    /* squash & stretch along movement */
    const s = gsap.utils.clamp(0.7, 2.1, (1 + speed * 0.011) * hoverBoost * press);
    sxTo(s);
    syTo(Math.min(1.4, 1 / s + press * 0.12));

    /* echo trail */
    if (speed > 24 && performance.now() - lastSpawn > 42 && trail.childElementCount < 14) {
      lastSpawn = performance.now();
      const wrap = document.createElement('div');
      wrap.innerHTML = ARROW;
      const t = wrap.firstElementChild;
      trail.appendChild(t);
      gsap.set(t, {
        x: e.clientX - 7,
        y: e.clientY - 7,
        rotation: gsap.getProperty(cur, 'rotation'),
      });
      gsap.to(t, {
        x: e.clientX - 7 + dx * 0.3,
        y: e.clientY - 7 + dy * 0.3,
        opacity: 0,
        scale: 0.3,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => t.remove(),
      });
    }
  });

  addEventListener('mousedown', () => (press = 0.72));
  addEventListener('mouseup', () => (press = 1));
  document.addEventListener('mouseleave', () => gsap.to(cur, { autoAlpha: 0, duration: 0.2 }));
  document.addEventListener('mouseenter', () => {
    if (shown) gsap.to(cur, { autoAlpha: 1, duration: 0.2 });
  });

  /* hover morph + labels */
  const hot = [
    ['#mode-toggle', 'FLIP'],
    ['.cell', 'VIEW'],
    ['.cmd-card', 'RUN'],
    ['.cta-btn', 'GET'],
  ];
  hot.forEach(([sel, word]) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.addEventListener('mouseenter', () => {
        hoverBoost = 1.55;
        hoverTilt = -14;
        label.textContent = word;
        gsap.to(label, { opacity: 1, duration: 0.25 });
      });
      el.addEventListener('mouseleave', () => {
        hoverBoost = 1;
        hoverTilt = 0;
        gsap.to(label, { opacity: 0, duration: 0.25 });
      });
    });
  });

  /* magnetic pull + elastic release */
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const mX = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
    const mY = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      mX((e.clientX - (r.left + r.width / 2)) * 0.3);
      mY((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.32)' });
    });
  });
}
