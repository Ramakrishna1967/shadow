/* design parity — compares the live SHADOW page against the
   finished Recast reference: identical element counts and
   identical computed styles on every shared selector. */
import { chromium } from 'playwright-core';

const PROFILE = 'D:\\AgenticX\\shadow\\.chrome-profile';
const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: true,
  viewport: { width: 1600, height: 900 },
});

const SELECTORS = [
  '#hero-mark', '.hero-tag', '.hero-meta', '.hero-pipe', '.ticker',
  '.ch-stage', '.ch-head', '.ch-num', '.ch-tag', '.ch-title', '.ch-line',
  '.ch-glyph', '.ch-spec', '.spec-row', '.spec-k', '.spec-v',
  '.ch-stamp', '.sec-head', '.cells', '.cell', '.c-num', '.c-name',
  '.run-stage', '.run-mark', '.run-track', '.cmd-card', '.cc-c', '.cc-d',
  '.fin-stage', '.fin-frame', '.fin-l1', '.ft-mark', '.ft-row',
  '#hud', '#hud-glyph', '#loader', '.ld-count', '.ld-stamp', '#gate',
  '#mode-toggle', '.exit-stamp', '.conf', '.pr-cols', '.dv-row',
];
const COUNTS = [
  ['.chapter', 5], ['.ch-line', 5], ['.spec-row', 20], ['.cell', 10],
  ['.cmd-card', 8], ['.ch-stamp', 4], ['#hud [id]', 5],
];

const grab = async (url) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.getElementById('loader').style.display === 'none',
    null, { timeout: 20000 }
  );
  await page.waitForTimeout(1200);
  const data = await page.evaluate(({ selectors, counts }) => {
    const out = { styles: {}, counts: {}, logs: [] };
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) { out.styles[sel] = null; continue; }
      const cs = getComputedStyle(el);
      out.styles[sel] = [
        'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight',
        'maxWidth', 'textTransform', 'opacity',
      ].map((p) => cs[p]).join('|');
    }
    for (const [sel] of counts) out.counts[sel] = document.querySelectorAll(sel).length;
    return out;
  }, { selectors: SELECTORS, counts: COUNTS });
  await page.close();
  return data;
};

const recast = await grab('http://localhost:5173');
const shadow = await grab('http://localhost:5174');
await browser.close();

let diffs = 0;
/* intentional CSS deltas vs Recast: .hero-tag max-width 22ch → 40ch
   (shadow's tagline is longer than Recast's), the brand wordmark is
   authored in caps in the markup — #hero-mark / .ft-mark drop the
   uppercase transform so the name renders exactly "SHADOW" — and the
   finale drops Recast's .fin-l2 wordmark entirely, so .fin-l1 takes
   over the screen at a larger scale. everything else must be identical.
   opacity compared with tolerance because elements are sampled
   mid-animation at different frames. */
const IGNORE = {
  '.hero-tag': ['maxWidth'],
  '#hero-mark': ['textTransform'],
  '.fin-l1': ['fontSize', 'maxWidth', 'lineHeight'],
  '.ft-mark': ['textTransform'],
};
const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'maxWidth', 'textTransform', 'opacity'];
for (const sel of SELECTORS) {
  const a = recast.styles[sel], b = shadow.styles[sel];
  if (!a || !b) { diffs++; console.log(`DIFF ${sel} — missing on one page`); continue; }
  if (a === b) continue;
  const pa = a.split('|'), pb = b.split('|');
  const bad = [];
  PROPS.forEach((p, i) => {
    if (IGNORE[sel]?.includes(p)) return;
    if (pa[i] === pb[i]) return;
    if (p === 'opacity' && Math.abs(parseFloat(pa[i]) - parseFloat(pb[i])) <= 0.15) return;
    bad.push(`${p}: ${pa[i]} → ${pb[i]}`);
  });
  if (bad.length) { diffs++; console.log(`DIFF ${sel} — ${bad.join(' · ')}`); }
}
for (const [sel, want] of COUNTS) {
  const ok = shadow.counts[sel] === want;
  console.log(`${ok ? 'OK  ' : 'BAD '} count ${sel} = ${shadow.counts[sel]} (want ${want}, recast ${recast.counts[sel]})`);
  if (!ok) diffs++;
}
console.log(diffs === 0 ? '\nPARITY: identical computed styles on all shared selectors' : `\nPARITY: ${diffs} diffs`);
process.exit(diffs ? 1 : 0);
