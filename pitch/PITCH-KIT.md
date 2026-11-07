# FourFold pitch kit

For John and Jerry. Claude Impact Lab, UCI x SoCal Affordable Housing, Nov 7, 2026.
Submissions close 2:30 PM (demo video, ideally 30 seconds, at most 2 minutes). Finalists present live at 3:00 PM.

Live app: https://fourfold-splitter.vercel.app (one screen; it may show the older multi-page design until the new build ships, so check before recording).
Every number here traces to a file in `data/` (see section 4). If the data is recomputed, recheck this file.

---

## 1. The app in one screen (what you click)

- **Left panel, three tabs:** **Sites** (the 10 listings, ranked), **Groups** (viable listings close together), **City** (every lot in Santa Ana).
- **Right stage, three views** (switch top right): **3D** particles by default (the city's 57,926 parcels; select a site and its lot assembles, splits, and homes rise; **Replay** reruns it), **Map** (dot-matrix with № tags), **Technical** (blueprint with dimensions and the 4 ft SB 9 side/rear setback line).
- **Site card:** verdict next to the address, Homes, Per home (counts down from the asking price), Asking, Investor / home, the next call, and buttons that open windows: **Checklist**, **Call sheet**, **Fund the gap**, **Local support**, **Briefing PDF**.
- **Bottom:** **Check an address** (live check) and **More** (Project outcomes, OC SB 9 projects, How it works, Call list PDF, CSV, Your organization).
- **Deep links:** `/app?site=sa-10` (2121 Valencia), `/app?site=sa-04` (1209 S Townsend), `/app?site=sa-06` (1213 S Corta), `/app?tab=groups`, `/app?tab=city`, `/app?site=sa-10&window=fund` (Fund the gap open on Valencia), `/app?site=sa-06&window=checklist`.

**One-liner (John's):**
> Investors can't split a lot under SB 9 unless they live there for 3 years. Nonprofits and community land trusts are exempt. FourFold finds the houses for sale where a nonprofit can turn one home into four.

Source: HCD SB 9 fact sheet, April 2026, p.2 (linked on screen in the Sites tab and in the README).

**For the form (who + what, one sentence):**
> For a one-person acquisitions lead at a small housing nonprofit: FourFold finds Santa Ana houses for sale where a nonprofit could use SB 9 to turn one home into four, and shows why, with sources.

---

## 2. Demo video, 30 seconds (primary)

Claude wrote this script and built the app the video shows. You can say that in the form.

Setup: browser at 125% zoom, full screen, bookmarks bar hidden, start at https://fourfold-splitter.vercel.app on the Sites tab, 3D view. About 75 words.

| Time | Click / screen | Voiceover |
|---|---|---|
| 0:00-0:05 | Home, Sites tab. 3D particle city on the right. No clicks. | "Investors can't split a lot under SB 9 unless they live there three years. Nonprofits can." |
| 0:05-0:09 | Hover down the ranked list, then click **2121 Valencia St** (№4). | "FourFold checks real Santa Ana listings against city, FEMA and fire data." |
| 0:09-0:17 | Hold on the stage: lot assembles, splits, homes rise. Per home counts down from $949,000 to $237,250. | "This one splits in two. Keep the house, build three more. About two thirty-seven per home, before construction." |
| 0:17-0:23 | Click **Technical** (top right), hold 2 sec. Then click **Checklist**, hold on the rows with sources. Close it. | "Every test has its source and date. What we can't check says unknown, and who to call." |
| 0:23-0:30 | Click the **City** tab. Hold on 25,246. | "And it screens every lot in the city. Twenty-five thousand pass a first screen. One house, four homes." |

If the stage animation lags on the recording machine, click **Replay** once before you start the take.

### How to record

- **Mac:** Cmd+Shift+5, "Record Selected Portion", box the browser, Record. Stop from the menu bar. MOV uploads fine.
- **QuickTime:** File > New Screen Recording, Options > pick the mic to talk while recording.
- Easiest: record the screen silent, then lay the voiceover on top in iMovie or CapCut. Two takes max.
- If upload fails, post to YouTube as Unlisted and test the link in a private window.

---

## 3. Live demo, 2:00 (auditorium)

### Pre-open (in this order)

1. https://fourfold-splitter.vercel.app (Sites tab, nothing selected, 3D view)
2. https://fourfold-splitter.vercel.app/app?site=sa-10 (2121 Valencia)
3. https://fourfold-splitter.vercel.app/app?site=sa-10&window=fund (Fund the gap open)
4. https://fourfold-splitter.vercel.app/app?site=sa-06&window=checklist (1213 S Corta, tenant row)
5. https://fourfold-splitter.vercel.app/app?tab=groups
6. https://fourfold-splitter.vercel.app/app?tab=city
7. The demo video file, paused on frame 1

Zoom 125 to 150%. Focus mode on. Charger in. Hotspot ready.

### Script (timings sum to 2:00)

**0:00-0:15 · John · Tab 1, 3D particles**
"We're FourFold. Under SB 9, an investor can't split a single-family lot unless they promise to live there three years. Nonprofits and land trusts are exempt. So on any house for sale, a nonprofit has an edge. FourFold finds those houses."

**0:15-0:30 · Jerry · Tab 1, the ranked list**
"Our user is a one-person acquisitions lead at a small nonprofit, no GIS team. I pulled ten real Santa Ana listings this morning. FourFold ran every check on each one and ranked them. Four likely yes, two need a call, four no."

**0:30-0:55 · John · click 2121 Valencia St (or Tab 2)**
"2121 Valencia. That's the real parcel from the city. Watch it split. The existing house fits on one half, so you keep it and build three. $949,000 asking, so about $237,000 per home before construction. An investor without the live-in promise gets two homes, so double that."
Click **Technical**. "Same lot as a blueprint: real dimensions, and the 4 foot setback SB 9 allows at most."
Alternative if Valencia misbehaves: **1209 S Townsend St** (№1), $865,000 asking, $216,250 per home. It does not keep the house.

**0:55-1:10 · Jerry · click Fund the gap (or Tab 3)**
"Does it pencil? The purchase price is real. Construction, fees and subsidies the nonprofit types in. The brief's example numbers are one click, and labelled assumption. It shows the gap and what a donation would cover."

**1:10-1:25 · John · Tab 4, 1213 S Corta checklist, tenant row**
"Where does Claude come in? Claude only reads the listing text. Here it caught 'do not disturb tenants'. Code checks the quote is really in the listing. Claude can flag a problem. It can never make a test pass. Code decides, Claude reads."

**1:25-1:40 · Jerry · Groups tab (or Tab 5), click Group A**
"Small nonprofits do better buying close together: one crew, one city process. Group A is 927 South Laurel and 617 South Corwin, eight homes within a quarter mile. One of them needs a zoning call first."

**1:40-1:50 · John · City tab (or Tab 6)**
"And it's not ten houses. We screened all 57,926 parcels in Santa Ana. 25,246 pass flood, fire and historic on a first screen. That's the pipeline for the next hundred projects."

**1:50-2:00 · John · stay on City**
"Local support pulls the city's housing element and RHNA progress, with sources. And every real project a nonprofit records teaches it: today that's zero records, and we say so. FourFold. One house, four homes."

### Backup plan

- **Everything on the one screen is precomputed** from `data/results.json`, `data/citywide.json` and `data/support/santa-ana.json`. It loads once the page loads at all.
- **Only Check an address calls government servers live.** If you use it, type `1209 S Townsend St`. If it spins past 5 seconds: "every outside call has an 8 second timeout, and a failed one shows UNKNOWN with the reason." If it fails outright, go to Tab 2.
- **If a click doesn't land,** jump to the matching pre-opened tab (the deep links above). Don't hunt.
- **If the 3D stage is slow or blank** on the venue machine, click **Map** or **Technical**; both are lighter. The numbers on the left don't depend on the stage.
- **If the new design hasn't deployed,** the old site has `/site/sa-10`, `/clusters`, `/city`. Say the same lines.
- **If Wi-Fi is down:** hotspot first. Then the video. Say plainly: "The Wi-Fi is down. Here is the recording of the live app."

### Who says what

- **John:** opener, the site and blueprint, Claude's role, the city screen, the close.
- **Jerry:** the user and the listings he collected, Fund the gap, Groups.
- Judge Q&A: John takes legal, Claude and scale. Jerry takes listings, data and money.

---

## 4. The four judging areas

Equal weight. Ties go to Impact, so lead with it.

| Area | One line | On-screen proof |
|---|---|---|
| **Impact** | A nonprofit acquisitions lead gets a ranked list of houses for sale this month, why each one, and the next call to make. | Sites list, the next call on each site card, Call sheet window |
| **Works** | Real listings, real city parcels, FEMA and county fire layers, every test with its source and date; unknowns say UNKNOWN. | Checklist window, Technical view, Check an address |
| **Scale** | Three cities already: the same pipeline screens 162,193 parcels in Santa Ana, Anaheim and Fullerton; adding a city means plugging in its parcel and zoning map. Off-market targets and clusters turn it from "what's for sale" into "where to send offers". | City tab switcher, Off-market list, Groups |
| **Innovation** | Start from ordinary houses for sale and a legal edge only nonprofits have; code decides, Claude only reads listing text and can only flag. | Lot splitting in 3D, 1213 S Corta tenant row |

---

## 5. Numbers block (every number traced)

| Number | What it is | File |
|---|---|---|
| 10 listings: 4 LIKELY YES, 2 UNKNOWN, 4 NO | Santa Ana listings Jerry collected 2026-11-07 | `data/results.json` (`verdict`) |
| LIKELY YES: sa-04 1209 S Townsend, sa-05 927 S Laurel, sa-08 1217 S Huron, sa-10 2121 Valencia | | `data/results.json` |
| UNKNOWN: sa-02 617 S Corwin (A1 zone, possible fail), sa-06 1213 S Corta (tenant flag) | | `data/results.json` (`verdict_reason`) |
| 2121 Valencia: $949,000 asking, 4 homes, $237,250 per home, keeps the house (`fits_b`), lot about 7,433 sq ft | | `data/results.json` (sa-10) |
| 1209 S Townsend: $865,000 asking, 4 homes, $216,250 per home, house straddles the split | | `data/results.json` (sa-04) |
| Investor per home on a 4-home site = asking ÷ 2 (Valencia $474,500; Townsend $432,500) | computed on screen, real asking prices | `data/results.json`, `FourFoldApp.tsx` |
| LIKELY YES per home range: $216,250 to $237,250 | | `data/results.json` |
| $360k per home | **ASSUMPTION**: the brief's mock worked example, not a real deal | `docs/background.md` |
| "DO NOT DISTURB TENANTS." | Claude's quote on 1213 S Corta, verified in the text, model claude-sonnet-5-5 | `data/results.json` (sa-06 `listing_evidence`, tenant check) |
| 12 tests per site; 6 UNKNOWN on every site (617 S Corwin has 7) | | `data/results.json` (`checks`, `unknown_count`) |
| Group A: 927 S Laurel + 617 S Corwin, 8 homes within 0.24 mi, about $214,222 per home, 945 first-screen lots nearby | at the default 0.5 mi radius (**ASSUMPTION**: one-crew radius) | `src/lib/clusters.ts` on `data/results.json` + `data/citywide.json` |
| At 1 mi, 1217 S Huron joins Group A: 12 homes within 0.61 mi | | same |
| 57,926 parcels; 30,590 single-family zone; 30,352 big enough to split; 25,246 pass flood, fire, historic; +347 in a historic district | first screen on parcel centroids, not a verdict | `data/citywide.json` (`counts`) |
| 68 OC projects labelled SB 9 or lot split, 55 in Garden Grove; median 9.3 months permit to completion (15 projects with both dates); Santa Ana UNKNOWN, not zero | HCD APR Tables A and A2 | `data/comparables.json`, README |
| Santa Ana support: housing element in compliance (POSITIVE); RHNA very low income 359 of 606, moderate 260 of 545 (NEUTRAL, ASSUMPTION); pre-approved ADU plans (POSITIVE, ASSUMPTION mild); SB 9 APR activity, HCD letters, city SB 9 rules all UNKNOWN | checked 2026-11-07 | `data/support/santa-ana.json` |
| 0 real project outcomes | learning turns on as records are added | `data/outcomes/README.md` |
| Anaheim 68,442 parcels, 36,051 pass the first screen; Fullerton 35,825, 18,509 pass (+230 possible historic) | first screen, not a verdict; Fullerton layers not confirmed official | `data/citywide-anaheim.json`, `data/citywide-fullerton.json` |
| 162,193 parcels screened across 3 cities (57,926 + 68,442 + 35,825) | sum of the three files | same three citywide files |
| 17 leads: 15 LIKELY YES, 1 UNKNOWN (529 W Whiting, preservation zone), 1 NO (2518 Greenwich Dr, very high fire) | prices and listing status unverified | `data/leads-results.json` |
| 25 off-market targets per city; densest 0.25 mi clusters: Santa Ana 225, Anaheim 208, Fullerton 220 candidate lots | not for sale, owners not contacted | `data/proactive-targets.json`, `data/offmarket-groups.json` |

Don't quote: "an afternoon per listing" as measured (it's the team's description of the manual process; say "today it means opening four maps and reading the law"). Don't quote a live check speed as guaranteed.

---

## 6. Likely judge questions

**Is this legal advice?**
No. It's a prototype that screens on public data. The screen says confirm with the city and a professional. We say "likely yes", not "eligible".

**How accurate is it?**
Only as good as the public layers. Known gaps, all in the README: lot area comes from the city polygon and can differ from the listing (4202 W Fay Cir: listing 10,001 sq ft, city about 8,682). A parcel that barely touches a flood zone counts as a FAIL. The fire map may predate CAL FIRE's 2025 maps. The 40% split minimum is from statute but not verified against the text today. A FAIL doesn't account for statutory exceptions. The city screen tests each parcel's center point only.

**What if the listing is wrong?**
Eligibility never comes from the listing. Lot size, zoning and hazards come from government data. The listing only feeds the asking price and Claude's tenant clues.

**Why do nonprofits win here?**
SB 9 requires an owner to sign an affidavit to live there 3 years before a lot split. Nonprofits and community land trusts are exempt (HCD SB 9 fact sheet, April 2026, p.2).

**Does a nonprofit have the money to buy at $900k?**
We don't know. Fund the gap lets them type their own budget, construction, fees and subsidies against the real purchase price, and shows the gap. The brief's numbers are optional one-click examples, labelled ASSUMPTION. New construction has no default because we have no sourced number.

**What about construction cost?**
Not included in per home, and the screen says "before construction". The brief's $40k is repairs to one existing home, not new units, so we don't use it as a default.

**What is "keep the house"?**
The county's building footprints are on the lot. Code slides the split line to see if the existing house can sit wholly on one lot with both lots still legal. On 2121 Valencia it fits, so build 3 instead of demolishing. On the other likely yeses it straddles the line.

**What does the 4 ft line on the blueprint mean?**
SB 9 lets a city require at most 4 ft side and rear setbacks (HCD SB 9 Fact Sheet, Sept 2024, p.4). Front setback is a city rule and isn't drawn.

**Why groups?**
One acquisitions push, one city process, one contractor. The 0.5 mi radius is our ASSUMPTION, not a rule.

**What is local support?**
Public signals about the city: housing element compliance, RHNA progress, pre-approved ADU plans, all with sources. Three signals are UNKNOWN (SB 9 activity in state reports, HCD letters, the city's SB 9 rules) and say so. It describes the city, not whether your organization has support.

**What does it learn?**
When a nonprofit records a real project outcome (what FourFold got right or wrong, dates, actual costs), the next rebuild uses it: calibration per check, city-confirmed rule notes, timelines, real costs in place of the brief's assumptions, and better call-sheet questions. It never overturns a hard FAIL. Today there are 0 real records, so it runs on public data and the brief only.

**How do you scale beyond Santa Ana?**
Every check is a public ArcGIS service. Per city: its parcel and zoning layers and its single-family zone codes, about an hour each (README estimate). Anaheim and Fullerton are next. Then a listing feed instead of hand collection.

**Why not just use Zillow?**
Zillow tells you it's for sale. Not the zoning, whether it splits into two legal lots, flood or fire exclusions, or that a nonprofit is exempt from the live-in rule.

**What does Claude actually do?**
Claude Code built the app, encoded the rules from the HCD fact sheets, and checked Jerry's listings against the city parcel layer. Inside the app, Claude (claude-sonnet-5-5) only reads the listing description for tenant or vacancy clues and returns an exact quote. Code checks the quote is really there. Claude can make a test "possible fail". It can never make one pass.

**What's mocked?**
The $360k comparison and the fund calculator examples (ASSUMPTION, from the brief). The split line is a sketch, not a survey. Santa Ana being an urbanized area and RE counting as single-family are assumptions. The 0.5 mi group radius is an assumption. Six tests are always UNKNOWN. Listings were collected by hand this morning, and six of ten descriptions are Jerry's summaries, not verbatim text. Learning has 0 real records.

**Why is 617 S Corwin Ct UNKNOWN but cheapest per home?**
It's zoned A1, General Agricultural. HCD says agricultural zones aren't SB 9 zones, but this one holds a house. Possible fail, ask the city. That's why it ranks below the likely yeses.

---

## 7. Pre-flight and words

### Before 2:30 PM

Submission form at https://claudesocal.com/uci-impact-lab (#submit).

- [ ] Email, Lane 1 Find it, one-liner from section 1
- [ ] Real user, before and after (README "The real user")
- [ ] What it does (README "The app in one screen" and "What we built")
- [ ] Sources and assumptions: README table, with $360k, RE zone, urbanized area, split line and group radius marked ASSUMPTION
- [ ] Public repo URL (main page), checked signed out
- [ ] Video uploaded or unlisted link tested signed out
- [ ] Live demo URL loads the new one-screen design
- [ ] Everything pushed by 2:30; no API key in the repo or its history

### Words to avoid

| Avoid | Say |
|---|---|
| eligible, qualifies, approved | likely yes, passes the checks we can run |
| guaranteed, definitely | on public data, as far as the data shows |
| legal, legally allowed | SB 9 screen, confirm with the city |
| cost per home | purchase per home, before construction |
| 25,246 eligible lots | 25,246 pass a first screen |
| AI decides | code decides, Claude reads the listing |
| all of Orange County | Santa Ana today |
| survey, lot line | a sketched split, not a survey |
| it learns from projects (alone) | it learns as real projects are recorded; zero so far |

No "revolutionary" or "game-changing". Say what it does and point at the screen.

---

## UI notes found while reading the code (for the build team, not for the pitch)

Checked against `src/components/app/FourFoldApp.tsx` on the `dashboard` branch, about 12:30 PM. No code was changed.

1. **Group per-home can show decimals.** `money()` calls `toLocaleString` on `avgPerHome` without rounding; Group A's average is 214,222.125, so the card may read "$214,222.125". Rounding it would fix it.
2. **The Claude quote only shows inside the Checklist window** (tenant row) on 1213 S Corta. The site card shows "listing suggests a tenant" but not the quote. Open the Checklist on stage.
3. **Recommended badge** only shows for LIKELY YES with STRONG or SOME local support; check it appears on Valencia before relying on it.
4. Fixed from the old site: verdict now sits next to the address; NO sites show per home "n/a".
