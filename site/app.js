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
  const motionOK = () => !!window.gsap && !reduce;

  // Interactive parts that must work with or without GSAP.
  initSignup();
  initTry();
  initSkills();
  buildClockTicks();
  navTheme();

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove("boot-on");
    $$("[data-hide]").forEach((el) => { el.style.visibility = "visible"; });
    $$(".scene")[0].style.visibility = "visible";
    initDeskToggle(null);
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

  // Run a loop only while its element is on screen.
  function whileVisible(el, onChange) {
    const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
  }

  /* ------------------------------------------------------------------ */
  /* Demo: the SHADOW app. Click any chat; approvals wait for your click   */
  /* ------------------------------------------------------------------ */

  const SCENE_TEXT = [
    "The agent writes a plan first. Nothing runs until you approve it. Click the button yourself.",
    "Risky steps ask again with the exact action. One sentence turns the job into a weekly routine.",
    "Every terminal command shows before it runs. The pull request opens only after your tap, once.",
    "Writes stay inside folders you granted. Nothing is posted anywhere without you.",
    "Agents work as a team in one chat. Each hand-off between them asked you first.",
  ];
  const SCENE_HEAD = [["R", "av-1", "Research"], ["F", "av-2", "File Organizer"], ["C", "av-3", "Code Agent"], ["W", "av-4", "Report Writer"], ["G", "av-4", "Launch crew"]];
  const ASK_IDLE_MS = 4500; // a visitor who has not clicked anything sees the approval happen anyway
  const NEXT_CHAT_MS = 2800; // pause before the tour moves to the next chat
  const MAX_ADDED = 6; // typed preview messages kept in one chat; older ones are removed
  const SIG_X = [70, 250, 110, 210, 150, 180]; // problem-diagram chore columns

  // One timeline per chat. Approval buttons pause the timeline until clicked.
  function buildDemo(animate) {
    const win = $(".win"), body = $(".chat-body", win);
    const scenes = $$(".scene", win);
    const tabs = $$(".step"), rows = $$(".row[data-scene]");
    const fills = tabs.map((tab) => $(".step-fill", tab));
    const num = $(".step-num"), text = $(".step-text");
    const headAv = $("[data-head-av]"), headName = $("[data-head-name]");
    const form = $(".chat-input"), input = $(".ci-text");
    let current = -1, auto = animate, visible = false, hidPaused = false;
    let nextTimer = 0, idleTimer = 0, disarm = null;

    const follow = (msgs, el) => {
      const y = -Math.max(0, el.offsetTop + el.offsetHeight - (body.clientHeight - 48));
      if (animate) gsap.to(msgs, { y, duration: 0.5, ease: "power2.out", overwrite: "auto" });
      else gsap.set(msgs, { y });
    };

    function armAsk(ask, tl) {
      const btn = $(".ask-btn", ask), cur = $(".fake-cursor", ask);
      const done = () => {
        clearTimeout(idleTimer);
        btn.removeEventListener("click", onClick);
        btn.disabled = true;
        ask.classList.remove("is-waiting");
        disarm = null;
      };
      const go = () => { done(); tl.play(); };
      const onClick = () => { gsap.set(cur, { autoAlpha: 0 }); go(); };
      ask.classList.add("is-waiting");
      btn.disabled = false;
      btn.addEventListener("click", onClick);
      disarm = () => { done(); gsap.set(cur, { autoAlpha: 0 }); };
      if (!auto) return;
      idleTimer = setTimeout(() => {
        gsap.timeline()
          .set(cur, { autoAlpha: 0, x: btn.offsetLeft + btn.offsetWidth + 110, y: 44 })
          .to(cur, { autoAlpha: 1, duration: 0.15 })
          .to(cur, { x: btn.offsetLeft + btn.offsetWidth * 0.55, y: btn.offsetTop + 12, duration: 0.7, ease: "power2.inOut" }, 0)
          .call(() => { if (disarm) go(); })
          .to(cur, { autoAlpha: 0, x: "+=34", y: "+=22", duration: 0.4 }, "+=0.2");
      }, ASK_IDLE_MS);
    }

    function scheduleNext() {
      clearTimeout(nextTimer);
      if (auto && visible) nextTimer = setTimeout(() => show((current + 1) % scenes.length, false), NEXT_CHAT_MS);
    }

    const timelines = scenes.map((scene, si) => {
      const msgs = $(".msgs", scene);
      const items = Array.from(msgs.children);
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.45, ease: "power3.out" } });
      items.forEach((it) => gsap.set(it, { autoAlpha: 0, y: 14, scale: 0.97, transformOrigin: it.classList.contains("me") ? "100% 100%" : "0% 100%" }));
      tl.set(msgs, { y: 0 }, 0);
      let t = 0.25;
      items.forEach((it) => {
        tl.to(it, { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.5)" }, t).call(() => follow(msgs, it), null, t + 0.05);
        t += 0.6;
        $$(".dl", it).forEach((dl, k) => {
          gsap.set(dl, { clipPath: "inset(0 100% 0 0)" });
          tl.to(dl, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "none" }, t - 0.3 + k * 0.25);
        });
        const tn = $(".tn", it);
        if (tn) {
          const o = { v: 0 };
          tl.to(o, { v: 14, duration: 0.8, ease: "power2.out", onUpdate() { tn.textContent = String(Math.round(o.v)); } }, t);
        }
        const ask = $(".ask", it);
        if (ask) {
          const btn = $(".ask-btn", ask), a = $(".ab-a", ask), b = $(".ab-b", ask);
          gsap.set(b, { y: 0, yPercent: 130 });
          tl.addPause(t, () => armAsk(ask, tl))
            .to(btn, { scale: 0.9, duration: 0.1, ease: "power2.in" }, t + 0.01)
            .to(btn, { scale: 1, duration: 0.35, ease: "back.out(3)" }, t + 0.11)
            .to(a, { yPercent: -130, duration: 0.3 }, t + 0.05)
            .to(b, { yPercent: 0, duration: 0.3 }, t + 0.05)
            .to(it, { borderColor: "rgba(143, 214, 160, 0.55)", boxShadow: "0 0 0 4px rgba(143, 214, 160, 0.06), 0 0 36px rgba(143, 214, 160, 0.14)", duration: 0.4 }, t + 0.05);
          t += 0.6;
        }
      });
      tl.eventCallback("onUpdate", () => gsap.set(fills[si], { scaleX: tl.progress() }));
      tl.eventCallback("onComplete", scheduleNext);
      return tl;
    });

    function show(i, byUser) {
      if (byUser) auto = false;
      clearTimeout(nextTimer);
      clearTimeout(idleTimer);
      if (disarm) disarm();
      $$(".msg.added", win).forEach((m) => m.remove());
      const prev = current;
      current = i;
      scenes.forEach((s, k) => {
        if (k === i) return;
        timelines[k].pause();
        if (k === prev && animate) gsap.to(s, { autoAlpha: 0, y: -12, duration: 0.25, overwrite: "auto" });
        else gsap.set(s, { autoAlpha: 0 });
      });
      if (animate) gsap.fromTo(scenes[i], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, delay: prev >= 0 ? 0.15 : 0, overwrite: "auto" });
      else gsap.set(scenes[i], { autoAlpha: 1, y: 0 });
      fills.forEach((f) => gsap.set(f, { scaleX: 0 }));
      tabs.forEach((tab, k) => tab.setAttribute("aria-selected", String(k === i)));
      rows.forEach((r) => {
        const on = Number(r.dataset.scene) === i;
        r.classList.toggle("is-on", on);
        if (on) r.setAttribute("aria-current", "true"); else r.removeAttribute("aria-current");
      });
      const [letter, cls, name] = SCENE_HEAD[i];
      headAv.className = "av av-sm " + cls;
      headAv.textContent = letter;
      headName.textContent = name;
      input.placeholder = "Message " + name;
      num.textContent = String(i + 1).padStart(2, "0");
      const tl = timelines[i];
      if (!animate) {
        text.textContent = SCENE_TEXT[i];
        tl.progress(1);
        gsap.set(fills[i], { scaleX: 1 });
        const msgs = $(".msgs", scenes[i]);
        follow(msgs, msgs.lastElementChild);
        return;
      }
      gsap.fromTo(headName, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" });
      gsap.timeline()
        .to(text, { autoAlpha: 0, y: -8, duration: 0.18, ease: "power2.in" })
        .call(() => { text.textContent = SCENE_TEXT[i]; })
        .to(text, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" });
      tl.restart();
    }

    [...tabs.map((tab, i) => [tab, i]), ...rows.map((r) => [r, Number(r.dataset.scene)])]
      .forEach(([el, i]) => el.addEventListener("click", () => show(i, true)));

    // Typing in the preview gets an honest answer: nothing runs from this page.
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const txt = input.value.trim();
      if (!txt) return;
      input.value = "";
      auto = false;
      clearTimeout(nextTimer);
      if (current < 0) show(0, true);
      const msgs = $(".msgs", scenes[current]);
      const add = (cls, words) => {
        const m = document.createElement("p");
        m.className = "msg added " + cls;
        m.textContent = words;
        msgs.append(m);
        const added = $$(".msg.added", msgs);
        while (added.length > MAX_ADDED) added.shift().remove();
        follow(msgs, m);
      };
      add("me", txt);
      const name = SCENE_HEAD[current][2];
      setTimeout(() => add("bot", `Preview only, so nothing runs from this page. In SHADOW, ${name} would write a plan for this and ask before it acts.`), animate ? 700 : 0);
    });

    if (!animate) { show(0, false); return; }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      const tl = timelines[current];
      if (visible) {
        if (current < 0) { show(0, false); return; }
        if (hidPaused) { hidPaused = false; tl.resume(); }
        else if (tl.progress() === 1) scheduleNext();
      } else if (current >= 0) {
        clearTimeout(nextTimer);
        if (tl.isActive()) { tl.pause(); hidPaused = true; }
      }
    }, { threshold: 0.35 }).observe(win);
  }

  /* ------------------------------------------------------------------ */
  /* "How it works" diagram state                                         */
  /* ------------------------------------------------------------------ */

  function buildHow(animateDots) {
    const steps = $$(".how-step");
    const groups = [
      { nodes: [$(".n-goal"), $(".n-plan")], paths: ["#hp1"] },
      { nodes: [$(".n-approve")], paths: ["#hp2"] },
      { nodes: $$(".n-tool"), paths: ["#hp3", "#hp4", "#hp5", "#hp6"] },
      { nodes: [$(".n-report")], paths: ["#hp7", "#hp8", "#hp9", "#hp10"] },
    ];
    const loops = {};
    if (animateDots) {
      $$(".how-svg .dot").forEach((dot, i) => {
        const path = dot.dataset.path;
        loops[path] = gsap.timeline({ repeat: -1, paused: true, delay: (i % 4) * 0.18 })
          .set(dot, { autoAlpha: 1 })
          .to(dot, { duration: 1.2, ease: "power1.inOut", motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } })
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
      if (animateDots && idx === 1) gsap.fromTo(".ap-check", { strokeDasharray: 40, strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
  /* Screen control: an agent fills a form until you press the stop keys  */
  /* ------------------------------------------------------------------ */

  function initDeskToggle(loop) {
    const screen = $(".screen"), btn = $(".key-stop"), hint = $("#desk-state");
    const RUN_HINT = "Press the keys, or click, to stop the agent.";
    const STOP_HINT = "Stopped. The agent does nothing more until you start it again.";
    let stopped = false;
    const press = () => { btn.classList.add("is-down"); setTimeout(() => btn.classList.remove("is-down"), 160); };
    const set = (stop) => {
      stopped = stop;
      screen.classList.toggle("is-stopped", stop);
      hint.textContent = stop ? STOP_HINT : RUN_HINT;
      if (loop) stop ? loop.pause() : loop.restart();
    };
    btn.addEventListener("click", () => { press(); set(!stopped); });
    $(".ov-again").addEventListener("click", () => set(false));
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.altKey && e.key === "Escape") { press(); set(true); }
    });
    return () => stopped;
  }

  function desk(animate) {
    const body = $(".screen-body"), cur = $(".desk-cursor");
    const fields = $$(".screen .field");
    const typed = $$(".screen .typed");
    if (!animate) {
      typed.forEach((el) => { el.textContent = el.dataset.text; });
      gsap.set(cur, { x: 300, y: 240 });
      initDeskToggle(null);
      return;
    }
    const typeIn = (el) => {
      const txt = el.dataset.text, o = { n: 0 };
      return gsap.to(o, { n: txt.length, duration: txt.length * 0.07, ease: "none", onUpdate() { el.textContent = txt.slice(0, Math.round(o.n)); } });
    };
    const at = (el) => ({ x: el.offsetLeft + 46, y: el.offsetTop + el.offsetHeight / 2 });
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 1, paused: true })
      .call(() => { typed.forEach((el) => { el.textContent = ""; }); fields.forEach((f) => f.classList.remove("is-focus")); })
      .set(cur, { x: () => body.clientWidth - 60, y: () => body.clientHeight - 30 });
    typed.forEach((el, i) => {
      const field = fields[i];
      loop.to(cur, { x: () => at(field).x, y: () => at(field).y, duration: 0.7, ease: "power2.inOut" })
        .to(cur, { scale: 0.85, duration: 0.08, yoyo: true, repeat: 1 })
        .call(() => { fields.forEach((f) => f.classList.remove("is-focus")); field.classList.add("is-focus"); })
        .add(typeIn(el));
    });
    const ask = $(".sbtn-ask");
    loop.call(() => fields.forEach((f) => f.classList.remove("is-focus")))
      .to(cur, { x: () => ask.offsetLeft + ask.offsetWidth / 2, y: () => ask.offsetTop + ask.offsetHeight / 2, duration: 0.8, ease: "power2.inOut" })
      .to(ask, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" })
      .to({}, { duration: 0.6 });
    const isStopped = initDeskToggle(loop);
    whileVisible($(".screen"), (on) => { if (on && !isStopped()) loop.play(); else loop.pause(); });

    gsap.from(".screen", { y: 60, rotateX: 10, transformPerspective: 1400, autoAlpha: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".screen", start: "top 85%", once: true } });
    gsap.from(".desk-list li", { x: -16, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".desk-list", start: "top 85%", once: true } });
    gsap.from(".key-stop kbd", { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: "back.out(2)", scrollTrigger: { trigger: ".keys", start: "top 90%", once: true } });
  }

  /* ------------------------------------------------------------------ */
  /* Skills: roll back and revert buttons                                 */
  /* ------------------------------------------------------------------ */

  function initSkills() {
    const note = $(".skills-note");
    $$(".skill").forEach((card) => {
      const btn = $(".skill-btn", card);
      if (!btn) return;
      const vEl = $(".skill-v b", card), dots = $$(".skill-dots i", card), name = $("h3", card).textContent;
      btn.addEventListener("click", () => {
        let v = Number(card.dataset.v);
        if (v <= 1) return;
        v -= 1;
        card.dataset.v = String(v);
        vEl.textContent = String(v);
        dots[v].classList.add("off");
        note.textContent = `${name} is back on v${v}. The change is logged, and v${v + 1} can be restored.`;
        if (card.classList.contains("skill-flag")) {
          card.classList.remove("skill-flag");
          btn.textContent = "Reverted";
          btn.disabled = true;
        } else if (v === 1) {
          btn.disabled = true;
        }
        if (motionOK()) {
          gsap.fromTo(vEl, { yPercent: -110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(2.4)" });
          gsap.fromTo(note, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" });
          gsap.fromTo(card, { backgroundColor: "rgba(228, 228, 225, 0.06)" }, { backgroundColor: "rgba(228, 228, 225, 0)", duration: 1.2 });
        }
      });
    });
  }

  function skills() {
    gsap.from(".skill, .skill-chart", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".skill-grid", start: "top 80%", once: true } });
    gsap.from(".skill-dots i", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, stagger: 0.04, ease: "power2.out", scrollTrigger: { trigger: ".skill-grid", start: "top 75%", once: true } });
    drawIn($$(".spark-line"), { duration: 1.8, scrollTrigger: { trigger: ".spark", start: "top 85%", once: true } });
    gsap.from(".spark-dot", { scale: 0, transformOrigin: "50% 50%", duration: 0.6, delay: 1.6, ease: "back.out(3)", scrollTrigger: { trigger: ".spark", start: "top 85%", once: true } });
  }

  /* ------------------------------------------------------------------ */
  /* Routines clock and group hand-offs                                   */
  /* ------------------------------------------------------------------ */

  function buildClockTicks() {
    const g = $(".ticks");
    if (!g) return;
    const NS = "http://www.w3.org/2000/svg";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, r1 = i % 3 ? 48 : 44;
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", String(60 + Math.sin(a) * r1)); l.setAttribute("y1", String(60 - Math.cos(a) * r1));
      l.setAttribute("x2", String(60 + Math.sin(a) * 51)); l.setAttribute("y2", String(60 - Math.cos(a) * 51));
      g.appendChild(l);
    }
  }

  function duo() {
    gsap.from(".duo-panel", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".duo-grid", start: "top 80%", once: true } });
    const loops = [
      gsap.to(".hand-m", { rotation: 360, svgOrigin: "60 60", duration: 6, ease: "none", repeat: -1, paused: true }),
      gsap.to(".hand-h", { rotation: 360, svgOrigin: "60 60", duration: 72, ease: "none", repeat: -1, paused: true }),
    ];
    const items = $$(".routines li");
    let k = -1;
    loops.push(gsap.timeline({ repeat: -1, paused: true }).call(() => {
      items.forEach((li) => li.classList.remove("is-run"));
      k = (k + 1) % items.length;
      items[k].classList.add("is-run");
      gsap.fromTo(items[k], { x: -6 }, { x: 0, duration: 0.5, ease: "back.out(3)" });
    }).to({}, { duration: 2 }));

    drawIn($$(".team path"), { duration: 1.4, stagger: 0.15, scrollTrigger: { trigger: ".team", start: "top 85%", once: true } });
    gsap.from(".tnode, .tyou", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, stagger: 0.1, ease: "back.out(2)", scrollTrigger: { trigger: ".team", start: "top 85%", once: true } });
    // A hand-off: R sends to W, the message stops at YOU for approval, then goes on. Then the reply comes back.
    const [m1, m2] = $$(".tmsg");
    const leg = (dot, path, start, end) => gsap.timeline()
      .set(dot, { autoAlpha: 1 })
      .to(dot, { duration: 1, ease: "power1.inOut", motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start, end } })
      .set(dot, { autoAlpha: 0 });
    const ask = () => gsap.timeline()
      .to(".tbadge", { autoAlpha: 1, y: -4, duration: 0.3, ease: "back.out(2)" })
      .to(".tyou rect", { scale: 1.12, transformOrigin: "50% 50%", duration: 0.18, yoyo: true, repeat: 3 }, "<")
      .to(".tbadge", { autoAlpha: 0, y: 0, duration: 0.3 }, "+=0.5");
    loops.push(gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true })
      .add(leg(m1, "#tp1", 0, 1)).add(ask()).add(leg(m2, "#tp2", 0, 1))
      .to({}, { duration: 0.5 })
      .add(leg(m2, "#tp2", 1, 0)).add(ask()).add(leg(m1, "#tp1", 1, 0)));
    whileVisible($(".duo"), (on) => loops.forEach((l) => (on ? l.play() : l.pause())));
  }

  /* ------------------------------------------------------------------ */
  /* Trust: try-it approval card                                          */
  /* ------------------------------------------------------------------ */

  function initTry() {
    const out = $(".try-out");
    const RESULT = {
      once: ["Ran once and logged. The next time, it asks again.", "is-ok"],
      always: ["Saved: always allow this exact command for Code Agent. A deny rule would still win.", "is-ok"],
      deny: ["Denied. The agent gets your answer and stops this step.", "is-deny"],
    };
    const btns = $$(".tbtn");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const [txt, cls] = RESULT[b.dataset.choice];
      out.className = "try-out mono " + cls;
      out.textContent = txt;
      if (motionOK()) {
        gsap.fromTo(out, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "power3.out" });
        gsap.fromTo(b, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
      }
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Developer pack proof card                                            */
  /* ------------------------------------------------------------------ */

  function devpack(animate) {
    const card = $(".devpack .proof"), a = $(".ap-a", card), b = $(".ap-b", card), n = $(".dev-n", card);
    if (!animate) { n.textContent = "14"; gsap.set(a, { yPercent: -130 }); gsap.set(b, { y: 0, yPercent: 0 }); return; }
    gsap.set(b, { y: 0, yPercent: 130 });
    gsap.timeline({ scrollTrigger: { trigger: card, start: "top 80%", once: true } })
      .from(card, { y: 60, rotateY: -12, transformPerspective: 1200, autoAlpha: 0, duration: 1.1, ease: "expo.out" })
      .from($$(".proof-rows p", card), { x: -14, autoAlpha: 0, duration: 0.45, stagger: 0.12 }, 0.4)
      .add(countTo(n, 14, 1), 0.7)
      .to($(".approve", card), { scale: 0.92, duration: 0.12, ease: "power2.in" }, 1.9)
      .to($(".approve", card), { scale: 1, duration: 0.35, ease: "back.out(3)" }, 2.02)
      .to(a, { yPercent: -130, duration: 0.35 }, 1.95)
      .to(b, { yPercent: 0, duration: 0.35 }, 1.95)
      .to(card, { borderColor: "rgba(143, 214, 160, 0.6)", boxShadow: "0 0 0 4px rgba(143, 214, 160, 0.08), 0 0 48px rgba(143, 214, 160, 0.18)", duration: 0.5 }, 1.95);
  }

  /* ------------------------------------------------------------------ */
  /* Reduced motion: final states, no movement                            */
  /* ------------------------------------------------------------------ */

  function initStatic() {
    gsap.set("[data-hide]", { autoAlpha: 1 });
    buildDemo(false);
    const setHow = buildHow(false);
    setHow(3);
    $$(".how-step").forEach((s) => s.classList.add("is-on"));
    $$(".cmp .tl, .cmp-fast").forEach((el) => el.style.setProperty("--p", "1"));
    $$("[data-to]").forEach((el) => { el.textContent = el.dataset.to; });
    $$(".sig").forEach((s, i) => gsap.set(s, { x: SIG_X[i], y: [96, 96, 132, 132, 168, 168][i], autoAlpha: 1 }));
    $$(".routines li")[0].classList.add("is-run");
    heroField(false);
    ctaMesh(false);
    desk(false);
    devpack(false);
    footerMark(false);
  }

  // Giant wordmark: letters rise as the footer scrolls in; each letter fills on hover.
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
    demo();
    compare();
    how();
    agents();
    desk(true);
    skills();
    duo();
    trust();
    devpack(true);
    numbers();
    faq();
    cta();
    ctaMesh(true);
    footerMark(true);
    extras();

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
      .from(split.chars, { yPercent: 120, rotate: 6, duration: 1.3, stagger: 0.018 }, 0.1)
      .from(".hero-sub", { y: 30, autoAlpha: 0, duration: 1.1 }, 0.55)
      .from(".signup-hero", { y: 30, autoAlpha: 0, duration: 1.1 }, 0.7)
      .from(".hero-meta", { autoAlpha: 0, duration: 0.9 }, 0.95)
      .from(".ticker", { yPercent: 100, duration: 1.1 }, 0.6)
      .add(() => titleWave(split), 1.9);

    // Leaving the hero: the light panel shrinks into a rounded card over the black page.
    gsap.to(".hero", { scale: 0.92, transformOrigin: "50% 100%", ease: "none", force3D: true, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    ScrollTrigger.create({ trigger: ".hero", start: "top+=40 top", end: "max", toggleClass: { targets: ".hero", className: "is-card" } });
    // Text drifts up, watermark rotates away.
    gsap.to(".hero-inner", { yPercent: -16, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(wm, { yPercent: -78, rotate: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  // After the intro, re-split the title without line masks so letters can rise toward the pointer.
  function titleWave(split) {
    if (!finePointer) return;
    split.revert();
    const chars = SplitText.create(".hero-title", { type: "words,chars", charsClass: "char" }).chars;
    const lifts = chars.map((c) => gsap.quickTo(c, "y", { duration: 0.6, ease: "power3" }));
    const title = $(".hero-title");
    let centers = [];
    title.addEventListener("pointerenter", () => {
      centers = chars.map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    });
    title.addEventListener("pointermove", (e) => {
      if (!centers.length) return;
      centers.forEach(([cx, cy], i) => {
        const d = Math.hypot(e.clientX - cx, (e.clientY - cy) * 0.6);
        lifts[i](-Math.max(0, 1 - d / 170) * 16);
      });
    });
    title.addEventListener("pointerleave", () => lifts.forEach((f) => f(0)));
  }

  // Extra motion on top of each section: drawn divider lines, label scrambles, pointer tilt on the app windows.
  function extras() {
    $$(".section + .section, .cta").forEach((sec) => gsap.fromTo(sec, { "--ln": 0 }, {
      "--ln": 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 98%", end: "top 40%", scrub: true },
    }));

    $$(".card-k span:first-child, .skill-k span:first-child, .cmp-k span:first-child, .how-k, .tp-n, .qa-n, .stack-k, .footer-k").forEach((el) =>
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => scramble(el, 0.7) }));

    gsap.from(".hero-watermark rect", { strokeDasharray: 80, strokeDashoffset: 80, duration: 3, ease: "power2.inOut", stagger: 0.4, delay: 0.4 });

    if (!finePointer) return;
    $$(".screen, .try, .devpack .proof").forEach((el) => {
      let rx, ry; // created on first move so they never fight the entrance tweens
      el.addEventListener("pointermove", (e) => {
        if (!rx) {
          gsap.set(el, { transformPerspective: 1400 });
          rx = gsap.quickTo(el, "rotationX", { duration: 0.9, ease: "power3" });
          ry = gsap.quickTo(el, "rotationY", { duration: 0.9, ease: "power3" });
        }
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 5);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 4);
      });
      el.addEventListener("pointerleave", () => { if (rx) { rx(0); ry(0); } });
    });
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
    document.addEventListener("pointerover", (e) => {
      cur.classList.toggle("is-hover", !!e.target.closest("a, button, summary, input, [data-magnetic]"));
    });

    $$(".card, .tp, .cmp-panel, .agent, .skill, .duo-panel, .try").forEach((el) => {
      el.classList.add("spot");
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
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
    const speed = { v: 1 };
    const speedTo = gsap.quickTo(speed, "v", { duration: 0.4, ease: "power3", onUpdate: () => loop.timeScale(speed.v) });
    let idle;
    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "bottom top",
      onUpdate(self) {
        const v = self.getVelocity();
        speedTo(gsap.utils.clamp(-5, 5, 1 + v / 500));
        skewTo(gsap.utils.clamp(-10, 10, -v / 220));
        clearTimeout(idle);
        idle = setTimeout(() => { speedTo(1); skewTo(0); }, 140);
      },
    });
    whileVisible($(".ticker"), (on) => (on ? loop.play() : loop.pause()));
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

    $$(".sec-sub, .desk-p").forEach((el) => gsap.from(el, {
      y: 28, autoAlpha: 0, duration: 1.1, ease: "power3.out",
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

  function demo() {
    buildDemo(true);
    gsap.from(".win", {
      y: 80, scale: 0.94, rotateX: 8, transformPerspective: 1400, autoAlpha: 0, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: ".demo-pin", start: "top 85%", once: true },
    });
    gsap.from(".side-list .row", { x: -24, autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".demo-pin", start: "top 70%", once: true } });
  }

  function compare() {
    const tl = gsap.timeline({ scrollTrigger: { trigger: ".cmp", start: "top 75%", once: true } });
    tl.from(".cmp-panel", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.15 }, 0)
      .to(".cmp .tl", { "--p": 1, duration: 1.8, ease: "power2.inOut" }, 0.3)
      .from(".cmp-slow .tl li", { x: -14, autoAlpha: 0, duration: 0.5, stagger: 0.3, ease: "power2.out" }, 0.4)
      .from(".cmp-fast .tl li", { x: -14, autoAlpha: 0, duration: 0.35, stagger: 0.12, ease: "power2.out" }, 0.4)
      .to(".cmp-fast", { "--p": 1, duration: 0.9, ease: "power3.inOut" }, 0.6)
      .add(countTo($(".cmp-slow .cmp-n"), 5, 1.6), 0.5)
      .add(countTo($(".cmp-fast .cmp-n"), 2, 0.8), 0.5);
  }

  function how() {
    const setHow = buildHow(true);
    setHow(0);
    drawIn($$(".how-svg .corners path, .how-svg .paths path"), {
      duration: 1.4, stagger: 0.06, scrollTrigger: { trigger: ".how-svg", start: "top 80%", once: true },
    });
    gsap.from(".how-svg .node", {
      autoAlpha: 0, scale: 0.85, transformOrigin: "50% 50%", duration: 0.8, ease: "back.out(1.6)", stagger: 0.06,
      scrollTrigger: { trigger: ".how-svg", start: "top 80%", once: true },
    });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      ScrollTrigger.create({
        trigger: ".how-pin", start: "top top+=72", end: () => "+=" + window.innerHeight * 2.2,
        pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => setHow(Math.min(3, Math.floor(self.progress * 4))),
      });
    });
    mm.add("(max-width: 900px)", () => {
      $$(".how-step").forEach((step, i) => ScrollTrigger.create({
        trigger: step, start: "top 65%", end: "bottom 35%",
        onToggle: (self) => self.isActive && setHow(i),
      }));
    });
  }

  // Tool cards enter, then a "granted" highlight passes from tool to tool while the section is on screen.
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
    gsap.from(".try", { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".trust-head", start: "top 80%", once: true } });
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
          if (motionOK()) gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
        } catch (err) {
          btn.disabled = false;
          label.textContent = "Join waitlist";
          say("Could not join right now (" + err.message + "). Please try again.", "error");
        }
      });
    });
  }
})();
