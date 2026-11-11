/* full verification — self-calibrating zone walk + interactions.
   zone entry points are MEASURED from the live page using the
   same math the page's engine uses (flowTop through the
   pin-spacer, minus 55% of the viewport), so the test can never
   drift from layout. asserts per zone: polarity + HUD number +
   HUD label. plus: loader stamp, content transplant, hero
   magnetism, operator— agent toggle round-trip, end-of-chapter
   counters + stamps, console health, visual captures. */
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://localhost:5174';
const PROFILE = 'D:\\AgenticX\\shadow\\.chrome-profile';
const SHOTS = 'D:\\AgenticX\\shadow\\.shots';

const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: true,
  viewport: { width: 1600, height: 900 },
});
const page = browser.pages()[0] || (await browser.newPage());

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`));

let pass = 0, fail = 0;
const row = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(20)} ${detail}`);
  ok ? pass++ : fail++;
};

await page.goto(URL, { waitUntil: 'networkidle' });

/* 1 · loader — stamp reads READY while lit, then melts away */
let stampOk = false;
try {
  await page.waitForFunction(
    () => parseFloat(getComputedStyle(document.getElementById('ld-stamp')).opacity) > 0.5,
    null,
    { timeout: 15000 }
  );
  stampOk = (await page.textContent('#ld-stamp')).trim() === 'ready';
} catch {
  /* stamp never lit */
}
await page.waitForFunction(
  () => document.getElementById('loader').style.display === 'none',
  null,
  { timeout: 20000 }
);
await page.waitForTimeout(1800);
row(stampOk, 'loader stamp', stampOk ? 'ready stamped, screen melted' : 'stamp missing / never visible');

/* 2 · content transplant */
const content = await page.evaluate(() => ({
  mark: [...document.querySelectorAll('#hero-mark .ltr')].map((l) => l.textContent).join(''),
  tag: document.querySelector('.hero-tag').textContent.trim().slice(0, 26),
  fin: document.querySelector('.fin-l1').textContent.replace(/\u00A0/g, ' ').trim(),
  foot: document.querySelector('.ft-mark').textContent.trim(),
  toggle: document.getElementById('mode-toggle').textContent.replace(/\s+/g, ' ').trim(),
}));
row(content.mark === 'SHADOW', 'hero mark', JSON.stringify(content.mark));
row(content.tag.startsWith('Deploy desktop agents'), 'hero tag', JSON.stringify(content.tag));
row(content.fin === 'Put agents to work. Stay in charge.', 'finale copy', JSON.stringify(content.fin));
row(content.foot === 'SHADOW', 'footer mark', JSON.stringify(content.foot));
row(/OPERATOR/.test(content.toggle) && /AGENT/.test(content.toggle), 'mode labels', JSON.stringify(content.toggle));

/* 3 · self-calibrating zone walk — measure entries like the engine */
const zones = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('main [data-polarity], #footer')];
  const flowTop = (sec) => {
    const holder = sec.closest('.pin-spacer') || sec; /* pin-aware */
    return holder.getBoundingClientRect().top + window.scrollY;
  };
  return secs.map((sec) => ({
    id: sec.id,
    pol: sec.dataset.polarity,
    at: flowTop(sec) - innerHeight * 0.55,
  }));
});
const EXPECT = {
  hero: ['00', 'init'],
  'ch-problem': ['01', 'problem'],
  'ch-delegate': ['02', 'delegate'],
  'ch-steps': ['03', 'steps'],
  'ch-tools': ['04', 'tools'],
  'ch-trust': ['05', 'trust'],
  grid: ['06', 'the ten'],
  run: ['07', 'commands'],
  demo: ['08', 'demo'],
  faq: ['09', 'faq'],
  finale: ['10', 'SHADOW'],
  footer: ['11', 'ready'],
};
for (let i = 0; i < zones.length; i++) {
  const z = zones[i];
  const next = zones[i + 1];
  const y = next ? Math.max(0, (z.at + next.at) / 2) : 1e9; /* last → bottom */
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(600);
  const got = await page.evaluate(() => ({
    pol: document.body.dataset.polarity,
    num: document.getElementById('hud-num').textContent,
    lab: document.getElementById('hud-lab').textContent,
  }));
  const [n, l] = EXPECT[z.id] || ['??', '??'];
  const want = l.toUpperCase(); /* every HUD label renders uppercase */
  const ok = got.pol === z.pol && got.num === n && got.lab === want;
  row(ok, `zone ${z.id}`, `y=${Math.round(y)} pol=${got.pol}/${z.pol} num=${got.num}/${n} lab="${got.lab}"/"${want}"`);
}

/* 4 · end-of-chapter counters + stamps — park just before the
   next zone so the pinned timeline has run to its end */
const endOf = (id) => zones[zones.findIndex((z) => z.id === id) + 1].at - 40;

await page.evaluate((y) => window.scrollTo(0, y), endOf('ch-delegate'));
await page.waitForTimeout(1900);
const del = await page.evaluate(() => ({
  conf: document.getElementById('conf-val').textContent,
  stamp: parseFloat(getComputedStyle(document.querySelector('#ch-delegate .ch-stamp')).opacity),
}));
row(del.conf === '20', 'delegate counter', `AGENTS=${del.conf}/20 stampOp=${del.stamp}`);

await page.evaluate((y) => window.scrollTo(0, y), endOf('ch-tools'));
await page.waitForTimeout(1900);
const tools = await page.evaluate(() => ({
  div: document.getElementById('div-count').textContent,
  op: parseFloat(getComputedStyle(document.querySelector('#ch-tools .exit-stamp')).opacity),
  label: document.querySelector('#ch-tools .exit-stamp').textContent.trim(),
}));
row(tools.div === '6', 'tools counter', `GRANTED=${tools.div}/6`);
row(tools.op > 0.9 && tools.label === 'ASKS FIRST', 'asks-first slam', `op=${tools.op} "${tools.label}"`);

/* 5 · hero magnetism — letters write variable-font axes */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await page.mouse.move(800, 350);
await page.mouse.move(880, 430, { steps: 12 });
await page.waitForTimeout(700);
const mag = await page.evaluate(() => {
  const l = [...document.querySelectorAll('#hero-mark .ltr')];
  return {
    n: l.filter((x) => /wght/.test(x.style.fontVariationSettings || '')).length,
    sample: l[3].style.fontVariationSettings,
  };
});
row(mag.n >= 5 && /wght/.test(mag.sample || ''), 'hero magnetism', `${mag.n}/6 letters live · ${mag.sample}`);

/* 5b · store CTAs — big, one per bottom corner, both point at the listing */
const cta = await page.evaluate(() => {
  const all = [...document.querySelectorAll('a.cta-btn')];
  const rect = (sel) =>
    [...document.querySelectorAll(sel)].map((x) => {
      const r = x.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, h: r.height };
    });
  const hb = rect('.hero-cta .cta-btn');
  const fb = rect('.fin-cta .cta-btn');
  const tick = document.querySelector('.ticker').getBoundingClientRect();
  const stage = document.querySelector('.fin-stage').getBoundingClientRect();
  const near = (x, edge, span) => Math.abs(x - edge) < span;
  const vh = innerHeight;
  const tb = document.getElementById('mode-toggle').getBoundingClientRect();
  const dl = document.querySelectorAll('.hero-cta .cta-btn')[1];
  const dr = dl ? dl.getBoundingClientRect() : null;
  const hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  return {
    n: all.length,
    href: all[0] ? all[0].getAttribute('href') : '',
    blank: all.length > 0 && all.every((x) => x.target === '_blank' && /noopener/.test(x.rel)),
    labels: all.map((x) => x.textContent.trim()),
    size: hb.length ? Math.round(hb[0].h) : 0,
    diagonal:
      hb.length === 2 &&
      fb.length === 2 &&
      near(hb[0].left, 0, innerWidth * 0.1) &&
      hb[0].top > vh * 0.5 &&
      near(hb[1].right, innerWidth, innerWidth * 0.1) &&
      hb[1].top < vh * 0.5 &&
      near(fb[0].left, 0, innerWidth * 0.1) &&
      fb[0].top > stage.top + stage.height * 0.5 &&
      near(fb[1].right, innerWidth, innerWidth * 0.1) &&
      fb[1].top < stage.top + stage.height * 0.5,
    heroClear: hb[0].bottom <= tick.top - 4,
    clearToggle: dr ? !hit(dr, tb) : false,
    finVisible:
      fb.length === 2 &&
      getComputedStyle(document.querySelector('.fin-cta')).opacity !== '0',
  };
});
row(
  cta.n >= 4 && /9P52N15720DG/.test(cta.href) && cta.blank,
  'store cta',
  `${cta.n} links · ${cta.labels.join(' / ')}`
);
row(
  cta.size >= 60 && cta.diagonal && cta.heroClear && cta.clearToggle && cta.finVisible,
  'cta placement',
  `size=${cta.size}px diagonal=${cta.diagonal} heroClear=${cta.heroClear} toggleClear=${cta.clearToggle}`
);

/* 6 · machine mode — operator ↔ agent round-trip */
await page.evaluate(() => document.getElementById('mode-toggle').click());
await page.waitForTimeout(1400);
const m1 = await page.evaluate(() => ({
  cls: document.body.className,
  line: document.querySelector('#ch-problem .ch-line').textContent.slice(0, 22),
}));
await page.evaluate(() => document.getElementById('mode-toggle').click());
await page.waitForTimeout(1400);
const m2 = await page.evaluate(() => ({
  cls: document.body.className,
  line: document.querySelector('#ch-problem .ch-line').textContent.slice(0, 22),
}));
row(m1.cls.includes('machine') && m1.line.startsWith('{"t":"chores"'), 'machine on', JSON.stringify(m1));
row(!m2.cls.includes('machine') && m2.line.startsWith('Your day'), 'machine off', JSON.stringify(m2));

/* 7 · live chat demo — goal → plan → approval gate → run */
const demoZone = zones.find((z) => z.id === 'demo');
const finZone = zones.find((z) => z.id === 'finale');
await page.evaluate((y) => window.scrollTo(0, y), (demoZone.at + finZone.at) / 2);
await page.waitForTimeout(900);
await page.fill('#demo-text', 'Sort my Downloads by project.');
await page.press('#demo-text', 'Enter');
await page.waitForSelector('.plan .btn-primary', { timeout: 20000 });
await page.click('.plan .btn-primary');
await page.waitForSelector('.gate .btn-primary', { timeout: 20000 });
await page.click('.gate .btn-primary');
await page.waitForFunction(
  () => document.getElementById('ds-files').textContent === '148',
  null,
  { timeout: 25000 }
);
await page.waitForTimeout(700);
const chat = await page.evaluate(() => ({
  files: document.getElementById('ds-files').textContent,
  lines: document.querySelectorAll('.run-line').length,
  report: !!document.querySelector('.report'),
  agent: document.getElementById('dc-name').textContent,
  log: document.querySelectorAll('#ds-log li').length,
}));
row(chat.files === '148' && chat.lines >= 3, 'chat run', `FILES=${chat.files} lines=${chat.lines} agent=${chat.agent}`);
row(chat.report && chat.log >= 5, 'chat report', `report=${chat.report} log=${chat.log}`);

/* 8 · group chat — a crew plans, a second agent reviews */
await page.waitForFunction(
  () => document.getElementById('dc-state').dataset.s === 'ready',
  null,
  { timeout: 20000 }
);
await page.click('.demo-agent[data-agent="crew"]');
await page.waitForTimeout(400);
const crewHead = await page.evaluate(() => ({
  name: document.getElementById('dc-name').textContent,
  state: document.getElementById('dc-state').textContent,
  sys: !!document.querySelector('.demo-thread.is-on .msg.sys'),
  agents: document.querySelectorAll('.demo-thread.is-on .m-who').length,
}));
row(
  crewHead.name === 'Launch crew' && crewHead.sys && crewHead.agents >= 4,
  'crew chat',
  `${crewHead.name} · ${crewHead.state} · sys=${crewHead.sys} · agents=${crewHead.agents}`
);

await page.fill('#demo-text', "Launch is Thursday. What's left?");
await page.press('#demo-text', 'Enter');
await page.waitForSelector('.demo-thread.is-on .plan .btn-primary', { timeout: 25000 });
const crewPlan = await page.evaluate(() =>
  document.querySelector('.demo-thread.is-on .plan-h').textContent
);
await page.click('.demo-thread.is-on .plan .btn-primary');
await page.waitForSelector('.demo-thread.is-on .gate .btn-primary', { timeout: 25000 });
const crewGate = await page.evaluate(
  () =>
    `${document.querySelector('.demo-thread.is-on .gate-h').textContent}|${document.querySelector('.demo-thread.is-on .gate-meta').textContent}`
);
await page.click('.demo-thread.is-on .gate .btn-primary');
await page.waitForSelector('.demo-thread.is-on .report', { timeout: 40000 });
await page.waitForFunction(
  () => document.getElementById('dc-state').dataset.s === 'ready',
  null,
  { timeout: 25000 }
);
const crew = await page.evaluate(() => {
  const on = document.querySelector('.demo-thread.is-on');
  const whos = [...on.querySelectorAll('.m-who')].map((n) => n.textContent);
  return {
    lines: on.querySelectorAll('.run-line').length,
    marks: [...new Set(whos.map((w) => w.split(' ')[0]))],
    report: !!on.querySelector('.report'),
  };
});
row(crewPlan.includes('CREW PLAN'), 'crew plan', crewPlan.slice(0, 44));
row(
  crewGate.includes('CREW APPROVAL REQUIRED') && /reviewed by/.test(crewGate),
  'crew gate',
  crewGate.slice(0, 74)
);
row(
  crew.lines >= 4 && crew.report && crew.marks.includes('W') && crew.marks.includes('R'),
  'crew run',
  `lines=${crew.lines} marks=${crew.marks.join(' ')} report=${crew.report}`
);

/* 8b · FAQ — 8 verbatim rows, opens without clipping, one open at a time */
const faqZone = zones.find((z) => z.id === 'faq');
await page.evaluate((y) => window.scrollTo(0, y), faqZone.at + 200);
await page.waitForTimeout(1000);
const faq = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#faq .qa')];
  return {
    n: rows.length,
    first: rows[0]?.querySelector('.qa-q')?.textContent.trim(),
    last: rows[7]?.querySelector('.qa-q')?.textContent.trim(),
    revealed: document.getElementById('faq-list').classList.contains('is-in'),
    numbers: rows.map((r) => r.querySelector('.qa-n').textContent).join(','),
  };
});
row(
  faq.n === 8 &&
    faq.first === 'Does my data leave my PC?' &&
    faq.last === 'What if a run fails or hits a limit?' &&
    faq.numbers === '01,02,03,04,05,06,07,08',
  'faq rows',
  `${faq.n} rows · "${faq.first}" … "${faq.last}"`
);
row(faq.revealed, 'faq reveal', `is-in=${faq.revealed}`);

await page.click('#faq .qa:nth-child(1) summary');
await page.waitForTimeout(800);
const faqOpen = await page.evaluate(() => {
  const qa = document.querySelector('#faq .qa');
  const body = qa.querySelector('.qa-a');
  const p = body.querySelector('p');
  const br = body.getBoundingClientRect();
  const pr = p.getBoundingClientRect();
  return {
    open: qa.open,
    h: Math.round(br.height),
    text: p.textContent.trim().slice(0, 34),
    clipped: pr.bottom > br.bottom + 1 || br.height < pr.height,
    others: document.querySelectorAll('#faq .qa[open]').length,
  };
});
row(
  faqOpen.open && faqOpen.h > 30 && !faqOpen.clipped && faqOpen.others === 1,
  'faq open',
  `h=${faqOpen.h}px clipped=${faqOpen.clipped} open=${faqOpen.others} "${faqOpen.text}…"`
);
await page.click('#faq .qa:nth-child(1) summary');
await page.waitForTimeout(700);
const faqClosed = await page.evaluate(() => {
  const qa = document.querySelector('#faq .qa');
  return { open: qa.open, h: Math.round(qa.querySelector('.qa-a').getBoundingClientRect().height) };
});
row(!faqClosed.open && faqClosed.h === 0, 'faq close', `open=${faqClosed.open} h=${faqClosed.h}px`);

/* 8c · footer legal row + the two legal pages */
const legal = await page.evaluate(() =>
  [...document.querySelectorAll('.ft-legal a')].map((a) => `${a.textContent.trim()}=${a.getAttribute('href')}`)
);
row(
  legal.join('|') === 'FAQ=#faq|PRIVACY=privacy.html|TERMS=terms.html',
  'footer legal',
  legal.join(' · ')
);

for (const [file, title, heading, must] of [
  ['privacy.html', 'Privacy', 'Privacy', 'SHADOW has no cloud service, account, relay, or sync of its own.'],
  ['terms.html', 'Terms of use', 'Terms of use', 'SHADOW is provided "as is", without warranty of any kind. It may contain bugs.'],
]) {
  const legalUrl = new globalThis.URL(file, URL).href;
  const res = await page.context().request.get(legalUrl);
  const html = await res.text();
  const chrome =
    /id="topbar"/.test(html) &&
    /class="lg-ticker-track/.test(html) &&
    /class="lg-mark/.test(html) &&
    /id="grain"/.test(html) &&
    /src="[^"]*legal[^"]*\.js[^"]*"/.test(html) &&
    !/id="gate"/.test(html);
  const ok =
    res.ok() &&
    /<h1 class="lg-h1[^"]* display">/.test(html) &&
    html.includes(`>${heading}</h1>`) &&
    html.includes(must) &&
    /<span>SHADOW<\/span>/.test(html) &&
    chrome;
  row(
    ok,
    `legal ${title.toLowerCase()}`,
    `${res.status()} h1="${heading}" body=${html.includes(must)} chrome=${chrome}`
  );
}

/* 8d · finale stage — one screen, motion-graphics entrance, no pin */
const finPage = await page.context().newPage();
await finPage.goto(URL, { waitUntil: 'networkidle' });
await finPage
  .waitForFunction(() => document.getElementById('loader').style.display === 'none', null, { timeout: 20000 })
  .catch(() => {});
await finPage.waitForTimeout(1200);
const finTop = await finPage.evaluate(() => {
  const fin = document.getElementById('finale');
  const holder = fin.closest('.pin-spacer') || fin;
  return holder.getBoundingClientRect().top + window.scrollY;
});
await finPage.evaluate((y) => window.scrollTo(0, y), finTop - 820);
await finPage.waitForTimeout(700);
const finArmed = await finPage.evaluate(() => {
  const c = document.querySelector('.fin-l1 .ch');
  const frame = document.querySelector('.fin-frame');
  return {
    op: +getComputedStyle(c).opacity,
    fx: getComputedStyle(frame).getPropertyValue('--fx').trim(),
    pin: !!document.getElementById('finale').closest('.pin-spacer'),
    chars: document.querySelectorAll('.fin-l1 .ch').length,
    sweep: !!document.querySelector('.fin-sweep'),
  };
});
row(
  !finArmed.pin && finArmed.chars > 20 && finArmed.sweep && finArmed.op < 0.2 && finArmed.fx === '0',
  'finale armed',
  `pin=${finArmed.pin} chars=${finArmed.chars} sweep=${finArmed.sweep} charOp=${finArmed.op} crosshair=${finArmed.fx}`
);

await finPage.evaluate((y) => window.scrollTo(0, y), finTop + 120);
await finPage.waitForTimeout(2600);
const finDone = await finPage.evaluate(() => {
  const c1 = [...document.querySelectorAll('.fin-l1 .ch')];
  const l1 = document.querySelector('.fin-l1');
  const cs = (el) => getComputedStyle(el);
  const flat = (c) => {
    const t = cs(c).transform;
    return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
  };
  const box = l1.getBoundingClientRect();
  return {
    copy: c1.every((c) => +cs(c).opacity > 0.95 && flat(c)),
    l1: Math.round(box.height / parseFloat(cs(l1).lineHeight)),
    fit: Math.round(l1.scrollWidth - l1.clientWidth),
    frame: +cs(document.querySelector('.fin-frame')).opacity,
    sweep: +cs(document.querySelector('.fin-sweep')).opacity,
    wordmark: !!document.querySelector('.fin-l2'),
    cta: [...document.querySelectorAll('.fin-cta .cta-btn')].map((b) => +cs(b).opacity),
    over: Math.round(document.documentElement.scrollWidth - innerWidth),
  };
});
row(
  finDone.copy &&
    !finDone.wordmark &&
    finDone.l1 <= 2 &&
    finDone.fit <= 1 &&
    finDone.frame > 0.95 &&
    finDone.sweep < 0.05 &&
    finDone.cta.every((o) => o > 0.95) &&
    finDone.over === 0,
  'finale settled',
  `copy=${finDone.copy} wordmark=${finDone.wordmark} lines=${finDone.l1} fit=${finDone.fit} frame=${finDone.frame} sweep=${finDone.sweep} cta=${finDone.cta.join(',')} over=${finDone.over}`
);
await finPage.close();

const rmPage = await page.context().newPage();
await rmPage.emulateMedia({ reducedMotion: 'reduce' });
await rmPage.goto(URL, { waitUntil: 'networkidle' });
await rmPage
  .waitForFunction(() => document.getElementById('loader').style.display === 'none', null, { timeout: 20000 })
  .catch(() => {});
await rmPage.waitForTimeout(900);
await rmPage.evaluate(() => document.getElementById('finale').scrollIntoView());
await rmPage.waitForTimeout(700);
const rm = await rmPage.evaluate(() => {
  const c1 = [...document.querySelectorAll('.fin-l1 .ch')];
  return {
    op: +getComputedStyle(c1[0]).opacity,
    flat: c1.every((c) => {
      const t = getComputedStyle(c).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    }),
    sweep: +getComputedStyle(document.querySelector('.fin-sweep')).opacity,
  };
});
row(rm.op > 0.95 && rm.flat && rm.sweep < 0.05, 'finale reduced motion', `copy=${rm.op} flat=${rm.flat} sweep=${rm.sweep}`);

await rmPage.evaluate(() => document.getElementById('footer').scrollIntoView());
await rmPage.waitForTimeout(700);
const rmFoot = await rmPage.evaluate(() => {
  const chars = [...document.querySelectorAll('.ft-mark .ch')];
  return {
    n: chars.length,
    flat: chars.every((c) => {
      const t = getComputedStyle(c).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    }),
  };
});
row(rmFoot.n === 6 && rmFoot.flat, 'footer reduced motion', `chars=${rmFoot.n} flat=${rmFoot.flat}`);
await rmPage.close();

/* 9 · console health */
const errs = logs.filter((l) => l.startsWith('[error]') || l.startsWith('[PAGEERROR]'));
row(errs.length === 0, 'console clean', errs.length ? errs.join(' | ') : `${logs.length} messages, 0 errors`);

/* 10 · visual captures */
import { mkdirSync } from 'node:fs';
mkdirSync(SHOTS, { recursive: true });
const shoot = async (name, y) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}\\${name}.png` });
};
await shoot('01-hero', 0);
await shoot('02-problem', endOf('ch-problem') - 300);
await shoot('03-tools', endOf('ch-tools') - 500);
await shoot('04-run', (zones.find((z) => z.id === 'run').at + demoZone.at) / 2);
await shoot('05-demo', (demoZone.at + finZone.at) / 2);
await shoot('06-faq', faqZone.at + 200);
await shoot('07-finale', (finZone.at + zones.find((z) => z.id === 'footer').at) / 2);
console.log(`SHOTS → ${SHOTS}`);

console.log(`\n${pass} PASS / ${fail} FAIL`);
await browser.close();
process.exit(fail ? 1 : 0);

