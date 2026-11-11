import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { vel } from './velocity.js';

/* ── command run ────────────────────────────────────────────
   section pins and the card train races horizontally,
   scrubbed by vertical scroll. behind it, two outlined
   (shadow) marquees change speed and direction with your
   scroll velocity.
────────────────────────────────────────────────────────── */

export function initRun() {
  /* velocity marquees */
  document.querySelectorAll('.run-mark-row').forEach((row) => {
    while (row.scrollWidth < innerWidth * 2.2) row.innerHTML += row.innerHTML;
    let x = 0;
    const rev = row.classList.contains('rev');
    gsap.ticker.add(() => {
      const speed = 1.4 + Math.abs(vel.v) * 2.2;
      let d = vel.dir; /* -1 left (default) · +1 when scrolling up */
      if (rev) d = -d;
      x += d * speed;
      const h2 = row.scrollWidth / 2;
      if (x <= -h2) x += h2;
      else if (x > 0) x -= h2;
      gsap.set(row, { x });
    });
  });

  /* horizontal card train */
  const track = document.getElementById('run-track');
  const dist = () => track.scrollWidth - innerWidth + 140;
  gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#run',
      start: 'top top',
      end: () => '+=' + dist(),
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}
