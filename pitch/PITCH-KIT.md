# FourFold pitch kit

For John and Jerry. Claude Impact Lab, UCI x SoCal Affordable Housing, Nov 7, 2026.
Submissions close 2:30 PM. Finalists present live at 3:00 PM.

Live app: https://fourfold-splitter.vercel.app
Every number here comes from `data/results.json` (checks run 2026-11-07 19:00 UTC), the README, or the live site. If the data is recomputed, recheck the numbers in this file.

---

## 1. One-liner and 3 key numbers

**One-liner (John's):**
> Investors can't split a lot under SB 9 unless they live there for 3 years. Nonprofits and community land trusts are exempt. FourFold finds the houses for sale where a nonprofit can turn one home into four.

Source for the exemption: HCD SB 9 fact sheet, April 2026, p.2 (cited on the home page and in the README).

**For the form (who + what, one sentence):**
> For a one-person acquisitions lead at a small housing nonprofit: FourFold finds Santa Ana houses for sale where a nonprofit could use SB 9 to turn one home into four, and shows why, with sources.

**Number 1: 10 real listings checked, 5 likely yes.**
10 public Santa Ana listings Jerry collected on 2026-11-07. Results today: 5 LIKELY YES, 1 UNKNOWN, 4 NO. (`data/results.json`, `verdict` field.)
Heads up: 1213 S Corta Dr (sa-06) is LIKELY YES only because the Claude listing reader is off. Its listing says "DO NOT DISTURB TENANTS." Once the key is in, it should drop, which makes it **4 likely yes**. Check the home page before you say the number out loud.

**Number 2: $216,250 per home vs $360k.**
1209 S Townsend St (sa-04): $865,000 asking / 4 homes = $216,250 land and building purchase per home, before construction. That is $143,750 below the brief's $360k worked example. The $360k is an **ASSUMPTION**: mock numbers from `docs/background.md`, not a real deal. Asking price is not sale price. Construction, fees and time costs are not included.
All five LIKELY YES sites land between $216,250 and $237,250 per home.

**Number 3: 12 tests per listing, each with a source and a date. About 1 second for a live check.**
Each site gets 12 tests (parcel, zoning, lot split, flood, fire, historic, tenant, rent restriction, prior split, fault, environment, landslide). 6 of them are honestly UNKNOWN on every site, with a next step for each. The live check returned in 0.4 to 1.1 seconds in our tests at about 11:05 AM (5 calls). That speed is not guaranteed; FEMA can be slow and each external call has an 8 second timeout.

Do not quote "an afternoon per listing" as a measured number. It is the team's description of the manual process in the README. Say "today it means opening four maps and reading the law" instead.

---

## 2. Demo video scripts

The submission says the video should be made with Claude's help. Claude wrote this script and built the app the video shows. You can say that in the form.

### How to record

- **Mac:** Cmd+Shift+5, pick "Record Selected Portion", drag a box around the browser window, click Record. Stop from the menu bar icon. File lands on the Desktop as .mov. That format uploads fine (MP4 or MOV, up to 2 min, 500 MB).
- **QuickTime:** File > New Screen Recording does the same thing. Use it if you want to record voice at the same time (Options > pick the mic).
- **iPad (Jerry):** Control Center > Screen Recording button. Long-press it to turn the mic on. Video goes to Photos. AirDrop it to John.
- Easiest flow: record the screen silent, then record the voiceover separately and lay it on top in iMovie or CapCut. Or just talk while recording. Two takes max; it does not have to be perfect.
- Browser setup before recording: zoom to 125% (Cmd +) so text reads on a phone, close other tabs, hide bookmarks bar (Cmd+Shift+B), full screen the window.
- If upload fails, post to YouTube as Unlisted and paste the link. Test the link in a private window.

### 30-second version (primary)

About 75 words of voiceover. Read it at a normal pace.

| Time | Screen (URL / action) | On-screen text (caption, optional) | Voiceover |
|---|---|---|---|
| 0:00-0:06 | Home page top: https://fourfold-splitter.vercel.app | "SB 9: nonprofits are exempt from the 3-year live-in rule" | "Investors can't split a lot under SB 9 unless they live there three years. Nonprofits are exempt." |
| 0:06-0:12 | Slow scroll down the ranked table | "10 real Santa Ana listings, ranked" | "FourFold checks real Santa Ana listings against city, FEMA and fire data, and ranks them." |
| 0:12-0:22 | Click 1209 S Townsend St. Hold on the split drawing and the per-home box. | "$865,000 / 4 homes = $216,250 per home (vs $360k example, ASSUMPTION)" | "This one: the real lot, split in two, up to four homes. About two hundred sixteen thousand per home, before construction." |
| 0:22-0:30 | Scroll to the SB 9 checklist (PASS / UNKNOWN rows with sources) | "Every test: source + date. Unknowns say who to call." | "Every test shows its source. What we can't check says unknown, and who to call. One home into four." |

Animation slot (if the polish lands): 0:12 when the split line draws across the lot, and 0:06 if the table rows animate in. The script works without either.

### 60 to 90 second version

| Time | Screen | Voiceover |
|---|---|---|
| 0:00-0:10 | Home page top | "Investors can't split a lot under SB 9 unless they sign to live there three years. Nonprofits and community land trusts are exempt. That's an edge on ordinary listings." |
| 0:10-0:20 | Home page, ranked table | "Our user is a one-person acquisitions lead at a small nonprofit. No GIS team. Today, checking one listing means opening the zoning, flood, fire and parcel maps, then reading the law." |
| 0:20-0:30 | Still on table, point at verdict column | "FourFold takes ten real Santa Ana listings and ranks them: likely yes first, then lowest cost per home." |
| 0:30-0:45 | Click 1209 S Townsend St. Drawing + per-home box | "Here's the top one. That's the real parcel from the city, with a sketched split. Four homes. Eight sixty-five thousand asking, so about two sixteen per home before construction, against the brief's three sixty example." |
| 0:45-0:55 | Scroll to checklist | "Code decides every test from government data: zoning, lot size, FEMA flood, fire, historic. Each one has its source and the date we checked. What isn't public, like tenant history, says unknown and tells you who to ask." |
| 0:55-1:05 | Back, click 4202 W Fay Cir, scroll to the flood FAIL row | "And it says no. This one is partly in a FEMA flood zone, so it's out." |
| 1:05-1:15 | **Version A (reader on):** 1213 S Corta Dr listing evidence box with the quote. **Version B (reader off):** skip to next row. | A: "Claude reads the listing text. Here it found 'do not disturb tenants', so the tenant test is a possible fail. Claude can flag a problem. It can never make a test pass." |
| 1:15-1:25 | Home page bottom, type an address in the live check, click Check | "And any Santa Ana address runs live against the same servers in about a second. FourFold. One home into four." |

### Shots to re-record after the API key is added

- The **home page table** shots (1213 S Corta Dr should move out of LIKELY YES).
- Any shot of **1213 S Corta Dr** (listing evidence box should show the quote).
- Any shot of a site page's **"Listing evidence (read by Claude)"** box. Right now it says "Listing reader off: no ANTHROPIC_API_KEY set." Do not put that line in the final video.
- Do not say "5 likely yes" in voiceover. The 30-second script avoids the count on purpose.

---

## 3. Live demo, about 3 minutes (auditorium)

### Tabs to pre-open (in this order)

1. https://fourfold-splitter.vercel.app (home, scrolled to top)
2. https://fourfold-splitter.vercel.app/site/sa-04 (1209 S Townsend, LIKELY YES)
3. https://fourfold-splitter.vercel.app/site/sa-01 (4202 W Fay Cir, NO, flood). Pre-scroll to the checklist.
4. https://fourfold-splitter.vercel.app/site/sa-06 (1213 S Corta, tenant flag, only if the reader is on)
5. The demo video file, open in QuickTime, paused on frame 1
6. A folder of screenshots (see section 7)
7. The GitHub repo main page

Zoom the browser to 125 to 150% so the back row can read it. Turn off notifications (Focus mode). Plug in the charger.

### Script

**0:00-0:30 · John · Tab 1, home page top**
"Hi, we're FourFold. Quick fact about SB 9. An investor can't split a single-family lot unless they sign to live there for three years. Nonprofits and community land trusts are exempt. So on any ordinary house for sale, a nonprofit has an edge an investor doesn't. FourFold finds those houses, where a nonprofit can turn one home into four."

**0:30-0:55 · Jerry · Tab 1, scroll the ranked table**
"Our user is a one-person acquisitions lead at a small nonprofit with no GIS team. Their ask is, give me ten sites in one city I should call about this month, and why. So I pulled ten real Santa Ana listings off Zillow and Redfin this morning. FourFold ran each one and ranked them. Likely yes first, then cheapest per home."

**0:55-1:35 · John · Tab 2, sa-04**
"Top of the list, 1209 South Townsend. That outline is the real parcel from the city's map. The dashed line is a sketched equal split, two lots of about 3,250 square feet. Two units each, four homes. Asking is $865,000, so about $216,000 per home for land and building, before construction. The brief's example deal uses $360,000. That's an assumption from the brief, and we label it."
Scroll to the checklist.
"Every test here comes from code and government data. Zoning from the city. Flood from FEMA. Fire from the county's copy of CAL FIRE. Each row has the source and the date. And these six say unknown. Tenant history, rent control, prior splits. There's no free public data for them, so we don't guess. Each one tells you who to call."

**1:35-1:55 · Jerry · Tab 3, sa-01 checklist**
"It also says no. This house looked great on Zillow. It's partly in a FEMA flood zone A, so it fails. You'd find that out at the end of an afternoon of map checking. Here it's one row."

**1:55-2:20 · John · Tab 4 if reader is on, otherwise skip to live check**
Reader on: "Where does Claude come in? Claude reads only the listing text. On 1213 South Corta it found the exact phrase 'do not disturb tenants'. Code checks that quote really is in the listing. Claude can flag a possible fail. It can never make anything pass. Code decides, Claude reads."
Reader off: say the same thing without the click: "Claude only reads listing text for tenant clues, with an exact quote that code verifies. It can flag a problem, never pass one."

**2:20-2:45 · Jerry · Tab 1, scroll to "Check a Santa Ana address live"**
Type `1209 S Townsend St`, price `865000`, click Check.
"And it's not canned. Any Santa Ana address runs live against the city, FEMA and fire servers." (Result shows in about a second.)

**2:45-3:00 · John · stay on result**
"Every check is a public map service. A new city is its parcel and zoning layers plus its list of single-family zones, about an hour of work, then the same pipeline ranks every listing there. Anaheim and Fullerton are next. FourFold. One home into four."

### Backup plan

- **The pages are precomputed.** The home page and the 10 site pages load from `data/results.json`. They do not call government servers. If Wi-Fi is slow they still load once the page loads at all.
- **The live check is the only part that needs the government servers.** It took about 1 second in our tests. If it spins past 5 seconds, keep talking: "every outside call has an 8 second timeout, and a failed call shows up as UNKNOWN with the reason instead of crashing." If the result shows a flood or fire UNKNOWN because FEMA timed out, point at it. That's the tool being honest.
- **If the live check fails outright:** "That's the government server, not us. Here's the same address precomputed" and click Tab 2.
- **If the venue Wi-Fi is down:** hotspot from a phone. Pre-load every tab before walking up.
- **If the site won't load at all:** play the video (Tab 5), then walk through the screenshots. Say plainly: "The Wi-Fi is down. Here is the recording of the live app." Judges require a live demo, so try the hotspot first.
- **Don't type a new address on stage** you haven't tested. Use 1209 S Townsend St. Backup address that also worked: 1221 S Townsend St.

---

## 4. How it maps to the judging areas

Equal weight. Ties go to Impact, so lead with Impact.

**Impact: would a nonprofit use it next month?** The user is real and specific: a one-person acquisitions lead with no GIS team (lane scenario F02). The output is exactly their ask: a ranked list of houses for sale this month, why each one, and who to call next. It uses an advantage they already have by law (the owner-occupancy exemption) on listings anyone can buy. Proof on screen: the ranked table, and the "Next:" line on each UNKNOWN row.

**Works: live demo on real data, sources shown.** Real public listings, real parcel polygons from the City of Santa Ana, live FEMA, county fire and CGS checks. Every row shows its source link and date. Assumptions are tagged ASSUMPTION on screen. Proof: the checklist on sa-04, and the live address check at the bottom of the home page.

**Scale: believable path to the next 100.** Every check is a public ArcGIS service. A new city needs its parcel and zoning layers and a list of its single-family zone codes, about an hour per city (README estimate), then the same pipeline runs. Anaheim and Fullerton services are already listed in the lane data. Honest limit: listings are hand-collected today; a feed is the next step.

**Innovation: a new way to see it.** Most site-finding starts from vacant land or surplus lists. FourFold starts from ordinary houses for sale, and from a legal edge only nonprofits have. And it splits work cleanly: code decides eligibility, Claude only reads messy listing text and can flag a problem but never pass one. Proof: the Listing evidence box with a verified quote (once the reader is on).

---

## 5. Likely judge questions

**Is this legal advice?**
No. It's a prototype that screens on public data. Every page says confirm with the city and a professional. We say "likely yes", not "eligible".

**How accurate is it?**
The checks we run are only as good as the public layers. Known gaps, all in the README: lot area comes from the city polygon and can differ from the listing (4202 W Fay Cir: listing 10,001 sq ft, city about 8,682). A parcel that barely touches a flood zone counts as a FAIL. The fire map may predate CAL FIRE's 2025 maps. The 40% split minimum is from statute but not verified against the text today. A FAIL doesn't account for statutory exceptions.

**What if the listing is wrong?**
We don't trust the listing for eligibility. Lot size, zoning and hazards come from government data. The listing only feeds the asking price and Claude's tenant clues. Where they disagree, the page shows both numbers.

**Why do nonprofits win here?**
SB 9 requires an owner to sign an affidavit to live there 3 years before a lot split. Nonprofits and community land trusts are exempt (HCD SB 9 fact sheet, April 2026, p.2). Investors can't use the split the same way.

**Does a nonprofit have the money to buy at $850k?**
We don't know, and the tool doesn't answer that. It shows the purchase spread over four homes, which you compare against your per-home budget. Funding the gap is Lane 3. FourFold is Lane 1: lower the land cost per home.

**What about construction cost?**
Not included, and the page says so. The per-home number is land and building purchase only. The brief's worked example puts construction and repairs at $40k per home, but that's a mock example (ASSUMPTION), and new units would cost more than repairs. We don't have a sourced construction number.

**How do you scale beyond Santa Ana?**
Every check is a public ArcGIS service. Per city: plug in the parcel and zoning layers and list the single-family zone codes. About an hour each. Anaheim and Fullerton are next. Then a listing feed instead of hand collection.

**Why not just use Zillow?**
Zillow tells you the house is for sale. It doesn't tell you the zoning, whether the lot splits into two legal lots, flood or fire exclusions, or that a nonprofit is exempt from the live-in rule. We start from the listing and add all of that, with sources.

**What does Claude actually do?**
Two things. Claude Code built the whole app and encoded the rules from the HCD fact sheets, and checked Jerry's listings against the city parcel layer. Inside the app, Claude (claude-sonnet-5-5) only reads the listing description for tenant or vacancy clues and returns an exact quote. Code checks the quote is really in the text. Claude can mark a test "possible fail". It can never make a test pass.

**What's mocked?**
The $360k comparison is the brief's mock example (ASSUMPTION). The split line is a sketch, not a survey. Santa Ana being an urbanized area and RE counting as single-family are assumptions. Six tests are always UNKNOWN: tenant history, rent restriction, prior split, earthquake fault, environment, and the state historic inventory. Listings were collected by hand this morning, and six of ten descriptions are Jerry's summaries, not verbatim text.

**Why is 617 S Corwin Ct UNKNOWN but cheapest per home?**
It's zoned A1, General Agricultural. HCD says agricultural zones aren't SB 9 zones, but this one holds a house. We flag it as a possible fail and say ask the city. That's why it ranks below the likely yeses.

**Why does a NO show "UNKNOWN" for per home?**
When max homes is 0, there's nothing to divide by. (See UI notes below; this may get fixed.)

---

## 6. Things to know to present properly

### Pre-flight checklist (before 2:30 PM)

Submission form at https://claudesocal.com/uci-impact-lab (#submit). Fields:

- [ ] **Email:** the one on the team registration
- [ ] **Lane:** 1 Find it
- [ ] **One-liner:** the form sentence in section 1
- [ ] **Real user, before and after:** one-person acquisitions lead, no GIS team. Before: open zoning, flood, fire and parcel maps and read the law, per listing. After: a ranked list with verdict, sources, per-home cost and next call. (Copy from README "The real user".)
- [ ] **What it does:** README "What we built", three bullets
- [ ] **Sources and assumptions:** copy the README table. Make sure $360k, RE zone, urbanized area and split line say ASSUMPTION
- [ ] **Public repo URL:** the main page, not a file or branch. Open it in a private window, signed out
- [ ] **Video:** upload MP4/MOV, or an unlisted link tested signed out
- [ ] **Live demo URL:** https://fourfold-splitter.vercel.app
- [ ] Everything pushed to main by 2:30 (later commits are flagged)
- [ ] No API key in the repo or its history; `.env.example` has names only
- [ ] README "Try it" runs on a fresh laptop
- [ ] Re-read the home page after the API key lands; update the "5 likely yes" count anywhere you wrote it

### At 3:00 if you're a finalist

- Pre-open the tabs in section 3. Test the live check once in the room.
- Laptop charged, zoom at 125 to 150%, notifications off, hotspot ready.
- Time a run-through. Aim for 2:45 so you have room.

### Who says what

- **John:** opener, the top site and its checklist, Claude's role, the scale close.
- **Jerry:** the user and the data he collected, the NO example, the live check. He collected the listings, so he's the most credible voice on "these are real".
- Judge Q&A: John takes legal, Claude and scale questions. Jerry takes listing and data questions.

### Words to avoid, and what to say instead

| Avoid | Say |
|---|---|
| eligible, qualifies, approved | likely yes, passes the checks we can run |
| guaranteed, definitely, will | on public data, as far as the data shows |
| legal, legally allowed | SB 9 screen, confirm with the city |
| cost per home | land and building purchase per home, before construction |
| $216k per home (alone) | $216k per home before construction, vs the brief's $360k example |
| AI decides | code decides, Claude reads the listing |
| accurate, precise | sourced, with the date checked |
| all of Orange County | Santa Ana today |
| survey, lot line | a sketched split, not a survey |

Also: don't say "revolutionary", "game-changing" or similar. Say what it does and point at the screen.

---

## 7. Screens to capture (fallback deck or hub)

Take these at 125% zoom, full window, after the API key lands. Cmd+Shift+4 then Space to grab a window.

1. Home page top, headline and the first 5 rows: https://fourfold-splitter.vercel.app
2. Home page, full ranked table with NO rows visible
3. sa-04 top: parcel drawing with split + per-home box: https://fourfold-splitter.vercel.app/site/sa-04
4. sa-04 checklist with PASS and UNKNOWN rows and sources (scroll down)
5. sa-01 flood FAIL row: https://fourfold-splitter.vercel.app/site/sa-01
6. sa-02 A1 zoning possible FAIL row: https://fourfold-splitter.vercel.app/site/sa-02
7. sa-06 Listing evidence box with the Claude quote (only after the reader is on): https://fourfold-splitter.vercel.app/site/sa-06
8. Live check result for 1209 S Townsend St (home page, bottom)
9. README "What is real and what is mocked" table on GitHub

---

## UI notes found while clicking through (for the build team, not for the pitch)

Checked at about 11:05 AM on the live site. No code was changed.

1. **Verdict is below the fold on site pages.** At a normal laptop size, the LIKELY YES / NO badge only appears at "SB 9 checklist", after the drawing. A judge landing on a site page sees no verdict first. Putting the badge next to the address would fix it.
2. **Flood reason reads backwards.** "Failed: not in a fema special flood hazard area (FEMA: A)" sounds like it passed. Something like "In a FEMA flood zone (A)" would be clearer. Same on the home table for sa-01 and sa-07. Also "fema" is lowercase.
3. **"UNKNOWN: SB 9 does not appear to apply"** in the per-home box on NO sites (sa-01) is confusing. It's a NO, not an unknown. On the home table, per home shows "UNKNOWN" for NO rows; "n/a" or a dash would read better.
4. **No drawing for NO sites.** sa-01 shows the outline without a split. Fine, but the flood zone isn't drawn, so the visual doesn't explain the NO.
5. **Live check result has no parcel drawing.** It shows the verdict and checklist only. Okay for the demo, just don't promise a drawing there.
6. **Listing reader off message** shows on every site page ("no ANTHROPIC_API_KEY set"). Should disappear once the key is set; recheck.
7. **1213 S Corta Dr** shows LIKELY YES with "DO NOT DISTURB TENANTS" in its own listing text on the same page. A sharp judge will spot it. Fix with the key, or be ready to explain it.
8. Live check speed: 0.4 to 1.1 seconds across 5 calls (1209 S Townsend, 1213 S Corta, 4202 W Fay, 1221 S Townsend, and a fake address, which correctly returned UNKNOWN "Could not find this address").
9. Layout at iPad width (768 px) looks fine, no sideways scroll.
