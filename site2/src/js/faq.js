import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ── FAQ ────────────────────────────────────────────────────
   rows rise in on scroll; each answer opens with a real
   height tween so long answers never clip mid-render. the
   open answer is parked at height:auto — never cleared back
   to the CSS 0, which would collapse it on complete.
────────────────────────────────────────────────────────── */

export function initFaq() {
  const list = document.getElementById('faq-list');
  if (!list) return;

  ScrollTrigger.create({
    trigger: list,
    start: 'top 78%',
    once: true,
    onEnter: () => list.classList.add('is-in'),
  });

  list.querySelectorAll('.qa').forEach((qa) => {
    const sum = qa.querySelector('summary');
    const body = qa.querySelector('.qa-a');
    if (!sum || !body) return;

    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (qa._animating) return;
      qa._animating = true;

      if (qa.open) {
        gsap.to(body, {
          height: 0,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
          onComplete: () => {
            qa.open = false;
            body.style.height = '';
            body.style.opacity = '';
            qa._animating = false;
          },
        });
      } else {
        qa.open = true;
        gsap.fromTo(
          body,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out',
            onComplete: () => {
              body.style.height = 'auto';
              body.style.opacity = '1';
              qa._animating = false;
            },
          }
        );
      }
    });
  });
}
