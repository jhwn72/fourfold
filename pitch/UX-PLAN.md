# FourFold UX plan

For John and Jerry. Written 2026-11-07 about 12:15 PM Pacific, after clicking through every page of https://fourfold-splitter.vercel.app at 1440x900 and at phone width (375x812).
Submissions close 2:30 PM. Finalists demo live at 3:00 PM.

This is a plan, not code. Every number below comes from the live site, `data/results.json`, `data/citywide.json` or the README. Anything not decided is marked **OPEN**.

**Heads up before anyone says a number on stage:** the live home page today shows **4 LIKELY YES, 2 UNKNOWN, 4 NO**. 1213 S Corta Dr (sa-06) is now UNKNOWN because the Claude listing reader is on. `pitch/PITCH-KIT.md` still says 5 / 1 / 4 in section 1. Fix the pitch kit and re-record the table shots it lists.

---

## 1. Friction audit

Measured with `scrollHeight` and element offsets in the built-in browser. "Screens" = page height divided by viewport height.

| # | Page | Issue (observed) | Severity | Fix |
|---|---|---|---|---|
| 1 | /site/[id] | The answer to "what do I do next" is far down. On sa-04 the checklist starts at 2,084 px (2.3 screens) on desktop and 3,610 px (4.4 screens) on phone. The call sheet starts at 3,653 px desktop and 8,323 px phone (about 10 phone screens). Page is 5,047 px desktop, 11,177 px phone. | High | New first screen: verdict header, stat strip, lot, and a "Next call" card with the top questions and Copy email. Everything else behind a sticky section nav. |
| 2 | /site/[id] (NO sites) | On sa-01 the failing row (FEMA flood A) sits at 1,362 px, below the fold. The pitch script has to pre-scroll to it. | High | Verdict header names the failing test with its value and source link on line one. |
| 3 | /site/[id] | Fund the gap is a long form placed second in the right column, above the fold. On first view its result reads "Total cost UNKNOWN, Total funding $0". It pushes listing evidence and the checklist down. | High | Move to its own section below the checklist, collapsed to a one-line summary with "Open calculator". Keep the UNKNOWN-until-construction rule. |
| 4 | / | The ranked list is below the fold on phone (table top at 1,024 px on an 812 px screen). On desktop it starts at 524 px, under a duplicate "FourFold" H1, a paragraph and a filter box. | High | Hero becomes headline + stat strip, list starts in the first screen. Filters collapse into one "Filter" button. |
| 5 | / (phone) | The 10-column table is 737 px wide inside a 343 px wrapper: sideways scroll to see verdict, price and per home together. | High | Below 640 px, render each row as a card: address, verdict chip, homes, per home, one-line why. |
| 6 | All | One color means three things. Amber is the UNKNOWN verdict (`.verdict-UNKNOWN`), the ASSUMPTION label (`.label`) and "inside a historic district" on the city map. Meanwhile an UNKNOWN check row is gray (`.UNKNOWN`), not amber. | High | One role per meaning: UNKNOWN has one color everywhere; ASSUMPTION is an outlined mono tag, not a status color; historic-district dots use the UNKNOWN role (they are "possible fail"). |
| 7 | / | Live check is the last thing on the page (heading at 1,674 px desktop). The demo needs it and the city page links into it. | Medium | Header button "Check an address" (the reference's off-white button with blue arrow block) that goes to a dedicated `/check` page. Keep `/?address=...#live` working. |
| 8 | Shell | Header has one nav link ("Whole city"). Comparables and the call list are only reachable from inline links mid-page. Tagline wraps to two lines on phone, header about 130 px tall. | Medium | Four nav items (section 2). Tagline drops on phone. |
| 9 | / | Low-information columns: "Why" repeats the same sentence on all 4 LIKELY YES rows, "Unknowns" is 6 on 9 of 10 rows, "Parking" says "none needed" on all 10. | Medium | Keep in CSV and filters; drop Parking and Unknowns from the default list view. "Why" shows only what differs (the fail reason, or "keeps the house", or the tenant flag). |
| 10 | / | Exports are a row of 4 inline links mixed with the comparables link, below the table. | Medium | One "Export" menu next to the list title: Call list (PDF), Ranked list (CSV), Citywide lots (CSV). |
| 11 | /site/[id] | Verdict and reason appear twice (top, and again as the checklist header). | Low | Show once in the header; checklist header becomes the counts line only (e.g. "5 pass, 6 unknown"). |
| 12 | /site/[id]/brief vs /site/[id] | The printable brief has a clean "Key numbers" block (asking, max homes, per home, $360k ASSUMPTION, difference). The site page itself does not. | Medium | Reuse that block as the stat strip on the site page. |
| 13 | /brief | "Top open question" is the same historic question (planning desk) on all 4 LIKELY YES rows, so the column does not tell sites apart. | Medium | **OPEN** for the team: lead with the listing-agent question (tenant history), since that is the first call and can change the verdict. Do not invent a priority score. |
| 14 | /city | 9,133 px desktop, 18,132 px phone. Candidate list is sorted by address text ("1001 CATALINA AVE" first), shows 200 of 25,246. "1001 GRAHAM LN, APN 109-062-33" appears 3 times with different lot sizes. | Medium | Sort options (lot size, address). Flag the repeated-APN rows as a data question; do not hide them silently. |
| 15 | /city | The 10 listings are not marked on the map, and the map is not clickable. The story "these 10 out of 25,246" is not visible. | Medium | Mark the 10 listings (their parcel rings are in the same State Plane frame as the city points) and link each to its site page. |
| 16 | /city -> live check | "Check live" sends you to the home page bottom (`/?address=...#live`), losing the city context. | Low | Link to `/check?address=...` instead. |
| 17 | /comparables (phone) | "All projects" table is 1,010 px wide on a 375 px screen. Page 8,520 px on phone. | Low | Collapse the all-projects table behind "Show all 68"; on phone show Where, Address, Status only. |
| 18 | /site/[id] | "Listing evidence (read by Claude)" is a large card high on the page even when all flags are "not stated" (sa-04). | Low | Move into the checklist's tenant row as an expandable "What Claude read". Promote it to the header only when a flag is present (sa-06). |
| 19 | /site/[id] | Lot drawing is about 400 px wide, blue house icons on pastel lots. It is the most memorable visual and is small. | Medium | Make it the hero of the site page (particle version in section 7), at least half the first screen on desktop. |

What already works and must not break: precomputed pages load instantly; `?address=` prefill; PDF briefs; CSV exports; every row has a source and date; UNKNOWN is said plainly; disclaimer is in the footer on every page.

---

## 2. Information architecture

### Top-level nav (4 items + 1 action)

| Nav label | Route | One-line job |
|---|---|---|
| Sites | `/` | The ten houses for sale, ranked, and why. Start here. |
| Whole city | `/city` | Every Santa Ana parcel screened once: the scale story. |
| SB 9 projects | `/comparables` | 68 labeled SB 9 projects in Orange County: proof the path is real. |
| How it works | `/method` (new) | Sources, what is real vs ASSUMPTION, what is UNKNOWN and why, where it is wrong. Built from README tables. |
| **Check an address** (button) | `/check` (new, thin wrapper around LiveCheck) | Run any Santa Ana address live. |

Wordmark "FourFold" links to `/`. Disclaimer stays in the footer of every page, and also as one muted line under every stat strip that shows money.

### Page map

```
/                     Sites (home): hero cloud + stat strip + ranked list + Export menu
├─ /site/[id]         One site: verdict, numbers, lot, next call, then sections
│   └─ /site/[id]/brief   Printable briefing (unchanged, light theme)
├─ /brief             Printable 10-site call list (unchanged, light theme)
├─ /results.csv       Export
/city                 Whole city: map with listings marked, funnel counts, candidate list
├─ /city.csv          Export
/comparables          SB 9 projects in OC
/method               New: sources and assumptions (or link to README if time runs out)
/check                New: live check (LiveCheck component)
/api/check            Unchanged
```

### What moves, merges or gets demoted

| Item | Today | Proposed |
|---|---|---|
| Live check | Bottom of home | `/check` page + header button. Home keeps `#live` anchor working via a small link "Check any address" under the list. |
| Exports (PDF list, 2 CSVs) | Inline links under table | Export menu on Sites (call list PDF, ranked CSV) and on Whole city (city CSV). Site brief PDF stays as a button in the site header. |
| Comparables | Inline link + card at the bottom of every site page | Top nav item. Site page keeps a one-line summary ("Santa Ana: UNKNOWN. 68 labeled projects in 7 OC jurisdictions, median permit to completion 9.3 months") linking to `/comparables`, collapsed table. |
| Methodology and sources | Muted paragraphs on each page, README | `/method` page. Each page keeps its inline source links; the long explanations move. |
| Ranking explanation and "checks run at" timestamp | Paragraph above table | One mono caption line under the list title, with a "How ranking works" link to `/method#ranking`. |
| Investor vs nonprofit card | Under the lot drawing | Section "Why a nonprofit wins" on the site page, first after the checklist. Its key number (investor $ per home vs nonprofit $ per home) also appears in the stat strip on 4-home sites. |
| Listing evidence | Big card | Inside the tenant checklist row; header callout only when a flag is present. |
| Fund the gap | Second card, above the fold | Collapsed section with one-line summary. |
| Header tagline | Always | Desktop only. |

Nothing is deleted. Depth sits behind section nav, accordions and the `/method` page.

---

## 3. Primary flows

Click counts are from landing on the URL. Scrolls are counted where they remain.

### (a) Judge's 60-second first impression

| Step | Screen state | One primary action |
|---|---|---|
| 1. Land on `/` | First screen at 1440x900: headline "One home into four." with gray second line "Where a nonprofit can use SB 9, and an investor can't."; the Santa Ana point cloud with candidates in the accent; stat strip: 10 listings checked · 4 likely yes · 57,926 parcels screened · 68 OC SB 9 projects; top 3 to 4 ranked rows visible. Copy and numbers to be confirmed against the live data at build time. | Click row 1 |
| 2. `/site/sa-04` | First screen: LIKELY YES, 4 homes, $865,000 ÷ 4 = $216,250 vs $360k ASSUMPTION, lot splitting in particles, Next call card with "6 open questions". | Scroll once to see the checklist with sources |

Total: **1 click, 1 scroll**. Today: 1 click and about 2.3 screens of scroll to reach a single source.

### (b) Acquisitions lead: "which 10 to call and why", then export

| Step | Screen state | Primary action |
|---|---|---|
| 1. `/` | Ranked list in first screen, each row shows its differing reason. | Optional: Filter (verdict, max per home, keeps house, no tenant flag; existing filters, shareable link kept) |
| 2. Export menu open | Call list (PDF) · Ranked list (CSV) · Citywide lots (CSV) | Choose "Call list (PDF)" |
| 3. `/brief` | Print-ready list with top open question and who to ask | Save as PDF |

Total: **2 clicks** to the call list, **3** to the saved PDF, no scroll. Today: about 1 screen of scroll, then the same clicks.

### (c) Evaluate one site: verdict, why, unknown, who to call

| Step | Screen state | Primary action |
|---|---|---|
| 1. `/site/[id]` | Verdict header: chip + one-line reason. For NO, the failing test, its value and source on that line. Stat strip. Lot. Next call card listing the first 2 questions, grouped by who to call, with counts per contact. | "See all 6 open questions" |
| 2. Same page, Checklist section (sticky section nav) | Rows: status word + value + source link + date. Rule text and statute in an expandable row detail. UNKNOWN rows show their "Next:" line inline. | Expand a row, or jump to Call sheet |
| 3. Call sheet section | Questions grouped by contact, draft email to the listing agent | Copy email (drafts only, never sends) |

Total: **1 click** to verdict + why + next call (first screen), **2** to all unknowns, **3** to a copied email. Today: 1 click plus about 4 desktop screens (10 phone screens) to the call sheet.

### (d) Funder or donor: fund the gap

| Step | Screen state | Primary action |
|---|---|---|
| 1. `/site/sa-04` | Stat strip shows purchase per home. | Section nav: "Fund the gap" |
| 2. Fund the gap, collapsed | One line: "Purchase $865,000 real. Construction: enter a builder's estimate. Gap UNKNOWN until then." | Open calculator |
| 3. Calculator open | Existing FundGap form. ASSUMPTION example buttons as they are now (no construction default, as the README says). Result block sticky at the bottom of the section on desktop. | Enter construction, click examples |

Total: **2 clicks** to the open calculator, plus typing. The gap stays UNKNOWN until construction is entered; that is correct and should be said in the collapsed line, not hidden.

### (e) Scale story: whole city, then comparables

| Step | Screen state | Primary action |
|---|---|---|
| 1. `/` | Stat "57,926 parcels screened" in the strip, linked | Click it (or nav "Whole city") |
| 2. `/city` | Map (same point-cloud component as home, static), funnel: 57,926 → 30,590 single-family → 30,352 splittable → 25,246 pass flood, fire, city historic list (+347 in a historic district, possible fail). The 10 listings marked. Caption: "A first screen, not a verdict." | Click "68 labeled SB 9 projects in OC" |
| 3. `/comparables` | Counts by city and year, Santa Ana UNKNOWN row, median 9.3 months (15 projects) | Back to Sites |

Total: **2 clicks**. Today: 1 header click, then the comparables link is only on the home page or at the bottom of site pages.

---

## 4. Page-by-page layout specs

Breakpoints: desktop 1440x900 (also check at 125 to 150% browser zoom, which the demo uses; that is about 960 to 1150 px effective width), tablet 768, phone 390.

### Shared shell

| Region | Content | Notes |
|---|---|---|
| Header, 56 px | Wordmark · Sites · Whole city · SB 9 projects · How it works · [Check an address →] | Nav labels in the mono label role, uppercase, as in the reference nav. Active item has the text role, others muted. On phone: wordmark + "Check" button + menu button opening a full-height sheet with the 4 items. |
| Main | Max width **OPEN** (today 1100 px). Proposal: 1200 px content, the hero canvas may run full-bleed. | |
| Stat strip (component) | Used on home, site, city | Thin hairline-bordered row of cells: mono label (2 lines max) over numeric value. Taken from the reference's bottom strip. |
| Footer | "Prototype. Not legal or financial advice. Confirm with the city and a professional." + "Data checked 2026-11-07" + GitHub link | Always present. Print pages keep their own light styles. |

Shell components: `AppShell` (layout.tsx), `NavBar`, `CheckButton`, `StatStrip`, `Footer`, `StatusChip`, `MonoLabel`.

### Home `/`

Section order:

1. **Hero** (two columns desktop, stacked phone). Left: mono kicker ("SANTA ANA / SB 9 / 10 LISTINGS, 2026-11-07"), headline line 1 in text role, line 2 in muted role, one sentence with the HCD fact sheet p.2 link, primary button "See the ranked list ↓" (anchor) and secondary text link "Check an address ↗". Right: `CityCloud` canvas (static on first paint, see section 7).
2. **Stat strip**: Listings checked 10 · Likely yes 4 · Parcels screened 57,926 · Candidate lots 25,246 · OC SB 9 projects 68. Values read from data at build time, never typed into the page.
3. **Ranked list**: title "Santa Ana: homes for sale, ranked" + mono caption (ranking rule, checks run time) + [Filter] + [Export ▾]. Desktop columns: #, Address/APN, Verdict, Homes, Asking, Per home (vs $360k ASSUMPTION), Keeps house, Why. Phone: cards.
4. **Footnote**: per-home definition and ASSUMPTION tag, link to `/method`.
5. Link row: "Every lot in Santa Ana →" and "Check any address →" (keeps `#live` reachable; `#live` anchor may render LiveCheck inline here as today, or redirect to `/check`; **OPEN**, inline is the safer choice for the demo script).

Above the fold at 1440x900: header, hero (about 420 px), stat strip (about 72 px), list title row and the first 3 rows. Hero height must be capped so row 1 is visible without scroll.
Above the fold at 390 wide: header, kicker, headline, one-sentence pitch, button; the cloud shrinks to a 16:9 band (about 200 px) or moves below the stat strip (**OPEN**, pick whichever keeps the first site card visible). Stat strip scrolls horizontally as one row, or wraps 2x3.

Collapses: Filters into a drawer (desktop: inline panel toggled by the Filter button; phone: bottom sheet). Exports into a menu.

Components: `NavBar`, `HeroCopy`, `CityCloud`, `StatStrip`, `SiteTable` (desktop) / `SiteCards` (phone, same data), `FilterPanel` (extracted from SiteTable), `ExportMenu`, `LiveCheck` (only if kept inline), `Footer`.

### Site detail `/site/[id]`

The first screen answers: **can a nonprofit turn this into 4 homes, at what cost, and what do I do next.**

First-screen order (desktop 1440x900):

1. **Breadcrumb row**: "← All sites" · rank "1 of 10" · [Briefing PDF] button.
2. **Verdict header** (`VerdictHeader`): address as the display headline, APN + lot sq ft (city polygon, and listing figure if different) + listing link as a mono line; verdict chip + reason. For NO: "Fails: in a FEMA special flood hazard area (FEMA: A)" with the source link right there. For UNKNOWN: the possible FAIL and who confirms it (sa-06: listing quote shown here).
3. **Stat strip**: Max homes · Asking · Per home (with "vs $360k ASSUMPTION" and the difference) · Investor per home (asking ÷ 2) on 4-home sites · Open questions (count, links to checklist filtered to UNKNOWN). For NO sites: Max homes 0, Asking, Per home "n/a, SB 9 does not apply".
4. **Two columns**: left (about 60%) `LotParticles` (the split sequence, final state equals today's LotSvg), with caption "Real parcel outline. Dashed line is a sketch of one equal split, not a survey." Right (about 40%) `NextCallCard`: who to call first, the first 2 questions, "+ 4 more", [Copy draft email], [See call sheet].
5. **Sticky section nav** (pins under the header once you scroll): Checklist · Why a nonprofit wins · Call sheet · Fund the gap · Nearby SB 9 projects · Sources.

Below the fold, in that order:

6. **Checklist** (`Checklist`): counts line, then rows. Each row: status word + value + one-line note + source link + date. Rule text, statute numbers and "Next:" expanded in a row detail (UNKNOWN rows show "Next:" without expanding). Bonus rows (keep house, parking, landslide) in a separate "Site notes, do not change the verdict" group. Tenant row includes "What Claude read" detail (from listing evidence).
7. **Why a nonprofit wins** (`InvestorCard`), only on 4-home sites.
8. **Call sheet** (`CallSheet`), grouped by contact, draft email.
9. **Fund the gap** (`FundGap`) collapsed, plus `CostCompare` sentence merged into its summary line.
10. **Nearby SB 9 projects** (`Comparables`) as one summary line + collapsed table.
11. **Sources** line (HCD fact sheets, read date, computed time).

Above the fold at 390 wide: breadcrumb, address (2 lines), verdict chip + reason, stat strip (2x2 grid), and the top of the lot. Next call card comes directly after the lot, before the section nav. Section nav becomes a horizontally scrolling chip row.

Collapses: checklist row details (accordion), Fund the gap (accordion), comparables table (accordion), listing evidence (inside tenant row). Nothing is removed.

Components: `VerdictHeader`, `StatStrip`, `LotParticles` (+ `LotSvg` fallback), `NextCallCard`, `SectionNav`, `Checklist`, `InvestorCard`, `CallSheet`, `FundGap`, `CostCompare` (summary only), `Comparables` (compact), `PrintButton`, `StatusChip`.

### Whole city `/city`

Section order:

1. Title "Every lot in Santa Ana" + one-line caption "A first screen on parcel centers, not a verdict."
2. **Stat strip / funnel**: 57,926 parcels → 30,590 single-family → 30,352 big enough to split → 25,246 pass flood, fire and the city historic list (+347 in a historic district, possible fail).
3. **Map** (`CityCloud` in static mode, same component as home): candidates in the accent role, others in a low-opacity neutral, historic-district parcels in the UNKNOWN role, the 10 listings as larger marked points with mono labels on hover, each linking to its site page. Legend in mono labels.
4. "Why parcels drop out" counts as a compact two-column list (today's content).
5. **Candidate list** (`CandidateList`): filters as today + sort (lot size, address), first 200 shown, "Check live" goes to `/check?address=`. Note the repeated-APN rows (question for the data, **OPEN**).
6. Export: Citywide lots (CSV).
7. Link: "68 labeled SB 9 projects in Orange County →".

Above the fold at 1440x900: title, funnel strip, top half of the map. At 390: title, funnel strip (stacked), map band.

Components: `StatStrip`, `CityCloud`, `MapLegend`, `CandidateList`, `ExportMenu`.

### Comparables `/comparables` and How it works `/method` (light touch)

Comparables: keep content; stat strip (68 projects · 7 jurisdictions · Santa Ana UNKNOWN · median 9.3 months, 15 projects); counts table; all-projects table collapsed behind "Show all 68".
Method: README sections rendered as-is: SB 9 tests and sources table, Sources and assumptions table, What is UNKNOWN and why, What is real and what is mocked, Where it gets things wrong, How Claude is used. Anchor ids for each (`#ranking`, `#sources`, `#unknown`, `#real-vs-mock`, `#wrong`, `#claude`).

---

## 5. Component inventory

States key: **L** loading, **E** empty, **U** UNKNOWN, **Err** error, **PF** possible FAIL.

| Component | File | Data it reads | States | Change |
|---|---|---|---|---|
| SiteTable | `src/components/SiteTable.tsx` | `RESULTS.results[]`: id, address, parcel.apn, verdict, verdict_reason, max_homes, asking_price, land_cost_per_home, keep_house, unknown_count, listing_evidence | E: "No sites match these filters" + Reset. U: verdict UNKNOWN chip. PF: reason starts "Possible FAIL to confirm". No L (static). | Extract filters into `FilterPanel`; drop Parking and Unknowns from the default view (keep in CSV); add `SiteCards` for phone. |
| LotSvg | `LotSvg.tsx` | parcel.rings, split.lot_a/lot_b, max_homes, buildings, keep_house | No parcel: "No parcel polygon" (exists). NO: outline only, no split. 2 homes: no split line. | Becomes the static fallback and final frame of `LotParticles`. Recolor to tokens. |
| Checklist | `Checklist.tsx` | `checks[]`: test, status, value, note, rule, source_name, source_url, checked_at, affects_verdict | PASS / FAIL / UNKNOWN / PF rows; bonus rows grouped. | Row detail accordion; header becomes counts only; tenant row hosts listing evidence. |
| CallSheet | `CallSheet.tsx` | UNKNOWN checks mapped to contact + question; draft email | E: "Nothing left to confirm from public data" (only if zero unknowns). | Unchanged content; also feeds `NextCallCard`. |
| FundGap | `FundGap.tsx` | asking_price, max_homes, user inputs, ASSUMPTION examples | U: gap UNKNOWN until construction entered (keep). NO site: hide or show "SB 9 does not apply" (**OPEN**, check current behavior on sa-01). | Wrap in collapsed section with a summary line. |
| InvestorCard | `InvestorCard.tsx` | asking_price, max_homes | Only on 4-home sites. | Moves below checklist; its two per-home numbers feed the stat strip. |
| CostCompare | `CostCompare.tsx` | asking_price, max_homes, land_cost_per_home | U: "UNKNOWN: no asking price" (live check). n/a for NO. | Its sentence merges into StatStrip + FundGap summary. |
| Comparables | `Comparables.tsx` | `data/comparables.json` | U: Santa Ana UNKNOWN (keep wording). | Compact mode for the site page. |
| CityMap | `CityMap.tsx` | `data/citywide.json` points [x, y, code] | L: reserve aspect box. | Replaced by `CityCloud` (same data), kept as fallback until CityCloud is proven. |
| CandidateList | `CandidateList.tsx` | citywide candidates | E: "No lots match" + Reset. | Add sort; link to `/check?address=`. |
| LiveCheck | `LiveCheck.tsx` | POST `/api/check` | L: "Checking city, FEMA and fire servers…" (8 s timeout each). Err: whole request failed: plain message + "try the precomputed site" link. U: per-check timeouts become UNKNOWN rows with the reason (exists). No match: "No Santa Ana parcel matched; check the spelling or try the APN". | Show a result heading with the matched address and APN; reuse VerdictHeader + StatStrip for the result. |
| PrintButton | `PrintButton.tsx` | none | none | Restyle only. |
| **NavBar** (new) | `src/components/NavBar.tsx` | route | active item | 4 items + CheckButton; phone sheet. |
| **StatStrip** (new) | `StatStrip.tsx` | array of {label, value, note?, href?, tag?: "ASSUMPTION"} | U: value "UNKNOWN" in UNKNOWN role, never blank. | Used on home, site, city, comparables. |
| **VerdictHeader** (new) | `VerdictHeader.tsx` | address, parcel, listed_lot_sqft, listing_source_url, date_collected, verdict, verdict_reason, failing checks, listing_evidence flags | LIKELY YES / NO (with failing test + source) / UNKNOWN (with PF and who confirms). No parcel match. | |
| **NextCallCard** (new) | `NextCallCard.tsx` | same mapping as CallSheet | E: "No open questions" (unlikely: 6 checks are always UNKNOWN in the MVP). | First 2 questions, grouped by contact, Copy email. |
| **SectionNav** (new) | `SectionNav.tsx` | section ids | active section on scroll | Anchors must be stable for demo deep links. |
| **StatusChip** (new) | `StatusChip.tsx` | status string | PASS, FAIL, UNKNOWN, POSSIBLE FAIL, LIKELY YES, NO | Always text + color, never color alone. |
| **CityCloud** (new) | `CityCloud.tsx` | compact point file (section 7), listing positions from parcel rings | L: reserved box, static first paint. Err (data fails): fall back to a static image or the text stat strip. Reduced motion: static. | Home hero and `/city` map. |
| **LotParticles** (new) | `LotParticles.tsx` | parcel.rings, split, buildings, max_homes, asking_price | NO / 2-home / 4-home / no parcel. Reduced motion: final frame. | Site page hero visual. |
| **ExportMenu** (new) | `ExportMenu.tsx` | static links | none | `/brief`, `/results.csv`, `/city.csv`. |
| **SiteCards** (new) | `SiteCards.tsx` | same as SiteTable | same as SiteTable | Phone list. |
| **AssumptionTag** (new, tiny) | inside StatStrip or `Tag.tsx` | none | none | Outlined mono "ASSUMPTION", not a status color. |

---

## 6. Design-system hooks (token sheet)

Source column: **REF** = observed in the Norrvik frames (f00, f02, f04, f06). **OPEN** = not specified by the reference, needs John's call or a placeholder. Note: frames f08 and f11 in the same recording are a different site (a "Made in Modulify" space-zoom demo with a serif caption and warm gold glow). I did not take anything from them. **OPEN** whether John wants any of that.

### Color roles

| Token | Role | Source | Observation / note |
|---|---|---|---|
| `--bg` | Page background | REF | Near-black canvas behind everything. Exact value OPEN (sample from the video). |
| `--surface` | Cards, menus, sticky nav | OPEN | Reference shows almost no filled panels; content floats on black with hairline boxes. Proposal: a barely lifted black, or none (hairline only). |
| `--text` | Primary text | REF | White headline and nav text. |
| `--text-muted` | Secondary text | REF | Gray second headline line ("for every building."), gray mono metadata. |
| `--hairline` | Borders, dividers, stat strip cells | REF | Thin gray lines around nav buttons ("CONTACT") and between bottom stat cells. |
| `--accent` | One accent: primary button arrow block, links, selected item, candidate glow | REF | Blue arrow block on the off-white button; pale blue glow in the point cloud (f02, f04). Exact hue OPEN. |
| `--button-fill` | Primary button body | REF | Off-white / cream fill with dark mono label. |
| `--button-text` | Text on the off-white button | REF | Dark. |
| `--point` | Default particle | REF | White particles, varying opacity. |
| `--point-dim` | Non-candidate parcels | OPEN | Proposal: `--point` at low opacity. |
| `--point-highlight` | Candidate parcels, selected site | REF (as accent) | Reference highlights in pale blue. Map to `--accent`. |
| `--status-pass` | PASS, LIKELY YES | OPEN | Not in reference. Must pass AA on `--bg`. |
| `--status-fail` | FAIL, NO | OPEN | Not in reference. AA on `--bg`. |
| `--status-unknown` | UNKNOWN, possible FAIL, historic-district dots | OPEN | One color for UNKNOWN everywhere (fixes friction #6). Must differ from pass and fail by more than hue. |
| `--tag-assumption` | ASSUMPTION tag | OPEN | Proposal: outline in `--text-muted`, mono uppercase. Not a status color. |
| `--focus` | Focus ring | OPEN | Proposal: `--accent`, 2 px, offset 2 px. |

**Status accessibility rules on black**
- Status text and chip labels at body sizes need 4.5:1 against `--bg` (or against the chip fill if chips are filled). Large text (24 px+, or 18.66 px bold) needs 3:1. Hairline borders and particle markers that carry meaning need 3:1 (non-text contrast).
- Never status by color alone: every chip says PASS / FAIL / UNKNOWN / POSSIBLE FAIL in words. On the map, status differs by color and by size or shape (listings larger, district parcels a different marker).
- Check pass vs fail for red-green color blindness: they must also differ in lightness. Verify with a simulator before merging.
- The accent and `--status-pass` must not be confusable, because "candidate" (a first screen) is not "PASS" (a verdict).
- Print pages (`print.css`, `/brief`, `/site/[id]/brief`) stay light theme. Do not inherit the dark tokens.

### Type roles

| Token | Use | Source | Observation |
|---|---|---|---|
| `--font-display` | Headline, site address | OPEN family | REF look: clean neo-grotesk sans, medium weight, tight tracking, two-tone (white line + gray line). |
| `--font-heading` | Section titles | OPEN family | Same family as display, smaller. |
| `--font-body` | Paragraphs, table cells | OPEN family | REF look: same sans, regular, light gray on black. |
| `--font-mono-label` | Nav, kickers, stat labels, captions, tags | OPEN family | REF look: monospace, uppercase, wide letter-spacing, small size, gray or white; some kickers tinted blue (f00 "(01) CAPTURE / PROJECT / LIVE LIDAR"). |
| `--font-numeric` | Stat values, prices, sq ft | OPEN family | REF look: stat values in the bottom strip are monospace. Use tabular figures whatever the family, so numbers do not shift. |

Sizes: OPEN. Keep body at 16 px minimum on phone; mono labels no smaller than 11 px and must still meet contrast.

### Spacing, radius, motion

| Token | Value | Source |
|---|---|---|
| `--space-1..7` | 4, 8, 12, 16, 24, 32, 48 px (placeholder scale) | OPEN |
| Page gutter | 16 px phone, 32 px desktop (placeholder) | OPEN |
| `--radius` | REF look: square or nearly square corners on buttons and boxes. Proposal 0 to 2 px. | REF (look), value OPEN |
| `--dur-fast` | 150 ms (hover, focus) | OPEN |
| `--dur-base` | 300 ms (accordion, menu) | OPEN |
| `--dur-slow` | 600 ms (particle settle) | OPEN |
| `--ease-out` | standard ease-out curve, value OPEN | OPEN |

### Particle parameters

| Param | Proposal | Source |
|---|---|---|
| `--cloud-count` | 57,926 (one per parcel, from `data/citywide.json`; the count is the data, do not sample it down for the hero unless the budget fails) | Data |
| `--point-size` | 1 to 1.6 CSS px scaled to canvas width (today's CityMap uses 0.6 to 1.6) | Existing code |
| `--point-opacity` | dim 0.25, candidate 0.9, listing 1.0 (placeholders) | OPEN |
| `--drift` | 0 by default. If any, under 0.5 px amplitude, slower than 1 cycle per 8 s. | OPEN; John asked for less than the reference |
| `--highlight-role` | `--accent` | REF |
| Listing marker | 3x point size + mono label on hover/focus | OPEN |

### Reduced motion

`@media (prefers-reduced-motion: reduce)`: no particle animation, no split sequence, no count-ups; draw the final frame once. Accordions open without height animation. Also honor `?motion=0` in the URL for the projector (section 8).

---

## 7. Motion and particle spec

Principle: **particles are data.** Every point is a real parcel or a real lot edge. Nothing decorative moves.

### Home hero: Santa Ana point cloud

- Top-down, north up (State Plane, as the current city map). No 3D, no orbit, no tilt.
- First paint: static, all 57,926 points drawn at final positions in the dim role. No loading spinner.
- Beat 1 (0 to 600 ms after first paint, once per session): the 25,246 candidates brighten to the accent in a single sweep (north to south, or by distance from the first listing, **OPEN**). Text in the stat strip does not animate.
- Beat 2 (600 to 900 ms): the 10 listings appear as larger points; LIKELY YES ones in the accent at full opacity, others in their status role.
- Idle: nothing moves. Optional idle drift is off by default.
- Interaction: hovering or focusing a table row highlights its point and shows a mono label (address, verdict). Hovering a listing point highlights its row. Click a listing point opens its site page.
- Listing positions: from each site's `parcel.rings` (State Plane feet, same frame as `citywide.json` bbox), take the centroid and convert to the same 10 ft grid.

### Site page: lot split sequence (plays once on load, replay button)

| Beat | Time | What moves | Data |
|---|---|---|---|
| 1 | 0 to 400 ms | Particles settle onto the real parcel outline | `parcel.rings` |
| 2 | 400 to 700 ms | Existing building footprint fills in muted | `buildings` |
| 3 | 700 to 1,200 ms | Split line draws along the sketched split | `split.lot_a`, `split.lot_b` |
| 4 | 1,200 to 1,500 ms | The two lots separate by a few px | same |
| 5 | 1,500 to 2,100 ms | Home markers appear, 2 per lot, 80 ms stagger | `max_homes` |
| 6 | 2,100 to 2,700 ms | Stat strip per-home value resolves: "$865,000 ÷ 4" then "$216,250". Text swap, no rolling counter, final number exact. | `asking_price`, `land_cost_per_home` |

Total under 3 s. Variants: NO sites stop after beat 2 (no split, no homes; the header already says why). Lot-size-only fail (2 homes): beats 1, 2, 5 with 2 markers, no split. Keep-the-house sites: beat 2 footprint stays on one lot, 3 new markers (match the README rule; confirm against `keep_house` before building, **OPEN**).

### Checklist reveal

Rows are present at first paint (no layout shift). At most a 150 ms opacity fade per row, 30 ms stagger, only the first time the section scrolls into view. Off under reduced motion. Status chips never animate color.

### What NOT to do (the reference's excess)

- No drone icon, no scan beam band, no dotted flight paths.
- No YAW / PITCH / SCAN counters or fake telemetry. Corner metadata only if it is real (for example "FIG. 01 / SANTA ANA / 57,926 PARCELS / CHECKED 2026-11-07").
- No left-edge ruler with tick numbers.
- No drag-to-orbit, no 3D camera, no scroll-jacked zoom.
- No crosshair cursor, no custom cursor.
- No glowing blobs or "thermal" clouds that are not data.
- No serif captions, no gold glow, no nebula or space backgrounds (from the second site in the recording).
- No count-up animation on money, no looping motion behind text.

### Performance budget

- Hero data: do not ship the 2.8 MB `citywide.json` to the home page. Precompute a compact file in `public/` (for example quantized x, y, code) that loads as one static request. Target under 400 KB over the wire. Exact format **OPEN** for the builder.
- Rendering: draw the dim layer once to an offscreen canvas; animate only the highlight layer. Canvas 2D is enough for 58k points drawn once; use WebGL only if the sweep cannot hold frame rate.
- Target 60 fps on a mid laptop during the 900 ms intro. If 10 consecutive frames exceed 20 ms, jump to the final frame.
- Fallback to the static final frame when: `prefers-reduced-motion`, `?motion=0`, `navigator.hardwareConcurrency <= 4` or `saveData` (thresholds **OPEN**), canvas unsupported, or data fails to load (then show the stat strip only).
- Reserve the canvas box with CSS `aspect-ratio` from the bbox so nothing shifts.

---

## 8. Demo mode notes

- **Stable deep links** (the pitch kit tabs): `/`, `/site/sa-04`, `/site/sa-01#checklist`, `/site/sa-06`, `/check?address=1209%20S%20Townsend%20St` (and keep `/?address=...#live` working), `/city`, `/comparables`. Section ids are fixed: `#checklist`, `#nonprofit`, `#calls`, `#fund`, `#nearby`, `#sources`.
- **sa-01** must show the FEMA flood FAIL in the first screen once the VerdictHeader ships; then the pitch can drop the pre-scroll.
- **Motion switch**: `?motion=0` renders final frames everywhere. Use it if the projector stutters. Default for the live demo: motion on, plays once.
- **Keyboard-safe**: no single-key shortcuts; Tab reaches nav, Check button, Export, rows, section nav in order; visible focus ring; Enter on a focused row opens the site; Esc closes menus and sheets.
- **No layout shift**: reserved canvas boxes, tabular numbers, font fallback with matching metrics (or system font until the family is chosen), no content injected above the fold after load.
- **Zoom**: test at 125% and 150% (the pitch kit zooms the browser). The first screen of `/` and `/site/sa-04` must still show the verdict and per-home number.
- **Offline-tolerant**: all pages are precomputed from `data/*.json`; the hero point file is static in `public/`. Only `/api/check` needs government servers (8 s timeout each, UNKNOWN on failure). Pre-load every demo tab before walking up.
- **Numbers on screen come from data**, never hard-coded in copy (the 5 vs 4 LIKELY YES drift shows why).
- After the merge, re-take the screenshots and video shots listed in `PITCH-KIT.md` section 2.

---

## 9. Build order for the remaining time (about 12:20 to 2:15 PM)

Rules: work on a branch (`ux-polish`). `main` stays deployable the whole time. Merge only after `npm run build` passes and the deep links above load on a Vercel preview. Feature freeze 2:05 PM, production deploy by 2:15 PM, submit by 2:25 PM.

### Must (about 100 min)

| # | Task | Min |
|---|---|---|
| 1 | Tokens in `globals.css` (dark roles as placeholders, OPEN values marked in comments); unify status classes (fix amber triple meaning); keep `print.css` light | 15 |
| 2 | Shell: NavBar with 4 items + Check button; `/check` page wrapping LiveCheck; footer kept | 15 |
| 3 | Site page first screen: VerdictHeader (failing test on line one), StatStrip (reuse the brief's Key numbers logic), larger LotSvg, NextCallCard; move FundGap below checklist, collapsed; section ids | 35 |
| 4 | Home: hero copy + StatStrip + list in first screen; FilterPanel toggle; ExportMenu; phone SiteCards | 25 |
| 5 | Static CityCloud on home (draw once, candidates in accent, 10 listings marked), using a compact point file | 10 (if over, ship stat strip without the cloud) |

### Should (if must is done by about 1:40)

| Task | Min |
|---|---|
| LotParticles split sequence (beats 1 to 6), reduced motion + `?motion=0` | 25 |
| Hero intro sweep (beats 1 and 2) | 10 |
| `/city`: CityCloud with listings marked and linked; candidate sort; links to `/check` | 15 |
| Checklist row-detail accordion; listing evidence inside tenant row | 15 |
| `/method` page from README sections (or link to the README on GitHub) | 15 |
| `/comparables` all-projects table collapsed on phone | 5 |

### Skip today

3D or WebGL point clouds, orbit or drag, scroll-driven zoom, any decorative particle not tied to a parcel, custom fonts (until John picks families), sound, a new data source, changes to ranking or verdict logic, PITCH-KIT edits by the UX branch (owners update it after merge).

### Open questions for John

1. Font families for display, body and mono (reference looks: neo-grotesk sans, wide-tracked uppercase mono).
2. Exact accent blue and status colors (must pass AA on black).
3. Keep the live check inline on home as well as `/check`, or only `/check`?
4. Phone hero: cloud as a short band above the list, or below the stat strip?
5. Anything wanted from the second reference in the recording (space zoom, serif, gold), or ignore it?
6. `/brief` top open question: lead with the listing-agent question instead of the historic one?
7. The repeated-APN rows on `/city` (for example 1001 GRAHAM LN, 109-062-33 three times): data issue to note in the README?

Prototype. Not legal or financial advice. Confirm with the city and a professional.
