# FourFold copy audit

Copy pass on the live site (https://fourfold-splitter.vercel.app) and the source, about 12:05 to 12:35 PM, Nov 7.
No code was changed. Other workers are editing right now, so line numbers drift (the site page already gained a
`<ClusterBadge>` while this was written). Find strings by the OLD text, not the line number.

Rules kept: every ASSUMPTION label, every UNKNOWN, every source and date, "not a survey", "asking price, not sale
price", "Claude can flag, never pass", and the footer disclaimer (`src/app/layout.tsx`, untouched). No new facts or
numbers. No em dashes.

## Word count, first screens

| Screen | Before | After (copy only) | Cut |
|---|---|---|---|
| Home, first screen (eyebrow, headline, lede, buttons, map legend, stats, list caption) | 163 | 110 | 33% |
| Site page sa-04, first screen (header, verdict, stats, lot viewer, Next call card) | 193 | 143 | 26% |
| Site page, plus showing 1 question in Next call instead of 2 (change #10) | 193 | 130 | 33% |

Counts are from the live page text at phone width. The pane would not go wider than phone, so desktop was checked by
reading the source layout, not by screenshot.

---

## Top 10 changes (by impact on the 60-second judge path)

**1. Site page shows "$865,000" under "Per home, nonprofit" for 2.6 seconds.**
Site page, `src/app/site/[id]/page.tsx` ~line 67, `src/components/site/AnimatedNumber.tsx` line 6 (`delayMs = 2600`).
The counter starts at the asking price and waits 2.6 s before dropping to $216,250. A judge who glances, a screenshot, or
the print view sees "PER HOME, NONPROFIT $865,000". Page text extraction also reads $865,000.
Proposed: start the animation at once (`delayMs = 2600` to `delayMs = 300`), or add a sub-line under the label:
`{money(r.asking_price)} ÷ {r.max_homes}`. Copy-only fix if code is frozen: change the label
`Per home, nonprofit` to `Per home, nonprofit (asking ÷ 4)`. Why: the number that wins the pitch is briefly wrong.

**2. Verdict reason, repeated on every LIKELY YES row and at the top of each site page.**
Home table + site page, `src/lib/sb9.ts:78`.
Current: `Passes zoning, lot size, flood and fire checks on public data. ${confirmLater.length} items still need confirming with the agent or city.`
Proposed: `Passes zoning, lot size, flood and fire on public data. ${confirmLater.length} open questions.`
Why: shown 4 times on the home table and is the first sentence on the site page. "Open questions" matches the stat
right below it and the call sheet.

**3. Home lede: cut the third sentence, the headline already says it.**
Home, `src/app/page.tsx:35-37`.
Current: `Investors can&apos;t split a lot under SB 9 unless they live there for 3 years.` ... `FourFold finds the houses for sale where a nonprofit can turn one home into four.`
Proposed: `Investors can&apos;t split a lot under SB 9 unless they live there 3 years.` and delete the last sentence.
Why: "One house for sale. Four homes for a nonprofit." already says what FourFold does. Source citation stays.

**4. List caption is one 50-word run-on with dots.**
Home, `src/app/page.tsx:62-63`.
Current: `{rows.length} listings collected by hand on 2026-11-07 · Ranked: LIKELY YES first, then lowest land cost per home, then fewest unknowns ·` / `Eligibility decided by code from city, county, FEMA and CAL FIRE data; Claude only reads the listing text for tenant or vacancy clues`
Proposed: `Collected by hand 2026-11-07. Ranked: LIKELY YES first, then lowest cost per home, then fewest unknowns.` / `Code decides from city, county, FEMA and CAL FIRE data. Claude only reads listing text for tenant or vacancy clues.`
Why: same facts, sentences instead of a dot chain; keeps "Claude only reads".

**5. Flood fail reads like legal text and doubles parentheses.**
Home table rows sa-01, sa-07 (5510 Roosevelt), and site pages. `src/lib/sb9.ts:47` and `:69`.
Current: `Fails: in a FEMA special flood hazard area (FEMA: A).` and `Fails: not a single-family zone (R2 (Two-Family Residence)).`
Proposed label: `in a FEMA high-risk flood zone`; proposed join: `${label(c)}, ${c.value}` (gives `Fails: in a FEMA high-risk flood zone, FEMA: A.` and `Fails: not a single-family zone, R2 (Two-Family Residence).`).
Why: "special flood hazard area" is FEMA jargon (FEMA itself calls these high-risk areas). Nested parens look broken.

**6. APN in the site headline.**
Site page, `src/app/site/[id]/page.tsx:45`, and `src/components/viz/LotViewer.tsx:20`.
Current: `` ` · APN ${r.parcel.apn}` `` (headline) and `APN {parcel.apn} · {Math.round(parcel.area_sqft).toLocaleString()} sq ft` (viewer header).
Proposed: `` ` · Parcel ${r.parcel.apn}` `` in the headline; delete the viewer header text (it repeats the headline and the lot line). Keep "APN" in tables and the checklist value, where a lead copying it into the assessor site needs it.
Why: a judge doesn't know APN; the same number and size appear three times on the first screen.

**7. Lot viewer caption: four sentences to four short labels.**
Site page, `src/components/viz/LotViewer.tsx:28-30`.
Current: `Real parcel outline from the city parcel layer.` / `" The split line is a sketch of one possible split, not a survey."` / `` ` Existing house footprint from OC Public Works${kept ? "; it fits on one lot, so it can stay." : "."}` `` / `split line and new homes.`
Proposed: `Outline: city parcel map.` / `" Split line: a sketch, not a survey."` / `` ` House: OC Public Works${kept ? ", fits on one lot, can stay." : "."}` `` / `split and new homes.`
Why: keeps both sources and "not a survey", half the words.

**8. Check names read like statute. Shorten the eleven test titles** (full pairs below under `src/lib/checks/*`).
Example: `Not rent-restricted, rent-controlled, or Ellis Act withdrawn (15 years)` to `No rent control, rent limits, or Ellis Act exit in 15 years`; `Not in a FEMA special flood hazard area` to `Not in a FEMA high-risk flood zone`.
Why: the checklist is the "Works" proof in the demo; the rule line under each title already carries the legal citation.

**9. Repeated UNKNOWN note.** `src/lib/checks/manual.ts:10`.
Current: `note = "UNKNOWN until someone confirms it."` (appears on 4 rows, next to an UNKNOWN badge and a "Not checked" value).
Proposed: `note = ""`. Why: says the same thing three times per row; UNKNOWN badge and Next step stay.

**10. Next call card: show one question, not two; tighten the questions.**
Site page, `src/components/site/NextCallCard.tsx` (the `Math.min(2, ...)` / slice of 2), `src/lib/callsheet.ts:9,11`.
Current Q: `Has anyone rented this home, or any unit on the lot, in the last 3 years? If so, until when?`
Proposed Q: `Has anyone rented the house, or any unit on the lot, in the last 3 years? Until when?`
Current Q: `Is there any recorded affordability covenant or rent restriction on the property?`
Proposed Q: `Any recorded affordability covenant or rent restriction?`
Also: `Copy draft email to agent` to `Copy email to agent`; `Drafts only. FourFold never sends anything.` to `Drafts only. Nothing is sent.`
Heads up: the card says "7 more questions" while the stat says "Open questions 6". The call sheet adds the
keep-the-house and parking questions, which aren't verdict items. A judge may notice; either rename the stat
`Open tests` or make the card say `7 more calls in the call sheet`.

---

## Full list: find/replace pairs

Each OLD is copied from the source as of ~12:30 PM and appears once in its file unless marked.

### src/app/page.tsx
```
OLD: <div className="eyebrow">Santa Ana / SB 9 / {rows.length} listings, 2026-11-07</div>
NEW: <div className="eyebrow">Santa Ana · {rows.length} listings · 2026-11-07</div>

OLD: Investors can&apos;t split a lot under SB 9 unless they live there for 3 years. Nonprofits and community land trusts
NEW: Investors can&apos;t split a lot under SB 9 unless they live there 3 years. Nonprofits and community land trusts

OLD:             FourFold finds the houses for sale where a nonprofit can turn one home into four.
NEW: (delete the line)

OLD: See the ranked list ↓
NEW: Ranked list ↓

OLD: { k: "Listings checked", v: fmt(rows.length), href: "#list" },
NEW: { k: "Listings", v: fmt(rows.length), href: "#list" },

OLD: { k: "Parcels screened", v: fmt(counts.total), href: "/city" },
NEW: { k: "Parcels", v: fmt(counts.total), href: "/city" },

OLD: <h2>Santa Ana: homes for sale, ranked</h2>
NEW: <h2>Santa Ana homes for sale, ranked</h2>

OLD: {rows.length} listings collected by hand on 2026-11-07 · Ranked: LIKELY YES first, then lowest land cost per home, then fewest unknowns ·
NEW: Collected by hand 2026-11-07. Ranked: LIKELY YES first, then lowest cost per home, then fewest unknowns.

OLD: Eligibility decided by code from city, county, FEMA and CAL FIRE data; Claude only reads the listing text for tenant or vacancy clues
NEW: Code decides from city, county, FEMA and CAL FIRE data. Claude only reads listing text for tenant or vacancy clues.

OLD: Per home = asking price ÷ max homes: land and building purchase per home, before construction. $360k is the brief&apos;s worked example{" "}
NEW: Per home = asking price ÷ max homes, before construction. Asking price is not sale price. $360k is the brief&apos;s worked example{" "}

OLD: <Link href="/comparables">Recent SB 9 projects in Orange County →</Link>
NEW: <Link href="/comparables">Recent OC SB 9 projects →</Link>
```
Note: the "Checks run ... UTC" stamp is a source date; keep it.

### src/app/site/[id]/page.tsx
```
OLD: <span className="second">{r.city}, CA{r.parcel ? ` · APN ${r.parcel.apn}` : ""}</span>
NEW: <span className="second">{r.city}, CA{r.parcel ? ` · Parcel ${r.parcel.apn}` : ""}</span>

OLD: {r.parcel ? `Lot ${Math.round(r.parcel.area_sqft).toLocaleString()} sq ft (city polygon)` : "No parcel match"}
NEW: {r.parcel ? `Lot ${Math.round(r.parcel.area_sqft).toLocaleString()} sq ft (city map)` : "No parcel match"}

OLD: {r.listed_lot_sqft ? ` · listing says ${r.listed_lot_sqft.toLocaleString()} sq ft` : ""}
NEW: {r.listed_lot_sqft ? `; listing says ${r.listed_lot_sqft.toLocaleString()}` : ""}

OLD: rel="noreferrer" style={{ color: "inherit" }}>Listing</a> collected {r.date_collected}</>}
NEW: rel="noreferrer" style={{ color: "inherit" }}>Listing</a>, {r.date_collected}</>}

OLD: <div className="k">Max homes</div>
NEW: <div className="k">Homes</div>

OLD: <div className="k">Asking price</div>
NEW: <div className="k">Asking</div>

OLD: no split unless they live there 3 years
NEW: no split without a 3-year live-in

OLD: <summary>What Claude read in the listing{tenantQuote ? ": tenant flagged" : ""}</summary>
NEW: <summary>What Claude read{tenantQuote ? ": tenant flagged" : ""}</summary>

OLD: Claude can flag a possible problem; it cannot make a test pass.
NEW: Claude can flag a problem, never pass a test.

OLD:  (team member's summary, not verbatim listing text)
NEW:  (team member's summary, not the listing's words)

OLD: <summary>Fund the gap: enter your budget and costs to see what is still needed and what a donation covers</summary>
NEW: <summary>Fund the gap: what is still needed, and what a donation covers</summary>
```

### src/lib/sb9.ts
```
OLD:   flood: "in a FEMA special flood hazard area",
NEW:   flood: "in a FEMA high-risk flood zone",

OLD:   fire: "in a very high fire hazard zone",
NEW:   fire: "in a very high fire risk zone",

OLD:     reason = "Fails: " + fails.map((c) => `${label(c)} (${c.value})`).join("; ") + ".";
NEW:     reason = "Fails: " + fails.map((c) => `${label(c)}, ${c.value}`).join("; ") + ".";

OLD:     reason = "Possible FAIL to confirm: " + possible.map(label).join("; ") + ".";
NEW:     reason = "Possible fail, confirm: " + possible.map(label).join("; ") + ".";

OLD:     reason = `Passes zoning, lot size, flood and fire checks on public data. ${confirmLater.length} items still need confirming with the agent or city.`;
NEW:     reason = `Passes zoning, lot size, flood and fire on public data. ${confirmLater.length} open questions.`;
```

### src/components/Checklist.tsx
```
OLD: (homes === 0 ? "n/a, SB 9 does not apply" : money(perHome))
NEW: (homes === 0 ? "n/a" : money(perHome))
```
(The verdict NO and its reason sit in the same row, so "SB 9 does not apply" repeats it.)
```
OLD: <thead><tr><th>Test</th><th>Result</th><th>Value and next step</th><th>Source, date checked</th></tr></thead>
NEW: <thead><tr><th>Test</th><th>Result</th><th>Found, next step</th><th>Source, date</th></tr></thead>
```
(Only if it appears once; it may be rendered twice for the two tables, in which case use "(all occurrences)".)

### src/components/SiteTable.tsx
```
OLD: Showing {shown.length} of {results.length} · rank is the original ranking
NEW: Showing {shown.length} of {results.length}

OLD: r.land_cost_per_home != null ? `${r.land_cost_per_home <= BRIEF_LAND_PER_HOME ? "below" : "above"} $360k example` : null;
NEW: (keep; it is short and carries the comparison. Make sure the ASSUMPTION label shows near it, as on the site page.)

OLD: <Link href="/brief">Printable call list (PDF)<span>/brief · print or save as PDF</span></Link>
NEW: <Link href="/brief">Call list (PDF)<span>print or save as PDF</span></Link>

OLD: <a href="/results.csv" download>Download CSV<span>ranked list · /results.csv</span></a>
NEW: <a href="/results.csv" download>Ranked list CSV<span>/results.csv</span></a>

OLD: <a href="/city.csv" download>Citywide lots CSV<span>every candidate lot · /city.csv</span></a>
NEW: <a href="/city.csv" download>Citywide lots CSV<span>/city.csv</span></a>

OLD: <span className="eyebrow">Max land cost per home ($)</span>
NEW: <span className="eyebrow">Max cost per home ($)</span>
```

### src/components/viz/LotViewer.tsx
```
OLD: <span className="eyebrow">APN {parcel.apn} · {Math.round(parcel.area_sqft).toLocaleString()} sq ft</span>
NEW: <span className="eyebrow">Lot sketch</span>

OLD: Real parcel outline from the city parcel layer.{showSplit ? " The split line is a sketch of one possible split, not a survey." : " SB 9 split not shown: the site does not pass."}
NEW: Outline: city parcel map.{showSplit ? " Split line: a sketch, not a survey." : " No split shown: the site does not pass."}

OLD: {model.buildings.length ? ` Existing house footprint from OC Public Works${kept ? "; it fits on one lot, so it can stay." : "."}` : ""}
NEW: {model.buildings.length ? ` House: OC Public Works${kept ? ", fits on one lot, can stay." : "."}` : ""}

OLD: split line and new homes.
NEW: split and new homes.
```

### src/components/viz/CityHero.tsx
```
OLD: <span className="eyebrow">Santa Ana · every parcel · one dot each</span>
NEW: <span className="eyebrow">Every Santa Ana parcel</span>

OLD: passes first SB 9 screen</span>
NEW: passes first screen</span>

OLD: other parcel</span>
NEW: other</span>
```

### src/components/site/NextCallCard.tsx
```
OLD: {copied ? "Copied" : "Copy draft email to agent"}
NEW: {copied ? "Copied" : "Copy email to agent"}

OLD: {more} more questions in the <a href="#call-sheet">call sheet</a>.
NEW: {more} more in the <a href="#call-sheet">call sheet</a>.

OLD: Drafts only. FourFold never sends anything.
NEW: Drafts only. Nothing is sent.
```
Structural (not find/replace): show 1 question instead of 2 (`Math.min(2, items.length)` and the matching slice).

### src/components/site/SectionNav.tsx
```
OLD:   ["why-nonprofit", "Why a nonprofit wins"],
NEW:   ["why-nonprofit", "Why nonprofits win"],

OLD:   ["nearby", "Nearby SB 9 projects"],
NEW:   ["nearby", "Nearby projects"],
```

### src/components/InvestorCard.tsx
```
OLD: Purchase cost is the listing asking price, not the sale price, before construction. ADUs under ADU law are a separate path not counted here.
NEW: Purchase cost is the asking price, not the sale price, before construction. Backyard units (ADUs) are a separate path, not counted.

OLD: <th>Investor who won&apos;t live there</th>
NEW: <th>Investor (won&apos;t live there)</th>

OLD: <td>Yes, exempt from the promise</td>
NEW: <td>Yes, exempt</td>
```

### src/components/CallSheet.tsx
```
OLD: <h3 style={{ marginTop: 0 }}>Call sheet: what to ask, and who</h3>
NEW: <h3 style={{ marginTop: 0 }}>Call sheet</h3>

OLD: Every open question above, turned into a call. FourFold drafts these; it never sends anything.
NEW: Each open question, as a call. Drafts only; nothing is sent.
```

### src/lib/callsheet.ts
```
OLD: question: "Has anyone rented this home, or any unit on the lot, in the last 3 years? If so, until when?"
NEW: question: "Has anyone rented the house, or any unit on the lot, in the last 3 years? Until when?"

OLD: question: "Is there any recorded affordability covenant or rent restriction on the property?"
NEW: question: "Any recorded affordability covenant or rent restriction?"

OLD: question: "Is this address covered by the city's rent control or rent stabilization rules, or was it withdrawn from rental under the Ellis Act in the last 15 years?"
NEW: question: "Is this address under city rent control or rent stabilization, or pulled off the rental market under the Ellis Act in the last 15 years?"

OLD: why: "SB 9 excludes rent-controlled housing and Ellis Act withdrawals in the last 15 years."
NEW: why: "SB 9 excludes both."

OLD: question: "Was this parcel created by an SB 9 lot split, and has the same owner split an adjacent lot under SB 9?"
NEW: question: "Was this parcel made by an SB 9 split, or has the same owner split a lot next door under SB 9?"

OLD: question: "Is the parcel in an Alquist-Priolo earthquake fault zone?"
NEW: question: "Is the parcel in a state earthquake fault zone (Alquist-Priolo)?"

OLD: question: "Is the house a historic resource, a landmark, or a contributing structure in a historic district, locally or on the State Historic Resources Inventory?"
NEW: question: "Is the house historic: a landmark, on the State Historic Resources Inventory, or a contributing building in a historic district?"

OLD: question: "Can the city require parking for SB 9 units at this address, given nearby transit?"
NEW: question: "Can the city require parking here, given nearby transit?"
```

### src/lib/checks/manual.ts
```
OLD: note = "UNKNOWN until someone confirms it."
NEW: note = ""

OLD: let tNote = "UNKNOWN until the seller confirms.";
NEW: let tNote = "Only the seller can confirm.";

OLD: tNote = "Possible FAIL, confirm with agent. The listing text suggests a tenant. A tenant in the last 3 years rules out SB 9.";
NEW: tNote = "Possible fail: the listing suggests a tenant. A tenant in the last 3 years rules out SB 9. Confirm with the agent.";

OLD: tNote = "The listing does not mention a tenant, but a listing cannot prove 3 years without one. Still UNKNOWN.";
NEW: tNote = "No tenant mentioned, but a listing can't prove 3 years without one. Still UNKNOWN.";

OLD: mk("rent_restricted", "Not rent-restricted, rent-controlled, or Ellis Act withdrawn (15 years)"
NEW: mk("rent_restricted", "No rent control, rent limits, or Ellis Act exit in 15 years"

OLD: mk("prior_split", "Not created by a prior SB 9 split, and no adjacent split by the same owner"
NEW: mk("prior_split", "No earlier SB 9 split here, or next door by the same owner"

OLD: mk("environment", "Not wetlands, habitat, farmland, conservation easement, or hazardous waste site"
NEW: mk("environment", "Not wetland, habitat, farmland, easement or toxic site"

OLD: "Check the CGS EQ Zapp map (its data service needed a token when tested)."
NEW: "Check the state's EQ Zapp fault map (its data service needed a token when tested)."
```

### src/lib/checks/lot-split.ts
```
OLD: test: "Lot can split into two lots of at least 1,200 sq ft, neither under 40%",
NEW: test: "Splits into two lots of 1,200+ sq ft, neither under 40%",

OLD: source_name: SRC.saParcels.name + " (area computed from the polygon, State Plane feet)",
NEW: source_name: SRC.saParcels.name + " (area measured from the parcel map)",

OLD: ? "Big enough for two lots on paper. Access, frontage and the city's objective standards still apply."
NEW: ? "Big enough on paper. Street access, frontage and the city's written standards still apply."

OLD: next_step: pass ? "Confirm access to the street for the rear lot with the city planning desk." : undefined,
NEW: next_step: pass ? "Ask the city planning desk about street access for the rear lot." : undefined,
```

### src/lib/checks/zoning.ts
```
OLD: test: "Single-family residential zone",
NEW: test: "Single-family zone",

OLD: note: "Possible FAIL: zoned General Agricultural. HCD says agricultural zones are not SB 9 zones, but this one holds a house; the city decides whether its primary purpose is single-family.",
NEW: note: "Possible fail: zoned General Agricultural (A1). HCD says farm zones are not SB 9 zones, but this one has a house. The city decides.",
```

### src/lib/checks/flood.ts
```
OLD: test: "Not in a FEMA special flood hazard area",
NEW: test: "Not in a FEMA high-risk flood zone",

OLD: note: (fema.value.sfha ? "Part of the parcel is in a special flood hazard area. Excluded unless a statutory exception applies." : "Not in a special flood hazard area.") + " County copy agrees.",
NEW: note: (fema.value.sfha ? "Part of the parcel is in a high-risk flood zone. Out unless a statutory exception applies." : "Not in a high-risk flood zone.") + " County copy agrees.",
```

### src/lib/checks/fire.ts
```
OLD: value: classes.length ? classes.join(", ") : "Not in a mapped LRA fire hazard zone",
NEW: value: classes.length ? classes.join(", ") : "Not in a mapped local fire hazard zone (LRA)",

OLD: note: (vh ? "In a very high fire hazard severity zone. Statute has narrow exceptions." : "Not in a very high fire hazard severity zone.") + caveat,
NEW: note: (vh ? "In a very high fire hazard zone. Statute has narrow exceptions." : "Not in a very high fire hazard zone.") + caveat,
```
Also check the `caveat` text: live it reads "Map vintage may predate CAL FIRE's 2025 LRA maps." Proposed: "Map may predate CAL FIRE's 2025 update." (keep the caveat).

### src/lib/checks/historic.ts
```
OLD: test: "Not a historic property, landmark, or contributing structure in a historic district",
NEW: test: "Not historic (landmark, listed, or district contributor)",

OLD: value: "Not on Santa Ana's historic list or in a city historic district",
NEW: value: "Not on the city historic list or in a city district",

OLD: note: "City data is clean. The State Historic Resources Inventory was not checked.",
NEW: note: "State inventory not checked.",
```

### src/lib/checks/transit.ts
```
OLD: test: "No parking can be required: near high-quality transit (bonus, does not change the verdict)",
NEW: test: "No parking required: near frequent transit (bonus, does not change the verdict)",

OLD: note: "Likely no parking can be required, which frees lot space for homes. Caltrans areas are straight-line, not walking distance, so confirm with the city.",
NEW: note: "Likely no parking required, which frees space for homes. Caltrans measures straight-line, not walking distance: confirm with the city.",
```
Also: the value prints the raw type, e.g. "hq corridor bus" (`String(a.hqta_type).replace(/_/g, " ")`). Map known values to plain words ("frequent bus corridor") or drop it.

### src/lib/checks/footprint.ts
```
OLD: test: "Existing house fits on one half, so it can stay (bonus, does not change the verdict)",
NEW: test: "Existing house can stay (bonus, does not change the verdict)",
```
Also: `${buildings.length} building(s)` (all occurrences) should pluralize: `${buildings.length} building${buildings.length === 1 ? "" : "s"}`.

### src/components/Comparables.tsx
```
OLD: Found by searching city notes and tracking IDs for &quot;SB 9&quot;; the APR has no SB 9 field, so cities that do not
NEW: Found by searching city notes for &quot;SB 9&quot;. The state report has no SB 9 field, so cities that do not

OLD: label SB 9 work are missing. The data mostly cannot tell lot splits from second units or duplexes. Units are as the city
NEW: label SB 9 work are missing, and it mostly can&apos;t tell splits from duplexes or second units. Units are as the city
```

### src/components/LiveCheck.tsx
```
OLD: Listing description (optional, read by Claude for tenant/vacant flags)
NEW: Listing text (optional; Claude looks for tenant or vacancy clues)
```

### src/app/check/page.tsx
```
OLD: Type any Santa Ana address. FourFold runs each test against city, county, FEMA and fire servers. A server that does not answer becomes UNKNOWN with the reason.
NEW: Type any Santa Ana address. Each test runs live against city, county, FEMA and fire servers. If one doesn&apos;t answer, that test says UNKNOWN and why.
```

### src/app/city/page.tsx
```
OLD: shared_polygon: "share one lot outline with other APNs (typically condo or mobile-home units on a common lot)",
NEW: shared_polygon: "share one lot with other parcels (usually condos or mobile homes)",

OLD: flood: "centroid in a FEMA special flood hazard area",
NEW: flood: "center point in a FEMA high-risk flood zone",

OLD: fire: "centroid in a very high fire hazard severity zone",
NEW: fire: "center point in a very high fire hazard zone",

OLD: Same rules as the per-address check, run once over the whole city from public GIS layers. Any city with parcel,
NEW: Same rules as the address check, run once over the whole city from public map layers. Any city with parcel,
```
The page's "centroid" in the limits list (`tested at each parcel&apos;s centroid`) can become `center point` too.

---

## Glossary moves

Replace in body text; keep the term in a short parenthetical or `title=` tooltip where the lead will need it to look things up.

| Jargon | Body text | Where the term stays |
|---|---|---|
| APN | "parcel 109-453-19" in the site headline | Table column, checklist value, CSV: "APN" with tooltip "Assessor's Parcel Number, the county's ID for the lot" |
| SFHA / special flood hazard area | "FEMA high-risk flood zone" | Rule line under the flood test keeps the statute; tooltip "FEMA's name: Special Flood Hazard Area" |
| LRA | "local fire hazard zone (LRA)" | Method page source table; tooltip "Local Responsibility Area: where the city, not CAL FIRE, fights fires" |
| HQTA / high-quality transit | "frequent transit" | Rule line keeps "high-quality transit corridor or major transit stop" (statute words) |
| ministerial | not found in UI copy this pass; if added, say "approved by staff, no hearing" |
| objective standards | "the city's written standards" | Method page can keep "objective standards" with the plain gloss |
| State Plane feet | drop from UI | Method page only ("measured in the state's survey grid, wkid 2230") |
| centroid | "center point" | Method page |
| APR | "the state's housing progress report (APR)" on first use | Comparables source line keeps the full name |
| Alquist-Priolo, Ellis Act | keep, with "(state earthquake fault zone)" and "(owner pulled the units off the rental market)" | Call sheet questions |
| ADU | "backyard unit (ADU)" | InvestorCard |

---

## Pitch kit fixes (pitch/PITCH-KIT.md)

The live site shows **4 LIKELY YES, 2 UNKNOWN, 4 NO**. 1213 S Corta Dr (sa-06) is now UNKNOWN ("listing suggests a tenant"), so the reader is on.

```
OLD: **Number 1: 10 real listings checked, 5 likely yes.**
NEW: **Number 1: 10 real listings checked, 4 likely yes.**

OLD: 10 public Santa Ana listings Jerry collected on 2026-11-07. Results today: 5 LIKELY YES, 1 UNKNOWN, 4 NO. (`data/results.json`, `verdict` field.)
NEW: 10 public Santa Ana listings Jerry collected on 2026-11-07. Results: 4 LIKELY YES, 2 UNKNOWN, 4 NO (`data/results.json`, `verdict`).

OLD: Heads up: 1213 S Corta Dr (sa-06) is LIKELY YES only because the Claude listing reader is off. Its listing says "DO NOT DISTURB TENANTS." Once the key is in, it should drop, which makes it **4 likely yes**. Check the home page before you say the number out loud.
NEW: 1213 S Corta Dr (sa-06) dropped to UNKNOWN: Claude found "DO NOT DISTURB TENANTS" in its listing. Check the home page before you say the number out loud.

OLD: All five LIKELY YES sites land between $216,250 and $237,250 per home.
NEW: All four LIKELY YES sites land between $216,250 and $237,250 per home.
```
(Verified on the live table: $216,250, $222,250, $237,250, $237,250.)

```
OLD: Each site gets 12 tests (parcel, zoning, lot split, flood, fire, historic, tenant, rent restriction, prior split, fault, environment, landslide). 6 of them are honestly UNKNOWN on every site, with a next step for each.
NEW: Each site gets 11 verdict tests plus 3 site notes (house can stay, parking, landslide). 6 are UNKNOWN on every site, each with a next step.
```
(Live sa-04 checklist: 11 rows in the verdict table, 3 under "Site notes". The kit's "12" doesn't match either. Recount before saying it.)

```
OLD: | 1:05-1:15 | **Version A (reader on):** 1213 S Corta Dr listing evidence box with the quote. **Version B (reader off):** skip to next row. | A: "Claude reads the listing text. Here it found 'do not disturb tenants', so the tenant test is a possible fail. Claude can flag a problem. It can never make a test pass." |
NEW: | 1:05-1:15 | 1213 S Corta Dr, "What Claude read" box with the quote | "Claude reads the listing text. Here it found 'do not disturb tenants', so the tenant test is a possible fail. Claude can flag a problem. It can never pass one." |
```

Section "Shots to re-record after the API key is added": the reader is on now. Replace the section with one line:
```
NEW: The reader is on. Re-record any shot taken before ~12 PM that shows 1213 S Corta Dr as LIKELY YES or says "Listing reader off".
```

Also stale:
- "Listing evidence (read by Claude)" box: the site page now calls it "What Claude read in the listing". Update section 2, section 4 (Innovation proof) and screen list item 7.
- Section 3 tab 4 "(only if the reader is on)" and the 1:55 "Reader off" line: drop the conditionals.
- Section 5 "Why does a NO show UNKNOWN for per home?": fixed. The table now says "n/a, SB 9 does not apply". Delete the Q or change the answer to "It shows n/a: with 0 homes there's nothing to divide."
- Pre-flight: `Re-read the home page after the API key lands; update the "5 likely yes" count anywhere you wrote it` becomes `Recheck "4 likely yes" on the home page right before submitting and before the pitch.`
- UI notes 2, 3, 6, 7 are done on the live site (flood wording reads "in a FEMA special flood hazard area", NO rows say n/a, reader on, Corta is UNKNOWN). Mark them fixed.
- "Words to avoid": add `APN` → `parcel number`, `special flood hazard area` → `FEMA high-risk flood zone`.

Wordy lines in the kit:
```
OLD: Do not quote "an afternoon per listing" as a measured number. It is the team's description of the manual process in the README. Say "today it means opening four maps and reading the law" instead.
NEW: Don't quote "an afternoon per listing" as measured. Say "today it means opening four maps and reading the law."

OLD: "Hi, we're FourFold. Quick fact about SB 9. An investor can't split a single-family lot unless they sign to live there for three years. Nonprofits and community land trusts are exempt. So on any ordinary house for sale, a nonprofit has an edge an investor doesn't. FourFold finds those houses, where a nonprofit can turn one home into four."
NEW: "Hi, we're FourFold. Under SB 9, an investor can't split a single-family lot unless they live there three years. Nonprofits and community land trusts are exempt. So on any house for sale, a nonprofit has an edge. FourFold finds the ones where a nonprofit can turn one home into four."
```
