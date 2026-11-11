# SHADOW — landing

Ultra motion-graphics landing page. Standalone. No connection to the `shadow/` product repo — content transplanted from https://tryshadow.vercel.app/

## Run

```
npm install --cache "D:\AgenticX\shadow\.npm-cache"
npm run dev
```

Open the printed URL (Recast occupies 5173, so this lands on the next free port) — desktop only (by design).

## Stack

Vite + vanilla JS · GSAP ScrollTrigger + Flip · Lenis smooth scroll ·
Archivo Variable + JetBrains Mono · two colors (#000 / #fff) · film grain.

## Map

```
index.html            full page markup
privacy.html          privacy policy (separate page)
terms.html            terms of use (separate page)
src/main.js           boot sequence
src/legal.js          entry for the two legal pages
src/styles/*.css      base / loader / hero / chapter / grid / run / demo / faq /
                      finale / machine / legal
src/js/*.js           loader, cursor, grain, velocity, hero, chapters, grid, run,
                      chat (live demo), faq, finale, toggle (machine mode), utils
```

## Live demo

`#demo` is a working local chat with four agents — Research, File Organizer,
Code Agent, Report Writer — plus a **Launch crew** group thread. Goals are
routed by keyword (or picked from the chips), then the run walks the real
product loop: plan → approve → approval gate (allow once / always allow /
deny) → logged progress → report, with live counters and an action log. In the
crew thread one agent runs the plan and a second agent reviews the output
before it reaches you. Nothing leaves the page; there is no network call and no
model key. `deny` always wins, and `NEW CHAT` resets the thread.

## FAQ

`#faq` sits after the demo and before the finale — a light scene cut between
two dark ones. The eight questions are copied verbatim from the SHADOW site;
each row is a `<details>` whose answer height is tweened by `src/js/faq.js`, so
long answers never clip. Rows rise in on scroll with a staggered reveal, and the
`+` mark folds into `−` when a row opens. The footer carries `FAQ · PRIVACY ·
TERMS`.

## Finale

`#finale` is one screen — no pin, no scrub. `src/js/finale.js` runs a one-shot
entrance when the section reaches `top 74%`: the ring scales `1.14 → 1` while
its crosshairs draw in (`--fx` / `--fy` go 0 → 1), a 2px `.fin-sweep` scanner
crosses the stage once, then the headline rises char-by-char out of its mask
with `back.out(1.7)`. The ring also turns slowly with the scroll
(`-10° → 16°`, `scrub: 1.2`). The headline is the only type in the stage — the
`SHADOW` wordmark that used to sit under it is gone, so the ring is sized to
`124vmin` to keep the frame tight around it.

`.fin-l1` carries `padding-top: 0.14em; margin-top: -0.14em` so the overshoot
can never clip a glyph top, and `text-wrap: balance` keeps the two lines even.
The copy is split per **word** (`.wd` nowrap wrapper) with the chars inside it,
so a line can only break at a space — a plain char split lets the browser break
mid-word ("wor / k."). Under `prefers-reduced-motion` the stage is parked
assembled (crosshairs at 1, scanner hidden), the footer mark sits at rest, and
no tween is created.

## Legal pages

`privacy.html` and `terms.html` are separate Vite entries sharing
`src/legal.js` + `src/styles/legal.css`. They carry the landing's actual chrome,
not a plain document:

- fixed `#topbar` in `mix-blend-mode: difference` — mark + `SHADOW` at left,
  mono `FAQ / Privacy / Terms` with a hairline current-page underline, and a
  boxed `← Back` that inverts on hover
- a 2px `#lg-progress` rail that fills as you read
- a display `h1` (`clamp(96px, 22vw, 560px)`, `.lg-h1--long` for `Terms of use`)
  whose chars rise out of the baseline on load — always one line, never clipped
- a mono kicker with a scrambling `DOC 0n / …` code, meta row
  (`LAST UPDATED · SECTIONS · READS IN`), and a 56px store CTA
- a CSS marquee band between hero and body
- the document itself as numbered spec rows — `01…06`, hairline rules, mono key,
  hover slides the value 8px right
- live film grain, the arrow cursor with action labels, and the giant outlined
  `SHADOW` footer wordmark that fills solid under the cursor

Row reveal is gated on `body.anim` (added by JS), so the document stays fully
readable if scripts never run; `prefers-reduced-motion` stops the marquee and
shows all rows. No gate, no pin, no loader — the pages read on any screen.

Text is verbatim from the SHADOW site; only the brand is rendered `SHADOW`.
Both pages link back to the landing page and to each other.

## Store link

Both CTAs — `Get from Microsoft Store` and `Download` — sit on opposite diagonals
in the hero and in the finale: the store button is pinned bottom-left (above the
ticker in the hero), the download button is pinned top-right below the topbar.
Both are 64px tall so they read as the primary action, and both open the
Microsoft Store listing (`https://apps.microsoft.com/detail/9P52N15720DG`) in a
new tab.

## Verify

```
node test/verify.mjs http://localhost:<port>
```

Self-calibrating: measures each zone boundary through its pin-spacer (same
math as the page's zone engine), then asserts polarity + HUD stage there.

©2026 SHADOW — ASKS FIRST
