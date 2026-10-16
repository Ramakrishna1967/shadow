/* SHADOW landing page motion: GSAP (ScrollTrigger, SplitText, MotionPath) + Lenis smooth scroll.
   Every effect has a reduced-motion path that shows the final state. */
(() => {
  "use strict";

  // Formspree form endpoint. Public by design; spam is limited by the honeypot field and Formspree's allowed-domains setting.
  const SIGNUP_URL = "https://formspree.io/f/xnpjlwla";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  initSignup();
  navTheme();

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove("boot-on");
    $$("[data-hide]").forEach((el) => { el.style.visibility = "visible"; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  fontsReady.then(() => (reduce ? initStatic() : initMotion()));

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                       */
  /* ------------------------------------------------------------------ */

  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>#*+";
  function scramble(el, duration = 0.9) {
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    const o = { p: 0 };
    return gsap.to(o, {
      p: 1, duration, ease: "none",
      onUpdate() {
        const n = Math.floor(o.p * final.length);
        let s = final.slice(0, n);
        for (let i = n; i < final.length; i++) {
          const c = final[i];
          s += c === " " || c === "·" ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = s;
      },
      onComplete() { el.textContent = final; },
    });
  }

  function countTo(el, to, duration, from = 0, decimals = 0) {
    const o = { v: from };
    return gsap.to(o, {
      v: to, duration, ease: "power2.out",
      onUpdate() { el.textContent = o.v.toFixed(decimals); },
    });
  }

  function drawIn(paths, vars) {
    paths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    return gsap.to(paths, { strokeDashoffset: 0, ease: "power2.inOut", ...vars });
  }

  // Run a canvas loop only while its element is on screen.
  function whileVisible(el, onChange) {
    const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
  }

  /* ------------------------------------------------------------------ */
  /* Demo timeline (shared by motion and static modes)                    */
  /* ------------------------------------------------------------------ */

  const STEP_TEXT = [
    "A Sentry error, a matching issue and your open editor point to the same task.",
    "SHADOW makes the change in its own worktree, inside a sandbox. Your checkout stays untouched.",
    "Tests and a scan run in the sandbox. The proof goes onto one card.",
    "You tap approve. The daemon opens the pull request once, from outside the sandbox.",
  ];
  const STEP_AT = [0, 3.2, 6, 8.2, 10.4]; // start of each step, last value = end
  const SIG_X = [70, 250, 110, 210, 150, 180]; // problem-diagram signal columns

  function buildDemo() {
    const win = $(".win");
    const feed = $(".feed", win);
    const list = $(".feed-list", win);
    const evs = $$(".ev", win);
    const runL = $$(".run-l", win);
    const addLines = $$(".ln.add", win);
    const apB = $(".ap-b", win);
    const overflow = () => Math.max(0, list.scrollHeight - feed.clientHeight);

    gsap.set([...evs, $(".predict", win), ...runL, $(".proof", win)], { autoAlpha: 0, y: 16 });
    gsap.set(addLines, { height: 0 });
    gsap.set(addLines.map((l) => $("code", l)), { clipPath: "inset(0 100% 0 0)" });
    gsap.set($(".code-note", win), { autoAlpha: 0, y: 8 });
    gsap.set($(".toast", win), { autoAlpha: 0, y: 24 });
    gsap.set($(".fake-cursor", win), { x: 210, y: 64, autoAlpha: 0 });
    gsap.set(apB, { y: 0, yPercent: 130 });
    gsap.set($(".proof", win), { boxShadow: "0 0 0 0px rgba(143, 214, 160, 0), 0 0 0px rgba(143, 214, 160, 0)" });

    const tl = gsap.timeline({ paused: true, defaults: { duration: 0.6, ease: "power3.out" } });
    const [W, P, V, A] = STEP_AT;

    // 01 Watch
    evs.forEach((ev, i) => tl.to(ev, { autoAlpha: 1, y: 0 }, W + 0.2 + i * 0.5));
    tl.to($(".predict", win), { autoAlpha: 1, y: 0 }, W + 1.8)
      .to($(".conf-bar i", win), { scaleX: 0.86, duration: 1, ease: "power2.inOut" }, W + 2.1)
      .add(countTo($(".conf-n", win), 0.86, 1, 0, 2), W + 2.1);

    // 02 Prepare
    tl.to($(".code-empty", win), { autoAlpha: 0, duration: 0.4 }, P)
      .to(runL[0], { autoAlpha: 1, y: 0 }, P + 0.2)
      .to(runL[1], { autoAlpha: 1, y: 0 }, P + 0.6)
      .to($(".ln.del", win), { "--k": 1, duration: 0.5, ease: "none" }, P + 0.4);
    addLines.forEach((line, i) => {
      const at = P + 0.7 + i * 0.5;
      tl.to(line, { height: "var(--lh)", duration: 0.25, ease: "power2.out" }, at)
        .to($("code", line), { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "none" }, at + 0.15);
    });
    tl.to(list, { y: () => -overflow() * 0.4, duration: 1.4, ease: "power2.inOut" }, P + 0.4);

    // 03 Prove
    tl.to(runL[2], { autoAlpha: 1, y: 0 }, V)
      .to($(".tbar i", win), { scaleX: 1, duration: 1.2, ease: "power1.inOut" }, V + 0.2)
      .add(countTo($(".tn", win), 14, 1.2), V + 0.2)
      .to($(".code-note", win), { autoAlpha: 1, y: 0 }, V + 0.5)
      .to($(".proof", win), { autoAlpha: 1, y: 0 }, V + 1.4)
      .to(list, { y: () => -overflow(), duration: 1.6, ease: "power2.inOut" }, V + 0.6);

    // 04 Approve
    tl.to($(".fake-cursor", win), { autoAlpha: 1, duration: 0.2 }, A)
      .to($(".fake-cursor", win), { x: 30, y: 18, duration: 0.9, ease: "power2.inOut" }, A)
      .to($(".approve", win), { scale: 0.93, duration: 0.12, ease: "power2.in" }, A + 0.95)
      .to($(".approve", win), { scale: 1, duration: 0.3, ease: "back.out(3)" }, A + 1.07)
      .to($(".ap-a", win), { yPercent: -130, duration: 0.35 }, A + 1.0)
      .to(apB, { yPercent: 0, duration: 0.35 }, A + 1.0)
      .to($(".proof", win), { borderColor: "rgba(143, 214, 160, 0.6)", boxShadow: "0 0 0 4px rgba(143, 214, 160, 0.08), 0 0 48px rgba(143, 214, 160, 0.18)", duration: 0.5 }, A + 1.0)
      .to($(".fake-cursor", win), { autoAlpha: 0, x: 60, y: 40, duration: 0.5 }, A + 1.4)
      .to($(".toast", win), { autoAlpha: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }, A + 1.4)
      .set({}, {}, STEP_AT[4]);

    // Step tabs follow the playhead, whether scrubbed by scroll or playing on its own.
    const tabs = $$(".step");
    const fills = tabs.map((t) => $(".step-fill", t));
    const num = $(".step-num");
    const text = $(".step-text");
    let current = -1;
    tl.eventCallback("onUpdate", () => {
      const t = tl.time();
      let idx = 0;
      for (let i = 0; i < 4; i++) {
        const p = gsap.utils.clamp(0, 1, (t - STEP_AT[i]) / (STEP_AT[i + 1] - STEP_AT[i]));
        gsap.set(fills[i], { scaleX: p });
        if (t >= STEP_AT[i]) idx = i;
      }
      if (idx !== current) {
        current = idx;
        tabs.forEach((tab, i) => tab.setAttribute("aria-selected", String(i === idx)));
        num.textContent = String(idx + 1).padStart(2, "0");
        if (reduce) { text.textContent = STEP_TEXT[idx]; return; }
        gsap.timeline()
          .to(text, { autoAlpha: 0, y: -8, duration: 0.18, ease: "power2.in" })
          .call(() => { text.textContent = STEP_TEXT[idx]; })
          .to(text, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" });
      }
    });
    return { tl, tabs };
  }

  /* ------------------------------------------------------------------ */
  /* "How it works" diagram state                                         */
  /* ------------------------------------------------------------------ */

  function buildHow(animateDots) {
    const steps = $$(".how-step");
    const groups = [
      { nodes: [...$$(".n-src"), $(".n-mind")], paths: ["#hp1", "#hp2", "#hp3", "#hp4"] },
      { nodes: [$(".n-box")], paths: ["#hp5"] },
      { nodes: [$(".n-card")], paths: ["#hp6"] },
    ];
    const loops = {};
    if (animateDots) {
      $$(".how-svg .dot").forEach((dot, i) => {
        const path = dot.dataset.path;
        loops[path] = gsap.timeline({ repeat: -1, paused: true, delay: i * 0.15 })
          .set(dot, { autoAlpha: 1 })
          .to(dot, { duration: 1.3, ease: "power1.inOut", motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } })
          .set(dot, { autoAlpha: 0 });
      });
    }
    let current = -1;
    return function setHow(idx) {
      if (idx === current) return;
      current = idx;
      steps.forEach((s, i) => s.classList.toggle("is-on", i === idx));
      groups.forEach((g, i) => {
        const on = i <= idx;
        g.nodes.forEach((n) => n.classList.toggle("lit", on));
        g.paths.forEach((p) => {
          $(p).classList.toggle("lit", on);
          const loop = loops[p];
          if (loop) on ? loop.play() : loop.pause(0);
        });
      });
    };
  }

  /* ------------------------------------------------------------------ */
  /* Canvas: hero dot field                                               */
  /* ------------------------------------------------------------------ */

  function heroField(animate) {
    const hero = $(".hero");
    const c = $(".hero-field");
    const ctx = c.getContext("2d");
    const GAP = 26, R = 150, R2 = R * R;
    let w = 0, h = 0, pts = [], mx = -9999, my = -9999, t = 0, running = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) pts.push({ x, y, ox: 0, oy: 0 });
      if (!animate) draw();
    }
    function draw() {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(11, 12, 13, 0.38)";
      for (const p of pts) {
        const wave = Math.sin(p.x * 0.008 + t * 1.6) * Math.cos(p.y * 0.011 - t) * 6;
        let tx = 0, ty = wave;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 30;
          tx += (dx / d) * f; ty += (dy / d) * f;
        }
        p.ox += (tx - p.ox) * 0.12; p.oy += (ty - p.oy) * 0.12;
        const s = 1 + ((wave + 6) / 12) * 1.4;
        ctx.fillRect(p.x + p.ox - s / 2, p.y + p.oy - s / 2, s, s);
      }
    }
    resize();
    window.addEventListener("resize", resize);
    if (!animate) return;
    hero.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { mx = my = -9999; });
    whileVisible(hero, (on) => {
      if (on && !running) { gsap.ticker.add(draw); running = true; }
      if (!on && running) { gsap.ticker.remove(draw); running = false; }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Canvas: closing wireframe mesh                                       */
  /* ------------------------------------------------------------------ */

  function ctaMesh(animate) {
    const sec = $(".cta");
    const c = $(".cta-mesh");
    const ctx = c.getContext("2d");
    const COLS = 46, ROWS = 26, Z0 = 1.2, Z1 = 8, X = 7;
    let w = 0, h = 0, t = 0, mxn = 0, running = false;
    const glints = Array.from({ length: 7 }, (_, i) => ({ row: 3 + ((i * 5) % (ROWS - 6)), u: Math.random(), v: 0.0015 + Math.random() * 0.002 }));
    const grid = Array.from({ length: ROWS }, () => new Float32Array(COLS * 2));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!animate) draw();
    }
    function height(x, z) {
      return Math.sin(x * 0.9 + t) * 0.16 + Math.sin(z * 1.1 - t * 1.25) * 0.2 +
        Math.cos((x + z) * 0.6 + t * 0.7) * 0.12 + Math.exp(-((x - mxn * 4) ** 2) * 0.3) * 0.25 * Math.sin(t * 2 + z);
    }
    function draw() {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);
      const f = w * 0.42, hy = h * 0.6; // horizon below the headline
      for (let r = 0; r < ROWS; r++) {
        const z = Z0 + (r / (ROWS - 1)) * (Z1 - Z0);
        const row = grid[r];
        for (let i = 0; i < COLS; i++) {
          const x = -X + (i / (COLS - 1)) * 2 * X;
          const y = 0.9 - height(x, z);
          row[i * 2] = w / 2 + (x / z) * f;
          row[i * 2 + 1] = hy + (y / z) * f;
        }
      }
      ctx.lineWidth = 1;
      for (let r = 0; r < ROWS; r++) {
        const row = grid[r];
        ctx.strokeStyle = `rgba(228, 228, 225, ${0.32 * (1 - r / ROWS) + 0.03})`;
        ctx.beginPath();
        for (let i = 0; i < COLS; i++) i ? ctx.lineTo(row[i * 2], row[i * 2 + 1]) : ctx.moveTo(row[0], row[1]);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(228, 228, 225, 0.09)";
      ctx.beginPath();
      for (let i = 0; i < COLS; i++) {
        for (let r = 0; r < ROWS; r++) {
          const x = grid[r][i * 2], y = grid[r][i * 2 + 1];
          r ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      for (const g of glints) {
        if (animate) g.u = (g.u + g.v) % 1;
        const fi = g.u * (COLS - 1), i = Math.floor(fi), k = fi - i, row = grid[g.row];
        const x = row[i * 2] + (row[i * 2 + 2] - row[i * 2]) * k;
        const y = row[i * 2 + 1] + (row[i * 2 + 3] - row[i * 2 + 1]) * k;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }
    resize();
    window.addEventListener("resize", resize);
    if (!animate) return;
    const mxTo = gsap.quickTo({ get v() { return mxn; }, set v(val) { mxn = val; } }, "v", { duration: 1.2, ease: "power3.out" });
    sec.addEventListener("pointermove", (e) => mxTo((e.clientX / w) * 2 - 1), { passive: true });
    whileVisible(sec, (on) => {
      if (on && !running) { gsap.ticker.add(draw); running = true; }
      if (!on && running) { gsap.ticker.remove(draw); running = false; }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reduced motion: final states, no movement                            */
  /* ------------------------------------------------------------------ */

  function initStatic() {
    gsap.set("[data-hide]", { autoAlpha: 1 });
    const { tl, tabs } = buildDemo();
    tl.progress(1);
    tabs.forEach((tab, i) => tab.addEventListener("click", () => tl.seek(STEP_AT[i + 1] - 0.001)));
    const setHow = buildHow(false);
    setHow(2);
    $$(".how-step").forEach((s) => s.classList.add("is-on"));
    $$(".cmp .tl, .cmp-fast").forEach((el) => el.style.setProperty("--p", "1"));
    $$("[data-to]").forEach((el) => { el.textContent = el.dataset.to; });
    $$(".sig").forEach((s, i) => gsap.set(s, { x: SIG_X[i], y: [96, 96, 132, 132, 168, 168][i], autoAlpha: 1 }));
    heroField(false);
    ctaMesh(false);
    footerMark(false);
  }

  // Giant outlined wordmark: letters rise as the footer scrolls in; each letter fills on hover.
  function footerMark(animate) {
    const split = SplitText.create(".footer-mark", { type: "chars", charsClass: "char" });
    if (!animate) return;
    gsap.from(split.chars, {
      yPercent: 105, ease: "power2.out", stagger: 0.08,
      scrollTrigger: { trigger: ".footer-mark", start: "top bottom", end: "bottom bottom", scrub: 1 },
    });
  }

  /* ------------------------------------------------------------------ */
  /* Full motion                                                          */
  /* ------------------------------------------------------------------ */

  function initMotion() {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // In-page links glide instead of jumping. The skip link keeps native behaviour so focus moves.
    $$('a[href^="#"]:not(.skip)').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === "#top" ? 0 : -56, duration: 1.6 });
    }));

    boot(lenis, heroIntro);
    chrome();
    heroField(true);
    ticker();
    reveals();
    problem();
    demo(lenis);
    compare();
    how();
    agents();
    trust();
    numbers();
    faq();
    cta();
    ctaMesh(true);
    footerMark(true);

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  function boot(lenis, done) {
    if (!root.classList.contains("boot-on")) { done(); return; }
    lenis.stop();
    const lines = $$(".boot-line");
    gsap.timeline({
      onComplete() {
        root.classList.remove("boot-on");
        try { sessionStorage.setItem("shadow-booted", "1"); } catch (e) { /* private mode: boot replays next visit */ }
        lenis.start();
        ScrollTrigger.refresh();
      },
    })
      .fromTo(lines, { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.32, ease: "steps(22)", stagger: 0.26 }, 0.1)
      .to(".boot-bar i", { scaleX: 1, duration: 1.25, ease: "power2.inOut" }, 0)
      .to(".boot-inner", { y: -20, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=0.2")
      .to(".boot", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.25")
      .add(done, "-=0.6");
  }

  function heroIntro() {
    const wm = $(".hero-watermark");
    gsap.set(wm, { y: 0, yPercent: -50 });
    gsap.set(".hero [data-hide]", { autoAlpha: 1 });
    const split = SplitText.create(".hero-title", { type: "lines,words,chars", mask: "lines", linesClass: "hl", charsClass: "char" });
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1 }, 0.2)
      .from(wm, { scale: 0.8, rotate: -8, autoAlpha: 0, duration: 2.4, ease: "power3.out" }, 0)
      .from(".hero-tag", { clipPath: "inset(0 100% 0 0)", duration: 0.8 }, 0)
      .add(() => scramble($(".hero-tag [data-scramble]")), 0)
      .from(split.chars, { yPercent: 120, rotate: 6, filter: "blur(10px)", duration: 1.3, stagger: 0.022 }, 0.1)
      .from(".hero-sub", { y: 30, autoAlpha: 0, filter: "blur(6px)", duration: 1.1 }, 0.55)
      .from(".signup-hero", { y: 30, autoAlpha: 0, duration: 1.1 }, 0.7)
      .from(".hero-meta", { autoAlpha: 0, duration: 0.9 }, 0.95)
      .from(".ticker", { yPercent: 100, duration: 1.1 }, 0.6);

    // Leaving the hero: the light panel shrinks into a rounded card over the black page.
    gsap.to(".hero", { scale: 0.92, borderRadius: 28, transformOrigin: "50% 100%", ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    // Text drifts up, watermark rotates away.
    gsap.to(".hero-inner", { yPercent: -16, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(wm, { yPercent: -78, rotate: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  function chrome() {
    gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    if (!finePointer) return;
    root.classList.add("has-cursor");
    const cur = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring");
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    // Hidden until the first move, so it never sits in the corner at (0, 0).
    gsap.set(cur, { autoAlpha: 0 });
    window.addEventListener("pointermove", () => gsap.to(cur, { autoAlpha: 1, duration: 0.3 }), { once: true });
    window.addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    const wide = window.matchMedia("(min-width: 901px)");
    document.addEventListener("pointerover", (e) => {
      const interactive = !!e.target.closest("a, button, summary, input, [data-magnetic]");
      // Over the pinned demo the ring says "scroll": scrolling is what drives it.
      cur.classList.toggle("is-label", wide.matches && !interactive && !!e.target.closest(".win"));
      cur.classList.toggle("is-hover", interactive);
    });

    $$(".card, .tp, .cmp-panel, .agent").forEach((el) => {
      el.classList.add("spot");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
    document.documentElement.addEventListener("pointerleave", () => gsap.to(cur, { autoAlpha: 0, duration: 0.3 }));
    document.documentElement.addEventListener("pointerenter", () => gsap.to(cur, { autoAlpha: 1, duration: 0.3 }));

    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  function ticker() {
    const track = $(".ticker-track");
    const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 40, repeat: -1 });
    const skewTo = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3" });
    let idle;
    ScrollTrigger.create({
      onUpdate(self) {
        const v = self.getVelocity();
        gsap.to(loop, { timeScale: gsap.utils.clamp(-5, 5, 1 + v / 500), duration: 0.2, overwrite: true });
        skewTo(gsap.utils.clamp(-10, 10, -v / 220));
        clearTimeout(idle);
        idle = setTimeout(() => { gsap.to(loop, { timeScale: 1, duration: 0.9, overwrite: true }); skewTo(0); }, 140);
      },
    });
  }

  function reveals() {
    $$("[data-split]").forEach((el) => {
      SplitText.create(el, {
        type: "lines,words", mask: "lines", linesClass: "line", autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 115, rotate: 1.5, duration: 1.2, ease: "expo.out", stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          });
        },
      });
    });

    $$(".section .tag, .trust-head .tag").forEach((tag) => {
      const label = $("[data-scramble]", tag);
      gsap.from(tag, {
        clipPath: "inset(0 100% 0 0)", duration: 0.8, ease: "expo.out",
        scrollTrigger: { trigger: tag, start: "top 90%", once: true, onEnter: () => label && scramble(label) },
      });
    });

    $$(".sec-sub").forEach((el) => gsap.from(el, {
      y: 28, autoAlpha: 0, filter: "blur(6px)", duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    }));
  }

  function problem() {
    gsap.from(".card", {
      y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.12,
      scrollTrigger: { trigger: ".cards", start: "top 80%", once: true },
    });

    const svg = $(".funnel-svg");
    drawIn($$(".funnel-svg .corners path, .funnel-svg .funnel-lines path"), {
      duration: 1.6, stagger: 0.15, scrollTrigger: { trigger: svg, start: "top 80%", once: true },
    });

    const loops = [];
    $$(".sig").forEach((s, i) => {
      loops.push(gsap.timeline({ repeat: -1, delay: i * 0.6, repeatDelay: 1.4, paused: true })
        .set(s, { x: SIG_X[i], y: 56, autoAlpha: 0, scale: 1, transformOrigin: "50% 50%" })
        .to(s, { autoAlpha: 1, y: 96, duration: 0.5, ease: "power2.out" })
        .to(s, { x: 160, y: 224, duration: 1.4, ease: "power2.in" })
        .to(s, { y: 258, scale: 0.4, autoAlpha: 0, duration: 0.5, ease: "power1.in" }));
    });
    loops.push(gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true })
      .set(".bl", { autoAlpha: 1 })
      .from(".bl", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, stagger: 0.8, ease: "power2.out" })
      .to(".bl", { autoAlpha: 0, duration: 0.4, delay: 0.8 }));
    loops.push(gsap.to(".you rect", { scale: 1.08, transformOrigin: "50% 50%", duration: 0.7, yoyo: true, repeat: -1, ease: "sine.inOut", paused: true }));

    ScrollTrigger.create({
      trigger: svg, start: "top bottom", end: "bottom top",
      onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
    });
  }

  function demo(lenis) {
    const { tl, tabs } = buildDemo();
    gsap.from(".win", {
      y: 80, scale: 0.94, rotateX: 8, transformPerspective: 1400, autoAlpha: 0, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: ".demo-pin", start: "top 85%", once: true },
    });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const st = ScrollTrigger.create({
        trigger: ".demo-pin", start: "top top+=60", end: () => "+=" + window.innerHeight * 3,
        pin: true, scrub: 1, animation: tl, anticipatePin: 1, invalidateOnRefresh: true,
      });
      const onTab = (i) => lenis.scrollTo(st.start + (st.end - st.start) * ((STEP_AT[i] + 0.05) / STEP_AT[4]), { duration: 1.4 });
      const handlers = tabs.map((tab, i) => { const h = () => onTab(i); tab.addEventListener("click", h); return h; });
      return () => tabs.forEach((tab, i) => tab.removeEventListener("click", handlers[i]));
    });
    mm.add("(max-width: 900px)", () => {
      const st = ScrollTrigger.create({ trigger: ".win", start: "top 70%", once: true, onEnter: () => tl.play(0) });
      const handlers = tabs.map((tab, i) => { const h = () => tl.play(STEP_AT[i]); tab.addEventListener("click", h); return h; });
      return () => { st.kill(); tl.pause(0); tabs.forEach((tab, i) => tab.removeEventListener("click", handlers[i])); };
    });
  }

  function compare() {
    const tl = gsap.timeline({ scrollTrigger: { trigger: ".cmp", start: "top 75%", once: true } });
    tl.from(".cmp-panel", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.15 }, 0)
      .to(".cmp .tl", { "--p": 1, duration: 1.8, ease: "power2.inOut" }, 0.3)
      .from(".cmp-slow .tl li", { x: -14, autoAlpha: 0, duration: 0.5, stagger: 0.32, ease: "power2.out" }, 0.4)
      .from(".cmp-fast .tl li", { x: -14, autoAlpha: 0, duration: 0.35, stagger: 0.1, ease: "power2.out" }, 0.4)
      .to(".cmp-fast", { "--p": 1, duration: 0.9, ease: "power3.inOut" }, 0.6)
      .add(countTo($(".cmp-slow .cmp-n"), 93, 2), 0.5)
      .add(countTo($(".cmp-fast .cmp-n"), 1, 0.5), 0.5);
  }

  function how() {
    const setHow = buildHow(true);
    setHow(0);
    drawIn($$(".how-svg .corners path, .how-svg .paths path"), {
      duration: 1.4, stagger: 0.08, scrollTrigger: { trigger: ".how-svg", start: "top 80%", once: true },
    });
    gsap.from(".how-svg .node", {
      autoAlpha: 0, scale: 0.85, transformOrigin: "50% 50%", duration: 0.8, ease: "back.out(1.6)", stagger: 0.06,
      scrollTrigger: { trigger: ".how-svg", start: "top 80%", once: true },
    });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      ScrollTrigger.create({
        trigger: ".how-pin", start: "top top+=72", end: () => "+=" + window.innerHeight * 1.8,
        pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => setHow(Math.min(2, Math.floor(self.progress * 3))),
      });
    });
    mm.add("(max-width: 900px)", () => {
      $$(".how-step").forEach((step, i) => ScrollTrigger.create({
        trigger: step, start: "top 65%", end: "bottom 35%",
        onToggle: (self) => self.isActive && setHow(i),
      }));
    });
  }

  // Cards enter, then a "working" highlight passes from role to role while the section is on screen.
  function agents() {
    const cards = $$(".agent");
    gsap.from(cards, { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".agents-grid", start: "top 80%", once: true } });
    let i = -1;
    const step = () => {
      cards.forEach((c) => c.classList.remove("is-active"));
      i = (i + 1) % cards.length;
      cards[i].classList.add("is-active");
    };
    const loop = gsap.timeline({ repeat: -1, paused: true }).call(step).to({}, { duration: 2.2 });
    ScrollTrigger.create({ trigger: ".agents-grid", start: "top 75%", end: "bottom top", onToggle: (self) => (self.isActive ? loop.play() : loop.pause()) });
  }

  function trust() {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const trustSec = $(".trust");
      const track = $(".trust-track");
      trustSec.classList.add("is-h");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const move = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".trust-pin", start: "top top+=80", end: () => "+=" + dist(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
      });
      $$(".tp").forEach((p) => {
        gsap.from(p, {
          autoAlpha: 0.2, scale: 0.9, rotateY: -14, transformPerspective: 1200, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: move, start: "left 100%", end: "left 60%", scrub: true },
        });
        gsap.from($(".tp-ico", p), {
          rotate: -90, scale: 0.4, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: move, start: "left 95%", end: "left 55%", scrub: true },
        });
      });
      return () => trustSec.classList.remove("is-h");
    });
    mm.add("(max-width: 900px)", () => {
      gsap.from(".tp", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".trust-track", start: "top 80%", once: true } });
    });
  }

  function numbers() {
    gsap.from(".stat", { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".stats-grid", start: "top 85%", once: true } });
    $$(".stat-n").forEach((el) => {
      const to = Number(el.dataset.to);
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => countTo(el, to, to === 0 ? 1.4 : 1.6, to === 0 ? 99 : 0) });
    });
    gsap.from(".stack-col li", { y: 20, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.035, scrollTrigger: { trigger: ".stack-grid", start: "top 85%", once: true } });
  }

  function faq() {
    gsap.from(".qa", { y: 24, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: ".faq-list", start: "top 85%", once: true } });
    // Animate native <details> open and close; keyboard and screen readers keep native semantics.
    $$(".qa").forEach((d) => {
      const summary = $("summary", d), body = $(".qa-a", d);
      summary.addEventListener("click", (e) => {
        e.preventDefault();
        gsap.killTweensOf(body);
        if (d.open) {
          gsap.to(body, { height: 0, duration: 0.45, ease: "power3.inOut", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "height" }); ScrollTrigger.refresh(); } });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.6, ease: "power3.out", onComplete: () => { gsap.set(body, { clearProps: "height" }); ScrollTrigger.refresh(); } });
          gsap.from(body.firstElementChild, { y: 12, autoAlpha: 0, duration: 0.5, ease: "power3.out" });
        }
      });
    });
  }

  function cta() {
    const tl = gsap.timeline({ scrollTrigger: { trigger: ".cta", start: "top 60%", once: true } });
    tl.from(".cta-mark", { scale: 0, rotate: -180, duration: 1.4, ease: "expo.out" }, 0)
      .from(".cta-sub", { y: 24, autoAlpha: 0, duration: 1, ease: "power3.out" }, 0.5)
      .from(".signup-cta", { y: 24, autoAlpha: 0, duration: 1, ease: "power3.out" }, 0.65);
    gsap.to(".cta-mark", { rotate: 90, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });
  }

  // Nav turns dark once the light hero has scrolled under it. Plain listener so it works in every mode.
  function navTheme() {
    const nav = $("#nav"), hero = $(".hero");
    const update = () => nav.classList.toggle("is-dark", hero.getBoundingClientRect().bottom <= 64);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Signup (works without GSAP)                                          */
  /* ------------------------------------------------------------------ */

  function initSignup() {
    $$(".signup").forEach((form) => {
      const input = $('input[type="email"]', form);
      const msg = $(".signup-msg", form);
      const btn = $('button[type="submit"]', form);
      const label = $(".btn-label", form);
      const say = (text, kind) => {
        msg.textContent = text;
        msg.classList.toggle("is-error", kind === "error");
        msg.classList.toggle("is-ok", kind === "ok");
      };

      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid")) { input.removeAttribute("aria-invalid"); say("", ""); }
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          input.setAttribute("aria-invalid", "true");
          say("Enter a valid email address, like you@company.dev.", "error");
          input.focus();
          return;
        }
        if (form.elements._gotcha.value) return; // bot filled the hidden field
        if (!SIGNUP_URL) {
          say("Signup is not connected yet. Set SIGNUP_URL in site/app.js.", "error");
          return;
        }
        btn.disabled = true;
        label.textContent = "Joining…";
        try {
          const res = await fetch(SIGNUP_URL, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.classList.add("is-done");
          label.textContent = "You're on the list";
          input.value = "";
          say("Thanks. We will email you when early access opens.", "ok");
          if (window.gsap && !reduce) gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
        } catch (err) {
          btn.disabled = false;
          label.textContent = "Join waitlist";
          say("Could not join right now (" + err.message + "). Please try again.", "error");
        }
      });
    });
  }
})();
