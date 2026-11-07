# FourFold motion plan

Written 2026-11-07, about 12:45 PM, for the 2:30 PM submission and the 3:00 PM live demo.
Scope: how things move. No code was changed for this plan. Read alongside `pitch/UX-PLAN.md` section 7 (the earlier spec) and `pitch/PITCH-KIT.md` (the demo script). Where the two specs disagree, this file wins for the app at `/app`; the "what NOT to do" list in UX-PLAN section 7 still applies in full.

Seen: live app at `/app?site=sa-10` (phone-width stacked layout), plus the code in `src/components/app`, `viz`, `landing`, `site`, and `globals.css`.

---

## 1. Principles

1. **Motion carries meaning.** The same particles are the world everywhere: the landing tunnel shows real lots, the city cloud is real parcels, the lot is one of those parcels. Nothing moves that is not data or a direct response to a click.
2. **Dividing the price is the product.** The single most important motion is the asking price dividing into per-home cost while the lot splits and the homes rise. Every other motion supports that moment or stays out of its way.
3. **One continuous world.** Landing, app, site, and window are one space. Prefer a camera move or a crossfade over a cut; never remount the WebGL stage just to change what it shows.
4. **One easing family, soft landings.** Everything eases out. Nothing snaps, bounces, or overshoots (Tango). No springs.
5. **Calm timing.** UI: 0.2 to 0.45 s. Camera: settles in about 0.8 s. The lot story: about 3.3 s. Idle: only the stage drifts.
6. **Reduced motion means the final frame, instantly.** Same information, same layout, no movement. Crossfades shorten to 0 or a 120 ms opacity change; nothing travels.

---

## 2. Motion tokens

### CSS (keep the existing names in `src/app/globals.css`, add three)

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(0.6, 0, 0.2, 1)` (exists) | Things that move from A to B while visible: sliding tab pill, panel slide, shared elements |
| `--ease-out` | `cubic-bezier(0.2, 0.6, 0.2, 1)` (exists) | Entrances, fades, bars filling, windows growing |
| `--ease-in` (new) | `cubic-bezier(0.4, 0, 0.9, 0.5)` | Exits only, always at `--fast`, so leaving is quick and quiet |
| `--fast` | `0.2s` (exists) | Hover, press, color, exits, copy feedback |
| `--medium` | `0.3s` (exists) | Panel content, chips, tab pill, number tweens on typed input |
| `--slow` | `0.45s` (exists) | Windows, theme crossfade, stage crossfades |
| `--stage` (new) | `0.6s` | City to lot crossfade, landing exit fade |
| `--stagger` (new) | `35ms` | Rows in lists and the checklist. Cap at 12 items; the rest appear with item 12 |

Press: `transform: scale(0.98)` at `--fast` `--ease-out`. Hover: background or border color only, `--fast`. No hover lifts or shadows that grow.

### three.js camera and shader timing

The camera code uses per-frame lerps: `k = 0.06` in `ParticleCity.tsx` (line ~155) and `k = 0.07` in `LotParticles.tsx` (line ~189). Per-frame lerps run twice as fast on a 120 Hz laptop and slow down when frames drop, so the demo machine may not match rehearsal. Replace both with one time-based constant:

```ts
const CAMERA_TAU = 0.27; // seconds; equals k = 0.06 at 60 fps. ~95% settled in 0.8 s.
const k = reduced ? 1 : 1 - Math.exp(-dt / CAMERA_TAU); // dt in seconds, clamp to 0.05
```

Use it for `blend`, `tech`, `look`, and `zoom` in ParticleCity and for `blend` in LotParticles. Idle orbit: change `az += 0.0009` / `0.0012` per frame to `az += dt * 0.054` / `dt * 0.072` (same speed at 60 fps). The cubic ease in the shaders, `1 - (1-x)^3`, is the 3D twin of `--ease-out`; keep it.

The lot story clock (`uT` in `LotParticles.tsx`, seconds since mount):

| Beat | Shader window | What |
|---|---|---|
| A. Assemble | 0 to 1.6 s (`(uT - aDelay*0.7)/0.9`) | Particles fly from scattered starts onto the parcel |
| B. Split line | 1.25 to 1.85 s (`step(aDelay, (uT-1.25)/0.6)`) | The split line draws |
| C. Lots part | 1.9 to 2.5 s | The two lots separate |
| D. Homes rise | 2.5 to about 3.3 s (`(uT - 2.5 - aDelay*0.5)/0.8`) | Homes rise, staggered by `aDelay` |

Everything in the site panel that animates should read this clock, not its own (see 3.2).

---

## 3. The connected moments

Effort is in minutes for one person who knows the code. Demo value is how much it helps the 2-minute demo and the 30-second video.

### 3.1 Landing "Enter FourFold" to the app

**Cheap version (S, 10 min, demo value med).**
- Trigger: click on any `/app` link in `Landing.tsx` (`.cta`, `.enter`, `.solid`).
- Beat 1, 0 to 0.5 s: the tunnel speeds up (card `z` speed ramps from `1.1` to about `9` units/s with `--ease-in` feel) so cards rush past the viewer, and the hero copy fades out at `--fast`.
- Beat 2, 0.25 to 0.6 s: a full-screen black layer fades in (`--stage`, `--ease-out`). The app stage is also black, so the handoff is invisible.
- Beat 3, on the app: the restyle's fade-in from black, then ParticleCity's existing intro (`uT` 0 to 2.6 s: points fall into place). Read together: the cards rush into the dark and the city assembles out of it.
- Files: `landing/Tunnel.tsx` (expose a `speedRef` or `onExit()` that ramps the speed), `landing/Landing.tsx` (intercept the click, call `exit()`, `router.push("/app")` at 0.5 s), `app/FourFoldApp.tsx` or the restyle's fade-in (start from `#000`, not the panel color).
- Note: preload `/city-points.bin` and `/city-points.json` on CTA hover (`fetch` into the browser cache) so the city never arrives late. Reduced motion: plain navigation, no ramp, no fade.

**Ambitious version (L, 60+ min, demo value high, skip today).**
- The tunnel cards dissolve into points that stream toward the vanishing point, and the city cloud's intro starts from a cylinder of the same radius instead of falling from above, so the tunnel visibly becomes the city.
- Files: `Tunnel.tsx` (sample N points per card texture into a `THREE.Points` and fade the card meshes), `ParticleCity.tsx` (an `aStart` attribute on a cylinder when `sessionStorage["ff-enter"]` is set, `p = mix(aStart, position, k)` instead of the drop-in). Too much for today.

### 3.2 Selecting a site from the list (the money shot)

Trigger: click a row in the Sites list (`onSelect` in `FourFoldApp.tsx`), a № tag in Map view, or `?site=` deep link (deep link skips beat 1).

| Beat | Time | What moves | From to | Easing |
|---|---|---|---|---|
| 1. Fly | 0 to 0.6 s | City camera | whole city to the lot's centroid, tight span | `CAMERA_TAU` lerp |
| 1b. Panel | 0 to 0.3 s | Address and verdict chip | list row position to the site card title (shared element) | `--ease` |
| 2. Handoff | 0.45 to 1.05 s | Stage layers | ParticleCity fades to 0, LotParticles fades in (`--stage`) | `--ease-out` |
| 3. Assemble | lot clock 0 to 1.6 s | Lot particles | scattered to parcel | shader cubic |
| 4. Split and divide | lot clock 1.25 to 2.5 s | Split line draws, lots part; Per home counts from Asking down to Asking ÷ 2 | asking to the Investor / home figure | cubic out over 1.25 s |
| 5. Homes and divide | lot clock 2.5 to 3.3 s | Each new home rises; Homes ticks 2, 3, 4 as each lands; Per home steps to Asking ÷ 3 then the final per-home value | | each step tweens 0.25 s `--ease-out` |

Why this shape: the number passes through Asking ÷ 2 exactly when the lot splits, which is the investor's per-home figure already printed on the card ("an investor gets two homes, so double that"), and lands on the true per-home value when the fourth home is standing. All intermediate values are the asking price divided by a home count; the final number is exact (`land_cost_per_home`). For sites with fewer than 4 homes, run only the beats their lot shows (UX-PLAN section 7 variants) and divide straight to the final value during beat 3.

Implementation notes:
- **One clock.** Lift `replay` and a `lotStart` timestamp into `FourFoldApp.tsx`: `onSelect` and Replay set `lotStart = performance.now() + 450`. Pass it to `MapStage` → `LotParticles` (use it instead of the internal `start`) and to `AnimatedNumber` (new props `startAt` and `steps: [{at: 1.25, dur: 1.25, to: asking/2}, {at: homeLanding[0], to: asking/3}, {at: homeLanding[1], to: per}]`). Today the number counts 0.3 to 1.7 s on its own clock and finishes before the lot even splits; Replay replays the lot but not the number.
- Home landing times: `2.5 + aDelay*0.5 + 0.8` for each new-home group; read the `aDelay` values from `lotModel.ts` when building, or simply use 2.9 s and 3.3 s.
- Homes count: a small `TickNumber` that shows 1 until 1.25 s, 2 at 2.5 s, then increments on each home landing. Keep the font tabular (`font-variant-numeric: tabular-nums`) so nothing shifts.
- **Fly then handoff (cheap).** Keep `ParticleCity` mounted under `LotParticles` instead of swapping (today `MapStage` replaces one component with the other, which is a hard cut and replays the city intro on the way back). Pass `focus={{cx, cy, span: 900}}` from the selected site's marker (the `markers` array already has centroids), stack `LotParticles` above in an absolutely positioned div with `opacity` transition `--stage`. Pause the city render loop when the lot is fully opaque (`paused` prop: skip `renderer.render`).
- **Fly then handoff (ambitious, skip).** Render the lot's points inside the city scene at the parcel's true position so the city dots under the lot become the lot. Coordinates match (both State Plane feet), but it means merging two scenes. L, 45+ min.
- **Shared element.** Use the View Transitions API: give the row's address `view-transition-name: addr-${id}` and the site title the same name, then `document.startViewTransition(() => flushSync(() => onSelect(id)))`. Feature-detect; without it the panel just cross-fades (3.5). Same for the verdict chip (`chip-${id}`). M, 15 min.
- Reduced motion: camera jumps, lot drawn at its final state (`uT = 10`, already handled), number shows the final value, Homes shows the final count.

### 3.3 Back to all sites

- Trigger: "← All sites", or clicking the selected row again.
- 0 to 0.3 s: LotParticles fades out (`--ease-in`, `--medium`); city loop resumes and fades in underneath.
- 0 to 0.8 s: city camera lerps back from the lot to the whole city (`focus = null`). The city does not re-run its intro because it never unmounted.
- Panel: site card title shares its name back to the list row (same View Transition, reversed automatically); the list rows fade in with `--stagger`, but only the 10 rows, and only on this return.
- Files: `MapStage.tsx`, `FourFoldApp.tsx`. Included in the 3.2 effort.

### 3.4 Switching 3D, Map, Technical

- Trigger: `ViewSwitch` click.
- City (no site): already one continuous camera move (`blend` and `uTech` lerps in `ParticleCity.tsx`). Only change: time-based `k`. № tags already fade with the blend alpha in the overlay canvas; keep them at 0 until `blend > 0.85` so they don't smear across a moving camera.
- Site, 3D ↔ Map: already continuous (`LotParticles` keeps the same key and lerps `blend`). Keep.
- Site, to Technical: today a hard swap from particles to the `LotBlueprint` SVG. Change to: LotParticles goes to its flat view (same camera as Map) and dims to 25% opacity over `--slow`; at 0.3 s the SVG fades in on top and its lines draw. Parcel outline 0 to 0.6 s, split line 0.15 to 0.6 s, the 4 ft setback line 0.3 to 0.75 s, then dimension labels fade in at 0.6 s (`--medium`). Use `pathLength="1"`, `stroke-dasharray: 1`, `stroke-dashoffset: 1 → 0` with `--ease-out`.
- Leaving Technical: SVG fades out at `--fast`, particles come back to full opacity and tilt back. No redraw.
- Files: `MapStage.tsx` (keep LotParticles mounted in tech, `view="flat"`), `LotBlueprint.tsx` (add `pathLength` and a class per line group), a few lines of CSS. Check alignment: the SVG frame pads by `extent * 0.16` while the particle flat view fits `E * 1.02`; if the outlines don't line up after a quick look, drop the particle layer to 0 instead of 25% so there is no visible double outline.
- Effort M, 15 min. Demo value high (the script holds on Technical for 2 seconds; drawing lines make that 2 seconds feel alive).
- Reduced motion: lines appear drawn; plain 120 ms opacity swap.

### 3.5 Tabs Sites, Groups, City

- Trigger: a tab in the glass pill nav.
- Pill indicator: one absolutely positioned pill slides under the active tab (`transform: translateX()` and `width`, `--medium`, `--ease`). Measure with `offsetLeft` and `offsetWidth`. S, 8 min. High value: it is clicked three times in the demo.
- Panel content: key the content wrapper by tab and play an enter animation on mount: `opacity 0 → 1`, `translateX(calc(var(--dir) * 12px)) → 0`, `--medium`, `--ease-out`, where `--dir` is +1 when moving right (Sites → Groups → City) and -1 when moving left. Skip the exit animation (it costs delayed unmount and adds nothing at this speed). S, 6 min.
- Camera in the same move: City tab sets `focus = null` (whole city, and a slightly higher, flatter angle is fine if it exists already; otherwise just zoom out). Groups tab with a group open sets `groupFocus` (already wired). Clicking a group card reframes over the same `CAMERA_TAU`. City tab's stat bars fill once on entry: `width` from 0 with `--slow`, `--ease-out`, 80 ms stagger, so 25,246 lands last. S, 4 min.
- Files: `FourFoldApp.tsx` (or the restyle's nav component), `FourFoldApp.module.css`, `globals.css` (`.statbar > i { transition: width var(--slow) var(--ease-out) }` plus a mount class).
- Reduced motion: pill jumps, content appears, bars show full width.

### 3.6 Opening a window (Checklist, Call sheet, Fund the gap, Local support)

- **Grow from the button.** `Window.tsx` already captures the opener (`document.activeElement`) for focus return. On mount, read the opener's rect and the window's rect, set `transform: translate(dx, dy) scale(sx, sy)` with `transform-origin: top left`, then on the next frame transition to `none` over `--slow`, `--ease-out`. Content fades in from 0.12 s (`--medium`) so text is never seen squashed. Scrim fades in over `--medium`. Close: reverse at `--medium` with `--ease-in`; add an internal `closing` state and call `onClose` on `transitionend` (fallback timer 350 ms). Effort S/M, 12 min. Demo value high (windows open three times in the demo).
- **Checklist rows tick in.** Rows exist at first paint (no layout shift). CSS only, no change to `Checklist.tsx`: `.ff-win-body tbody tr { animation: ffRow var(--medium) var(--ease-out) both; }` with `animation-delay` via `:nth-child(n)` rules for 1 to 12 at `--stagger`. The status chip (PASS, FAIL, UNKNOWN) in each row fades in 80 ms after its row. Chips never animate color or scale; the meaning is in the word. S, 5 min. High value for the tenant-row moment on 1213 S Corta.
- **Fund the gap.** Gap and per-home figures tween from the old value to the new one: a `useTween(value, ms)` hook (the rAF loop from `AnimatedNumber.tsx`, starting at the previous value). Typed input: 300 ms. Donation slider drag: 120 ms so the number tracks the thumb without lag. Any bar fills with `width` transition `--medium` `--ease-out`. When the gap reaches covered, the label swaps with a 0.2 s crossfade; no celebration. S, 10 min. Med value.
- Files: `app/Window.tsx`, `globals.css`, `FundGap.tsx` (wrap the three money outputs).
- Reduced motion: window appears with a 120 ms opacity fade, rows appear at once, numbers jump.

### 3.7 Small moments

| Moment | Motion | File | Effort | Value |
|---|---|---|---|---|
| Copy email to agent | Label crossfades "Copy email" → "Copied" (`--fast`), button `min-width` locked so nothing shifts, reverts after 2 s (today `copied` never resets) | `CallSheet.tsx` | S, 4 | med |
| Theme toggle | Whole page crossfades over `--slow`: `document.startViewTransition(() => setTheme(next))`, with `::view-transition-old(root), ::view-transition-new(root) { animation-duration: .45s; animation-timing-function: var(--ease-out) }`. Fallback: add `html.theme-fade` for 450 ms with `transition: background-color, color, border-color var(--slow)`. Also remove `theme` from the WebGL effect deps in `ParticleCity.tsx` (line 271) and `LotParticles.tsx` (line 209) when `ink`/`accent` are fixed: today a theme change tears down the stage and replays the city intro and the lot split mid-demo | `theme.ts`, `ThemeToggle.tsx`, viz files | S, 10 | high (removes a visible glitch) |
| Font switch (Aa) | Same root View Transition, `--medium` | `FontSwitcher.tsx` | S, 2 | low |
| Pills, rows, tags hover | Background or border color, `--fast`. Hovering a list row brightens its point on the stage (if the hover link exists; do not build it today) | CSS | S, 3 | low |
| Press | `scale(0.98)` `--fast` on buttons and rows | CSS | S, 2 | low |
| Loading | No spinners. Stage: the city intro is the loading state; until points arrive the stage is plain black with the corner label. Windows: rows render as faint placeholders at final height | `MapStage.tsx` | S, 3 | med |
| Live address check | Each test row appears as its result arrives (or, if results arrive together, stagger them at 60 ms so the user sees tests resolve one by one, PASS/FAIL/UNKNOWN words fade in, no color animation). Pending rows show "checking" in faint mono, never a spinner | `LiveCheck.tsx` | S, 8 | med (only if the live check is shown) |
| Replay | Restarts the shared lot clock, so the number and Homes count replay too | `FourFoldApp.tsx` | in 3.2 | high |

### 3.8 Idle

Only the stage drifts: the slow orbit in 3D (`az`), and the tunnel on the landing. Nothing in the panel, nav, or windows moves on its own. No pulsing dots, no looping text, no counters. Map and Technical views do not drift.

---

## 4. Choreography for the 2-minute demo

Aligned to PITCH-KIT section 3. Times are from the start of the talk.

| Time | Line (short) | Click | What the audience sees move |
|---|---|---|---|
| 0:00 to 0:15 | "We're FourFold... Nonprofits are exempt." | none (Tab 1, Sites, 3D) | Stage drifts slowly. If the page was just loaded, the city has already assembled; do not reload on stage. |
| 0:15 to 0:30 | "Four likely yes, two need a call, four no." | hover down the list | Row hovers only. Stage stays calm so attention stays on the list. |
| 0:30 | "2121 Valencia." | click the Valencia row | Address and chip glide into the card title; camera flies into the city. |
| 0:31 to 0:33 | "That's the real parcel from the city." | none | City fades out, lot particles assemble onto the parcel outline. |
| 0:33 to 0:35 | "Watch it split." | none | Split line draws, the two lots part; Per home falls from $949,000 to $474,500 (the investor figure on the card). |
| 0:35 to 0:37 | "Keep it and build three." | none | Homes rise one by one; Homes ticks to 4; Per home steps to $237,250 as the fourth lands. Say the number after it lands. |
| 0:37 to 0:48 | "$949,000 asking... so double that." | Replay if needed | If the room missed it, click Replay: the whole sequence, number included, plays again in 3.3 s. |
| 0:48 to 0:55 | "Same lot as a blueprint..." | Technical | Particles flatten and dim; outline, split, and the 4 ft setback line draw in; dimensions fade in. |
| 0:55 | "Does it pencil?" | Fund the gap | Window grows from the button. |
| 0:58 to 1:10 | inputs, donation | type or drag | Gap number glides to each new value; bar follows. Close: window shrinks back into the button. |
| 1:10 | "Where does Claude come in?" | Tab 4 (1213 S Corta, checklist) | Pre-opened tab: rows tick in on load. Point at the tenant row after it lands. |
| 1:25 | "Buy close together." | Groups tab, then Group A | Pill slides; panel slides in from the right; camera reframes to Group A's sites in one move. |
| 1:40 | "We screened all 57,926 parcels." | City tab | Pill slides; camera pulls back to the whole city; the four stat bars fill, 25,246 last. |
| 1:50 to 2:00 | close | none | Stage drifts. Nothing else moves while the closing line lands. |

30-second video: same moments, compressed. Click Valencia at 0:05 so the lot sequence (about 3.8 s from click including the 0.45 s fly) finishes by 0:09.5 and the per-home number has landed before "about two thirty-seven per home". Technical at 0:17 gives the lines 0.75 s to draw before the Checklist click.

---

## 5. Build order for the next ~60 minutes

Do this after the restyle lands in main, or limit edits to files the restyle does not touch (`viz/*`, `Window.tsx`, `AnimatedNumber.tsx`, `CallSheet.tsx`, `FundGap.tsx`, a new block at the end of `globals.css`). `FourFoldApp.tsx` and `MapStage.tsx` are the merge-risk files; touch them in one short pass.

### Must (about 55 min, in this order)

1. **Time-based camera lerp** in ParticleCity and LotParticles (5 min). Protects the demo on an unknown machine.
2. **Drop `theme` from the WebGL effect deps** when ink/accent are fixed (5 min). Stops the stage replaying mid-demo on a theme click.
3. **One lot clock: per-home divides with the split, Homes ticks with the homes, Replay replays both** (15 min). The core moment.
4. **Keep the city mounted; fly to the lot, crossfade the lot in; reverse on back** (cheap version of 3.2 and 3.3) (15 min).
5. **Window grows from its button; checklist rows tick in (CSS only)** (12 min).
6. **Tab pill slides; panel content enters with direction** (8 min, more if the restyle's nav is unfamiliar).

### Should (if time remains, in this order)

7. Technical lines draw in over dimmed particles (15 min).
8. Theme crossfade via View Transitions with the class fallback (5 min).
9. City stat bars fill on entry (4 min).
10. Fund the gap number tweens (10 min).
11. Landing exit, cheap version, plus city data preload on hover (10 min).
12. Row to card shared element via View Transitions (15 min).
13. Copy email feedback that resets (4 min).

### Skip today

- Tunnel cards dissolving into the city (ambitious 3.1).
- Lot rendered inside the city scene (ambitious 3.2).
- Row hover lighting its point on the stage.
- Font switch transition.

### If time runs short

Cut from the bottom of Must upward, but never cut 1, 2, or 3. If 4 is not done, keep the current hard swap; it works. If only 15 minutes remain, do 1, 2, and the number half of 3 (`AnimatedNumber` with `delayMs={1700}` and `durationMs={1250}` lines it up with the split for a first play, 5 minutes, no clock lifting).

Before recording: load the app once, wait for the city, then record, so the intro has run and assets are cached.

---

## 6. Performance and accessibility

**Frame budget.** 60 fps target: about 16 ms per frame, with WebGL under 8 ms. Only one particle scene renders at a time except during the 0.6 s handoff. Pixel ratio capped at 2 (check `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` in both viz files). If 10 consecutive frames exceed 20 ms during the lot story, jump `uT` to the final frame (UX-PLAN rule).

**Pause when unseen.** Stop the rAF loop on `document.hidden` (Tunnel already does this; add it to ParticleCity and LotParticles), when a window covers the stage (render one last frame, then stop until close), and when the city layer sits fully under an opaque lot (`paused` prop). Use an `IntersectionObserver` for the stage on narrow screens where it can scroll off.

**Layout shift.** Numbers use tabular figures and reserved widths. Copy button has a `min-width`. Checklist rows are at full height before they fade. Windows grow by `transform`, never by `width`/`height`. Stat bars animate `width` inside a fixed track, or better `transform: scaleX()` with `transform-origin: left`. Tab content enters with `transform` and `opacity` only.

**Reduced motion (per moment).**

| Moment | With `prefers-reduced-motion: reduce` |
|---|---|
| Landing exit | Plain navigation; tunnel static (already) |
| Select site / back | Camera jumps; lot shows final state; Per home and Homes show final values |
| View switch | Instant camera; blueprint lines already drawn |
| Tabs | Pill jumps; content appears |
| Window | 120 ms opacity fade, no grow |
| Checklist, live check | Rows appear together |
| Numbers | Final value, no tween |
| Theme, font | Instant (skip the View Transition) |
| Idle drift | Off (already) |

The global rule in `globals.css` (`* { transition: none !important; animation: none !important; }`) covers CSS. The JS animations must check `useReducedMotion()` (both viz files and `AnimatedNumber` already do; add it to the tween hook, the window grow, and the View Transition calls). Also honor `?motion=0` for the venue machine.

**Other accessibility.** Focus moves into each window and back to the opener (already in `Window.tsx`; keep it with the close animation). Announce the final per-home value once via the existing text, not every tween step: put `aria-live` off on the tweening span and give it an `aria-label` with the final value. No motion conveys meaning that text does not also state.
