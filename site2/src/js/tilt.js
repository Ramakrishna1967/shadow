import gsap from 'gsap';

/* ── 3D tilt ────────────────────────────────────────────────
   command cards and phase cells rotate in real perspective
   toward the cursor, snap back with elastic overshoot.
   (parents carry CSS perspective — see run.css / grid.css)
────────────────────────────────────────────────────────── */

export function initTilt() {
  const tilt = (sel, max) => {
    document.querySelectorAll(sel).forEach((el) => {
      const rX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
      const rY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rY(px * max * 2);
        rX(-py * max * 2);
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      });
    });
  };

  tilt('.cmd-card', 8);
  tilt('.cell', 9);
}
