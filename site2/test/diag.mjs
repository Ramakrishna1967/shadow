/* polarity diagnostic — DOM only */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForFunction(
  () => document.getElementById('loader').style.display === 'none',
  null,
  { timeout: 15000 }
);
await page.waitForTimeout(1200);

/* section flow positions at scroll 0 (pin spacers already in layout) */
const secs = await page.evaluate(() => {
  const vh = window.innerHeight;
  return [...document.querySelectorAll('main [data-polarity], #footer')].map((s) => {
    const r = s.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const bottom = r.bottom + window.scrollY;
    return {
      id: s.id,
      pol: s.dataset.polarity,
      top: Math.round(top),
      bottom: Math.round(bottom),
      triggerStart: Math.round(top - 0.55 * vh), /* 'top 55%' */
      triggerEnd: Math.round(bottom - 0.45 * vh), /* 'bottom 45%' */
    };
  });
});
console.log('SECTIONS:', JSON.stringify(secs, null, 2));

/* watch polarity attr while stepping slowly through the page */
const diag = await page.evaluate(async () => {
  const events = [];
  const obs = new MutationObserver(() =>
    events.push({ atY: Math.round(window.scrollY), to: document.body.dataset.polarity })
  );
  obs.observe(document.body, { attributes: true, attributeFilter: ['data-polarity'] });
  const samples = [];
  for (let y = 0; y <= 22000; y += 250) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
    samples.push({ y, pol: document.body.dataset.polarity });
  }
  obs.disconnect();
  return { events, samples: samples.filter((_, i) => i % 2 === 0) };
});
console.log('POLARITY FLIPS:', JSON.stringify(diag.events));
console.log('SAMPLES:', JSON.stringify(diag.samples));
console.log('ERRORS:', logs.length ? logs.join('\n') : '(none)');
await browser.close();
