/* ── live demo ───────────────────────────────────────────────
   a real, local chat with the four SHADOW agents. no network,
   no model key: goals are routed by keyword and every run is
   staged so you can walk the whole loop yourself —
   goal → plan → approval gate → progress → report.
   deny always wins. every action is logged. undo is ready.
────────────────────────────────────────────────────────── */

const AGENTS = {
  research: { mark: 'R', name: 'Research' },
  files: { mark: 'F', name: 'File Organizer' },
  code: { mark: 'C', name: 'Code Agent' },
  writer: { mark: 'W', name: 'Report Writer' },
  crew: { mark: '◆', name: 'Launch crew' },
};

/* group chat: a primary agent runs the plan, a second agent
   reviews the output before it reaches you. */
const REVIEWERS = {
  research: 'writer',
  files: 'code',
  code: 'writer',
  writer: 'code',
  crew: 'code',
};
const REVIEW_LINES = {
  code: "I'll verify the build and review the diff before it ships.",
  writer: "I'll read the output and check it against the brief.",
  research: "I'll check every source before anything ships.",
  files: "I'll verify the undo log after the run.",
};
const REVIEW_DONE = {
  code: 'Reviewed. Build and diff are clean — nothing else was touched.',
  writer: 'Reviewed. Reads right and matches the brief.',
  research: 'Reviewed. Every claim has a source.',
  files: 'Reviewed. Undo log verified.',
};

const GREETINGS = {
  research:
    "I'm Research. I read public sources and cite everything. Give me a question or a comparison to run.",
  files:
    "I'm File Organizer. I can sort, rename, and move files on this PC — with an undo log for every run.",
  code:
    "I'm Code Agent. I reproduce the failure first, then fix the smallest thing that makes it pass.",
  writer:
    "I'm Report Writer. I turn PRs, logs, and notes into a draft you can edit before anything ships.",
};

/* ── scenarios ─────────────────────────────────────────────
   copy lifted from the product's own promises: plans first,
   then asks; your keys, your models; every action logged;
   deny wins; no SHADOW cloud. */

const FILES = {
  agent: 'files',
  ack: "On it. I'll read the Downloads folder, group everything by project, and move the files. I won't touch a single one until you approve the plan.",
  plan: {
    steps: [
      'Scan <em>C:\\Users\\you\\Downloads</em> and index every file',
      'Group by project and type — docs, installers, images, archives',
      'Create six folders and move the files',
      'Write an undo log so one command reverses the run',
    ],
  },
  gate: {
    action: 'Move 148 files into 6 folders.',
    target: 'C:\\Users\\you\\Downloads · write',
    risk: 'FILE WRITE',
  },
  lines: [
    'scanning downloads · 148 files',
    'grouping by project · 6 groups',
    'moving files · 148/148',
    'writing undo log · undo.ps1',
  ],
  report: {
    title: 'DOWNLOADS SORTED',
    rows: [
      ['files moved', '148'],
      ['folders', '6'],
      ['undo', 'undo.ps1'],
      ['elapsed', '38s'],
    ],
  },
  metrics: { approvals: '1', actions: 6, files: 148, tests: '—' },
  log: [
    'goal · sort downloads',
    'plan approved',
    'allowed · move files',
    '148 files moved',
    'undo.ps1 written',
  ],
  done: 'Done. 148 files are in 6 folders, and undo.ps1 reverses all of it. Want me to do this every Friday?',
};

const RESEARCH = {
  agent: 'research',
  ack: "I'll compare them from public sources only — no sign-ups, no paywalls. Every claim gets a link you can check.",
  plan: {
    steps: [
      'Open vendor pricing pages for the three tools',
      'Read docs for limits, SSO, and Windows support',
      "Score each tool against your team's requirements",
      'Write a one-page brief with sources',
    ],
  },
  gate: {
    action: 'Browse 9 public pages. Read only.',
    target: 'browser · read-only',
    risk: 'BROWSER',
  },
  lines: [
    'opening pricing pages · 3',
    'reading docs · 6 more',
    'extracting price + limits · 27 points',
    'writing brief · brief.md',
  ],
  report: {
    title: 'TOOL COMPARISON',
    rows: [
      ['tools', '3'],
      ['sources', '9'],
      ['best price', 'Tool B · $8/seat'],
      ['verdict', 'Tool B for 5 seats'],
    ],
  },
  metrics: { approvals: '1', actions: 9, files: 1, tests: '—' },
  log: [
    'goal · compare tools',
    'plan approved',
    'allowed · browse read-only',
    '27 data points',
    'brief.md written',
  ],
  done: 'Brief is ready at brief.md. Tool B wins on price and SSO, but check the note on its audit log before you commit.',
};

const CODE = {
  agent: 'code',
  ack: "I'll reproduce the failure first, then fix the smallest thing that makes it pass. No sweeping refactors.",
  plan: {
    steps: [
      'Run the api suite and capture the failing tests',
      'Read the failure at <em>auth.spec.ts:42</em>',
      'Patch the token refresh handler in one file',
      'Rerun the suite and show you the diff',
    ],
  },
  gate: {
    action: 'Run tests and edit 1 file.',
    target: 'repo · terminal + write',
    risk: 'TERMINAL',
  },
  lines: [
    'running api tests · 3 failed',
    'reading failure · auth.spec.ts:42',
    'patching handler · 1 file',
    'rerunning tests · 12/12',
  ],
  extra: 'diff',
  report: {
    title: 'FIX VERIFIED',
    rows: [
      ['tests', '12/12'],
      ['files changed', '1'],
      ['diff', '+8 −3'],
      ['suite time', '4.2s'],
    ],
  },
  metrics: { approvals: '1', actions: 5, files: 1, tests: '12/12' },
  log: [
    'goal · fix api tests',
    'plan approved',
    'allowed · run + edit',
    'auth handler patched',
    'tests 12/12',
  ],
  done: 'Fixed. The suite is green at 12/12 and the diff is +8 −3 in one file. Nothing else was touched.',
};

const WRITER = {
  agent: 'writer',
  ack: "I'll pull this week's merged pull requests, group them by area, and draft the notes in your voice. You approve before anything is published.",
  plan: {
    steps: [
      'List merged PRs since Monday',
      'Group by feature, fix, and internal',
      'Draft release notes in your voice',
      'Check every link and version number',
    ],
  },
  gate: {
    action: 'Read 24 pull requests and draft notes.',
    target: 'repo · read + draft',
    risk: 'READ',
  },
  lines: [
    'reading merged PRs · 24',
    'grouping by area · 4 sections',
    'drafting notes · release-notes.md',
    'checking links · 11/11',
  ],
  report: {
    title: 'RELEASE NOTES',
    rows: [
      ['pull requests', '24'],
      ['sections', '4'],
      ['draft', 'release-notes.md'],
      ['links checked', '11/11'],
    ],
  },
  metrics: { approvals: '1', actions: 4, files: 1, tests: '—' },
  log: [
    'goal · draft release notes',
    'plan approved',
    'allowed · read + draft',
    '24 PRs grouped',
    'release-notes.md written',
  ],
  done: 'Draft is at release-notes.md — four sections, 24 PRs, every link checked. Edit anything, then approve it for publishing.',
};

const LAUNCH = {
  agent: 'writer',
  reviewer: 'research',
  ack: "Let me read the task board and the run log, then I'll tell you exactly what's left — no guessing.",
  plan: {
    steps: [
      "Read the task board and this week's run log",
      'Cross-check shipped work against the launch checklist',
      'List open items and blockers with owners',
    ],
  },
  gate: {
    action: 'Read the task board. No writes.',
    target: 'board · read-only',
    risk: 'READ',
  },
  lines: [
    'reading task board · 23 items',
    'cross-checking shipped work · 18 done',
    'listing open items · 5 left',
    'finding blockers · 1',
  ],
  report: {
    title: 'LAUNCH · THURSDAY',
    rows: [
      ['done', '18'],
      ['left', '5'],
      ['blocker', 'Store screenshots'],
      ['owner', 'you'],
    ],
  },
  metrics: { approvals: '1', actions: 3, files: 0, tests: '—' },
  log: [
    'goal · launch status',
    'plan approved',
    'allowed · read board',
    '18 done · 5 left',
    '1 blocker found',
  ],
  done: 'Five things left, one blocker: the Store screenshots. Everything else can land before Thursday if the screenshots are shot today.',
};

const ROUTINE = {
  agent: 'files',
  ack: 'I can run that as a routine on this PC. It stays local, and the skill file is plain text you can read and edit.',
  plan: {
    steps: [
      'Write the routine as an editable skill file',
      'Set the schedule — Fridays at 17:00',
      'Dry-run it once and show the result',
      'Wait for your approval to enable it',
    ],
  },
  gate: {
    action: 'Write routine file and enable schedule.',
    target: 'C:\\Users\\you\\.shadow\\routines · write',
    risk: 'SCHEDULE',
  },
  lines: [
    'writing routine · friday-tidy.md',
    'setting schedule · fri 17:00',
    'dry run · 12 files moved',
    'waiting for enable · approved',
  ],
  extra: 'routine',
  report: {
    title: 'ROUTINE READY',
    rows: [
      ['schedule', 'every Fri · 17:00'],
      ['runs', 'dry run only'],
      ['files', '12'],
      ['undo', 'undo.ps1'],
    ],
  },
  metrics: { approvals: '1', actions: 2, files: 12, tests: '—' },
  log: [
    'goal · weekly routine',
    'plan approved',
    'allowed · write + schedule',
    'dry run 12 files',
    'routine enabled',
  ],
  done: 'Routine enabled. Every Friday at 17:00 it tidies the desktop and leaves a one-line summary. Say “undo” to reverse the last run.',
};

const UNDO = {
  agent: 'files',
  ack: 'Rolling back the last run from its undo log. This is exactly why every action is logged.',
  plan: {
    steps: [
      'Read undo.ps1 from the last run',
      'Reverse the 148 moves in order',
      'Verify every file is back where it started',
    ],
  },
  gate: {
    action: 'Reverse the last run — 148 moves.',
    target: 'undo.ps1 · write',
    risk: 'FILE WRITE',
  },
  lines: [
    'reading undo.ps1 · 148 entries',
    'reversing moves · 148/148',
    'verifying paths · 148/148',
    'closing run · clean',
  ],
  report: {
    title: 'RUN REVERSED',
    rows: [
      ['files restored', '148'],
      ['conflicts', '0'],
      ['undo log', 'consumed'],
    ],
  },
  metrics: { approvals: '1', actions: 3, files: 0, tests: '—' },
  log: [
    'goal · undo last run',
    'plan approved',
    'allowed · reverse moves',
    '148 files restored',
    '0 conflicts',
  ],
  done: 'Undone. All 148 files are back where they started and the undo log is consumed. Nothing was lost.',
};

const GREET = {
  agent: null,
  ack: "I'm ready. Give me a goal — files, code, research, or a report. I'll write a plan and wait for your approval before I touch anything.",
  plan: null,
};

/* ── routing ───────────────────────────────────────────── */

function route(text) {
  const s = text.toLowerCase();
  if (/^(hi|hello|hey|yo|sup)\b/.test(s) && s.length < 28) return GREET;
  if (/\b(undo|revert|roll ?back)\b/.test(s)) return UNDO;
  if (/\b(every (friday|week|monday)|routine|schedule|recurring)\b/.test(s)) return ROUTINE;
  if (/\b(sort|downloads?|folders?|organi[sz]e|files?|desktop)\b/.test(s)) return FILES;
  if (/\b(tests?|fix|bug|api|code|patch|build|compile)\b/.test(s)) return CODE;
  if (/\b(release|notes?|draft|summary|report|write)\b/.test(s)) return WRITER;
  if (/\b(launch|crew|status|what'?s left|thursday|blockers?)\b/.test(s)) return LAUNCH;
  if (/\b(research|compare|competitors?|tools?|pricing|price|vendors?)\b/.test(s)) return RESEARCH;
  return null;
}

function generic() {
  return {
    agent: active === 'crew' ? 'research' : active,
    ack: "Got it. I'll write a plan first, show you every step, and wait for your approval before I run anything.",
    plan: {
      steps: [
        'Break the goal into the smallest safe steps',
        'Check which tools the plan needs',
        'Show you the plan and wait for approval',
        'Run it, log every action, and report back',
      ],
    },
    gate: {
      action: 'Run the plan. Every action is logged.',
      target: 'your PC · scoped',
      risk: 'APPROVAL',
    },
    lines: [
      'reading goal · 1',
      'checking tools · scoped',
      'running plan · 3 actions',
      'writing report · done',
    ],
    report: {
      title: 'RUN COMPLETE',
      rows: [
        ['actions', '3'],
        ['files', '0'],
        ['errors', '0'],
        ['undo', 'ready'],
      ],
    },
    metrics: { approvals: '1', actions: 3, files: 0, tests: '—' },
    log: ['goal received', 'plan approved', 'allowed · run plan', '3 actions run', 'report written'],
    done: 'Done. Three actions, zero errors, and undo is ready. Want me to turn this into a routine?',
  };
}

/* ── runtime state ─────────────────────────────────────── */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const threads = {};
const greeted = new Set();
let active = 'research';
let busy = false;
let token = 0;
const queue = [];

let msgs, dcMark, dcName, dcState, dsLog;

const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const abort = (t) => t !== token;
const threadOf = (id) => threads[id];

function scrollBottom() {
  requestAnimationFrame(() => {
    msgs.scrollTop = msgs.scrollHeight;
  });
}

function stateLabel(s) {
  if (active === 'crew') return s === 'ready' ? '4 agents' : s;
  return s;
}

function idleLabel(id) {
  return id === 'crew' ? '4 agents' : 'idle';
}

function setState(s) {
  const text = stateLabel(s);
  dcState.textContent = text;
  dcState.dataset.s = s;
  const b = document.querySelector(`.demo-agent[data-agent="${active}"]`);
  if (b) b.querySelector('.da-state').textContent = text;
}

function setAgent(id) {
  if (!AGENTS[id] || id === active) return;
  active = id;
  document.querySelectorAll('.demo-agent').forEach((b) => {
    const on = b.dataset.agent === id;
    b.classList.toggle('is-on', on);
    b.querySelector('.da-state').textContent = on
      ? stateLabel(busy ? 'working' : 'ready')
      : idleLabel(b.dataset.agent);
  });
  dcMark.textContent = AGENTS[id].mark;
  dcName.textContent = AGENTS[id].name;
  setState(busy ? 'working' : 'ready');
  Object.entries(threads).forEach(([k, t]) => t.classList.toggle('is-on', k === id));
  if (!greeted.has(id)) {
    greeted.add(id);
    greet(id);
  }
  scrollBottom();
}

/* ── message builders ──────────────────────────────────── */

function whoText(threadId, speakerId) {
  const a = AGENTS[speakerId] || AGENTS[threadId];
  return threadId === 'crew' ? `${a.mark} · ${a.name}` : `${a.name} · agent`;
}

function sayNow(threadId, speakerId, text) {
  const thread = threads[threadId];
  if (!thread) return;
  const msg = el('div', 'msg agent');
  const who = el('div', 'm-who mono');
  who.textContent = whoText(threadId, speakerId);
  const body = el('div', 'm-body');
  body.textContent = text;
  msg.append(who, body);
  thread.appendChild(msg);
  scrollBottom();
}

function greet(id) {
  if (id === 'crew') {
    const sys = el('div', 'msg sys');
    const b = el('div', 'm-body');
    b.textContent = 'LAUNCH CREW JOINED · 4 AGENTS · YOU APPROVE EVERY ACTION';
    sys.appendChild(b);
    threads.crew.appendChild(sys);
    [
      ['research', "I'm on sources and the task board."],
      ['code', "I'm on build, tests, and the package."],
      ['writer', "I'm on the announcement and the launch note."],
      ['files', "I'm on screenshots and assets."],
    ].forEach(([sid, text]) => sayNow('crew', sid, text));
    scrollBottom();
    return;
  }
  sayNow(id, id, GREETINGS[id]);
}

function addUser(text) {
  const thread = threads[active];
  const msg = el('div', 'msg user');
  const who = el('div', 'm-who mono');
  who.textContent = 'you';
  const body = el('div', 'm-body');
  body.textContent = text;
  msg.append(who, body);
  thread.appendChild(msg);
  scrollBottom();
}

async function agentSay(threadId, text, t, speakerId = threadId) {
  const thread = threads[threadId];
  if (!thread) return false;
  const msg = el('div', 'msg agent');
  const who = el('div', 'm-who mono');
  who.textContent = whoText(threadId, speakerId);
  const body = el('div', 'm-body');
  msg.append(who, body);
  thread.appendChild(msg);
  scrollBottom();

  if (reduced) {
    body.textContent = text;
    scrollBottom();
    await wait(220);
    return !abort(t);
  }

  const dots = el('span', 'm-dots');
  dots.innerHTML = '<i></i><i></i><i></i>';
  body.appendChild(dots);
  await wait(420);
  if (abort(t)) {
    msg.remove();
    return false;
  }
  body.textContent = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; i += 2) {
    body.textContent = chars.slice(0, i + 2).join('');
    if (i % 12 === 0) scrollBottom();
    await wait(11);
    if (abort(t)) return false;
  }
  body.textContent = text;
  scrollBottom();
  return true;
}

function btn(label, cls) {
  const b = el('button', `btn ${cls || ''}`.trim());
  b.type = 'button';
  b.textContent = label;
  return b;
}

function planCard(sc, group) {
  return new Promise((resolve) => {
    const card = el('div', 'plan');
    const h = el('div', 'plan-h mono');
    h.innerHTML = group
      ? `<b>CREW PLAN</b><span>2 AGENTS · NOTHING RUN YET</span>`
      : `<b>PLAN</b><span>${sc.plan.steps.length} STEPS · NOTHING RUN YET</span>`;
    card.appendChild(h);
    sc.plan.steps.forEach((s, i) => {
      const row = el('div', 'plan-row');
      const n = el('span', 'pr-n mono');
      n.textContent = String(i + 1).padStart(2, '0');
      const t = el('span', 'pr-t');
      t.innerHTML = s;
      row.append(n, t);
      card.appendChild(row);
    });
    const acts = el('div', 'plan-acts');
    const yes = btn('Approve plan', 'btn-primary');
    const no = btn('Deny', 'btn-ghost');
    acts.append(yes, no);
    card.appendChild(acts);
    threads[active].appendChild(card);
    scrollBottom();

    const done = (v) => {
      acts.querySelectorAll('button').forEach((b) => (b.disabled = true));
      (v === 'approve' ? yes : no).classList.add('chosen');
      resolve(v);
    };
    yes.addEventListener('click', () => done('approve'));
    no.addEventListener('click', () => done('deny'));
  });
}

function gateCard(sc, group, reviewer) {
  return new Promise((resolve) => {
    const card = el('div', 'gate');
    const h = el('div', 'gate-h mono');
    h.innerHTML = group
      ? `<b>CREW APPROVAL REQUIRED</b><span>${sc.gate.risk}</span>`
      : `<b>APPROVAL REQUIRED</b><span>${sc.gate.risk}</span>`;
    const t = el('div', 'gate-t');
    t.textContent = sc.gate.action;
    const meta = el('div', 'gate-meta');
    meta.textContent = group
      ? `${sc.gate.target} · reviewed by ${AGENTS[reviewer].name}`
      : sc.gate.target;
    const acts = el('div', 'gate-acts');
    const once = btn('Allow once', 'btn-primary');
    const always = btn('Always allow', '');
    const deny = btn('Deny', 'btn-ghost');
    acts.append(once, always, deny);
    card.append(h, t, meta, acts);
    threads[active].appendChild(card);
    scrollBottom();

    const done = (v) => {
      acts.querySelectorAll('button').forEach((b) => (b.disabled = true));
      resolve(v);
    };
    once.addEventListener('click', () => done('once'));
    always.addEventListener('click', () => done('always'));
    deny.addEventListener('click', () => done('deny'));
  });
}

async function progress(sc, t, speakerId) {
  const wrap = el('div', 'run-lines');
  threads[active].appendChild(wrap);
  scrollBottom();
  for (const line of sc.lines) {
    const row = el('div', 'run-line');
    const k = el('span', 'rl-k mono');
    k.textContent = '·';
    const tx = el('span', 'rl-t mono');
    tx.textContent = line;
    row.append(k, tx);
    if (speakerId && AGENTS[speakerId]) {
      const a = el('span', 'rl-a mono');
      a.textContent = AGENTS[speakerId].mark;
      row.insertBefore(a, tx);
    }
    wrap.appendChild(row);
    scrollBottom();
    await wait(120);
    if (abort(t)) return false;
    row.classList.add('on');
    await wait(reduced ? 90 : 520);
    if (abort(t)) return false;
    k.textContent = '✓';
    await wait(120);
  }
  return true;
}

function reportCard(sc) {
  const card = el('div', 'report');
  const h = el('div', 'rep-h mono');
  h.innerHTML = `<b>${sc.report.title}</b><span>DONE</span>`;
  card.appendChild(h);
  sc.report.rows.forEach(([k, v]) => {
    const row = el('div', 'rep-row');
    const ks = el('span');
    ks.textContent = k;
    const vb = el('b');
    vb.textContent = v;
    row.append(ks, vb);
    card.appendChild(row);
  });
  threads[active].appendChild(card);
  scrollBottom();
}

function diffCard() {
  const card = el('div', 'diff');
  const h = el('div', 'diff-h');
  h.innerHTML = '<b>DIFF · auth.ts</b><span>+8 −3</span>';
  card.appendChild(h);
  [
    ['del', '- const ttl = 60;'],
    ['add', '+ const ttl = 300;'],
    ['add', '+ if (!token) return refresh();'],
    ['del', '- if (expired) throw err;'],
    ['add', '+ if (expired) return refresh();'],
  ].forEach(([k, line]) => {
    const l = el('div', `dl ${k}`);
    l.textContent = line;
    card.appendChild(l);
  });
  threads[active].appendChild(card);
  scrollBottom();
}

function routineCard() {
  const card = el('div', 'routine');
  const h = el('div', 'rt-h');
  h.innerHTML = '<b>ROUTINE · friday-tidy</b><span>EVERY FRI · 17:00</span>';
  card.appendChild(h);
  [
    ['17:00', 'scan the desktop'],
    ['17:01', 'group by type and project'],
    ['17:02', 'move files, write undo log'],
    ['17:03', 'send a one-line summary'],
  ].forEach(([time, step]) => {
    const l = el('div', 'rt-line');
    const i = el('i');
    i.textContent = time;
    const s = el('span');
    s.textContent = step;
    l.append(i, s);
    card.appendChild(l);
  });
  threads[active].appendChild(card);
  scrollBottom();
}

/* ── run status rail ───────────────────────────────────── */

function flash(node) {
  node.classList.remove('flash');
  void node.offsetWidth;
  node.classList.add('flash');
}

function setMetric(key, value) {
  const node = document.getElementById(`ds-${key}`);
  if (!node) return;
  node.textContent = value;
  flash(node);
}

function countTo(key, to, t) {
  const node = document.getElementById(`ds-${key}`);
  if (!node) return;
  const from = parseInt(node.textContent, 10) || 0;
  if (reduced || from === to) {
    node.textContent = String(to);
    flash(node);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    if (abort(t)) return;
    const p = Math.min(1, (now - start) / 700);
    node.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
    else {
      node.textContent = String(to);
      flash(node);
    }
  };
  requestAnimationFrame(step);
}

function log(text) {
  const li = el('li');
  li.textContent = text;
  dsLog.appendChild(li);
  while (dsLog.children.length > 7) dsLog.firstElementChild.remove();
}

/* ── the run loop ──────────────────────────────────────── */

function finish() {
  busy = false;
  setState('ready');
  if (queue.length) {
    const next = queue.shift();
    const t = token;
    setTimeout(() => {
      if (t === token) handle(next);
    }, 520);
  }
}

async function denied(t, speakerId) {
  log('denied · nothing ran');
  setMetric('approvals', 'denied');
  await agentSay(
    active,
    'Denied. Nothing ran — no file was touched. The plan stays here if you want to edit it.',
    t,
    speakerId
  );
  finish();
}

async function crewIntro(sc, t) {
  const primary = sc.agent || 'research';
  const reviewer = sc.reviewer || REVIEWERS[primary] || 'code';
  const a = await agentSay('crew', sc.ack, t, primary);
  if (!a || abort(t)) return null;
  const b = await agentSay('crew', REVIEW_LINES[reviewer] || REVIEW_LINES.code, t, reviewer);
  if (!b || abort(t)) return null;
  return { primary, reviewer };
}

async function handle(text) {
  const value = text.trim();
  if (!value) return;
  if (busy) {
    queue.push(value);
    return;
  }

  const isGroup = active === 'crew';
  const sc = route(value) || generic();
  const target = active;
  let primary = isGroup ? sc.agent || 'research' : sc.agent || active;
  let reviewer = isGroup ? sc.reviewer || REVIEWERS[primary] || 'code' : null;
  const tag = isGroup ? `${AGENTS[primary].mark} · ` : '';

  if (!isGroup && primary !== active) setAgent(primary);

  const t = ++token;
  busy = true;
  setState('working');
  addUser(value);
  log(`${tag}goal · ${value.length > 32 ? value.slice(0, 32) + '…' : value}`);

  if (!reduced) await wait(360);
  if (abort(t)) return;

  if (isGroup) {
    const crew = await crewIntro(sc, t);
    if (!crew || abort(t)) return;
    primary = crew.primary;
    reviewer = crew.reviewer;
  } else {
    const ack = await agentSay(target, sc.ack, t, primary);
    if (!ack || abort(t)) return;
  }

  if (!sc.plan) {
    finish();
    return;
  }

  const plan = await planCard(sc, isGroup);
  if (abort(t)) return;
  if (plan === 'deny') {
    await denied(t, primary);
    return;
  }

  log(`${tag}plan approved`);
  setMetric('approvals', '1');
  await agentSay(
    target,
    isGroup
      ? `Approved. ${AGENTS[reviewer].name} is reviewing while I run it — every action is logged.`
      : 'Approved. Running it now — every action is logged and deny always wins.',
    t,
    primary
  );
  if (abort(t)) return;

  const gate = await gateCard(sc, isGroup, reviewer);
  if (abort(t)) return;
  if (gate === 'deny') {
    await denied(t, primary);
    return;
  }

  log(`${tag}${gate === 'always' ? 'allowed · always' : 'allowed · once'}`);
  setMetric('approvals', '1/1');
  await agentSay(
    target,
    gate === 'always'
      ? "Allowed always. I won't ask for this one again — you can revoke it in skills."
      : 'Allowed once. Starting now.',
    t,
    primary
  );
  if (abort(t)) return;

  const ok = await progress(sc, t, isGroup ? primary : null);
  if (!ok || abort(t)) return;

  if (isGroup && reviewer) {
    const rev = await agentSay(target, REVIEW_DONE[reviewer] || REVIEW_DONE.code, t, reviewer);
    if (!rev || abort(t)) return;
  }

  if (sc.extra === 'diff') diffCard();
  if (sc.extra === 'routine') routineCard();
  reportCard(sc);

  sc.log.forEach((line) => log(`${tag}${line}`));
  if (sc.metrics.files) countTo('files', sc.metrics.files, t);
  else setMetric('files', '0');
  countTo('actions', sc.metrics.actions, t);
  setMetric('tests', sc.metrics.tests);
  setMetric('approvals', sc.metrics.approvals);

  await wait(240);
  if (abort(t)) return;
  await agentSay(target, sc.done, t, primary);
  finish();
}

/* ── reset ─────────────────────────────────────────────── */

function reset() {
  token++;
  busy = false;
  queue.length = 0;
  Object.values(threads).forEach((t) => (t.innerHTML = ''));
  greeted.clear();
  greeted.add(active);
  dsLog.innerHTML = '<li>waiting for a goal</li>';
  setMetric('approvals', '—');
  setMetric('actions', '0');
  setMetric('files', '0');
  setMetric('tests', '—');
  document.querySelectorAll('.demo-agent').forEach((b) => {
    b.querySelector('.da-state').textContent =
      b.dataset.agent === active ? stateLabel('ready') : idleLabel(b.dataset.agent);
  });
  setState('ready');
  greet(active);
  scrollBottom();
}

/* ── init ──────────────────────────────────────────────── */

export function initChat() {
  msgs = document.getElementById('demo-msgs');
  if (!msgs) return;
  dcMark = document.getElementById('dc-mark');
  dcName = document.getElementById('dc-name');
  dcState = document.getElementById('dc-state');
  dsLog = document.getElementById('ds-log');

  Object.keys(AGENTS).forEach((id) => {
    const th = el('div', 'demo-thread');
    th.dataset.thread = id;
    th.classList.toggle('is-on', id === active);
    msgs.appendChild(th);
    threads[id] = th;
  });

  greeted.add(active);
  greet(active);

  document.querySelectorAll('.demo-agent').forEach((b) => {
    b.querySelector('.da-state').textContent =
      b.dataset.agent === active ? stateLabel('ready') : idleLabel(b.dataset.agent);
    b.addEventListener('click', () => {
      if (!busy) setAgent(b.dataset.agent);
    });
  });

  document.querySelectorAll('#demo-suggest .chip').forEach((c) => {
    c.addEventListener('click', () => handle(c.dataset.say || ''));
  });

  const form = document.getElementById('demo-form');
  const input = document.getElementById('demo-text');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    handle(v);
  });

  const resetBtn = document.getElementById('demo-reset');
  if (resetBtn) resetBtn.addEventListener('click', reset);

  setState('ready');

  const stage = document.querySelector('#demo .demo-stage');
  if (stage) {
    if (!('IntersectionObserver' in window)) stage.classList.add('is-in');
    else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              stage.classList.add('is-in');
              io.disconnect();
            }
          });
        },
        { threshold: 0.18 }
      );
      io.observe(stage);
    }
  }
}
