/* probe the live SHADOW site — how does the NAME actually render?
   casing, letter-spacing, splitting — computed styles tell the truth. */
import { chromium } from 'playwright-core';

const browser = await chromium.launchPersistentContext('D:\\AgenticX\\shadow\\.chrome-profile', {
  channel: 'chrome',
  headless: true,
  viewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
await page.goto('https://tryshadow.vercel.app/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const probe = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: el.textContent.trim().slice(0, 48),
      textTransform: cs.textTransform,
      letterSpacing: cs.letterSpacing,
      fontFamily: cs.fontFamily.split(',')[0],
      fontSize: cs.fontSize,
    };
  };
  return {
    navBrand: pick('.brand-word'),
    heroTitle: pick('.hero-title'),
    heroSub: pick('.hero-sub'),
    heroMeta: pick('.hero-meta'),
    bootLine: pick('.boot-line'),
    problemH2: pick('#problem-title'),
    trustH2: pick('#trust-title'),
    footerBrand: pick('footer .brand-word, .foot .brand-word'),
    footerCopy: pick('footer p, .foot p'),
  };
});

/* how the hero title's split animation leaves the DOM — split? */
const splitInfo = await page.evaluate(() => {
  const h1 = document.querySelector('.hero-title');
  const h2 = document.querySelector('#problem-title');
  const describe = (el) =>
    el ? {
      childNodes: el.childNodes.length,
      hasSpans: !!el.querySelector('span'),
      spanCount: el.querySelectorAll('span').length,
      html: el.innerHTML.slice(0, 120),
    } : null;
  return { hero: describe(h1), h2: describe(h2) };
});

console.log(JSON.stringify({ probe, splitInfo }, null, 2));
await browser.close();
