# FourFold

> For a one-person acquisitions lead at a small housing nonprofit: FourFold finds Santa Ana houses for sale where a nonprofit could use SB 9 to turn one home into four, and shows why, with sources.

**Lane:** 1 Find it
**Built at:** Claude Impact Lab: UCI × SoCal Affordable Housing, November 7, 2026
**Live demo:** https://fourfold-splitter.vercel.app

## The app in one screen

The home page (`/`) is one screen.

- **Left panel, three tabs:** **Sites** (the 10 listings, ranked), **Groups** (viable listings close together) and **City** (every Santa Ana lot on a first screen).
- **Right stage, three views:** **3D** particles by default (the city's 57,926 parcels; select a site and its real lot assembles, splits and the homes rise), **Map** (dot-matrix map with № tags) and **Technical** (a blueprint with dimensions and the 4 ft line, the largest side and rear setback SB 9 lets a city require, HCD SB 9 Fact Sheet, Sept 2024, p.4).
- **Site card:** verdict, homes, per home (counts down from the asking price), asking price, investor per home, the next call, and buttons that open windows: **Checklist**, **Call sheet**, **Fund the gap**, **Local support** and **Briefing PDF**.
- **Bottom:** **Check an address** (the live check) and **More** (project outcomes, OC SB 9 projects, how it works, call list PDF, CSV, your organization).
- **Deep links:** `/app?site=sa-10`, `/app?tab=groups`, `/app?tab=city`, `/app?site=sa-10&window=fund`.

## The pitch

Investors can't split a lot under SB 9 unless they sign an affidavit to live there for 3 years. Nonprofits and community land trusts are exempt from that affidavit ([HCD SB 9 fact sheet, April 2026, p.2](https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf)). That gives a nonprofit an edge on ordinary single-family listings. FourFold finds the houses for sale where a nonprofit can turn one home into four.

## The real user

A one-person acquisitions lead at a small housing nonprofit with no GIS team (scenario F02: "Give me ten sites in one city I should call about this month, and why each one"). Today, checking one listing for SB 9 means opening the zoning map, the FEMA flood map, the fire map and the parcel map, then reading the law.

**Before:** an afternoon per listing, by hand, and most listings fail one test you only find at the end.
**After:** a ranked list of the listings in one city, each with a yes / no / unknown verdict, every test with its source and date, the real lot drawn with a sketched split, the asking price divided by four homes, and the next call to make for each open question.

## What we built

- **Ranked list** of 10 real Santa Ana listings: LIKELY YES first, then lowest land cost per home, then fewest unknowns.
- **Site page** per listing: verdict and reason, checklist (PASS / FAIL / UNKNOWN with value, source link and date checked), max homes, land and building purchase per home compared with the brief's $360k example (ASSUMPTION), a 2D drawing of the real parcel polygon with a split line and house icons, and Claude's listing evidence with the exact quoted phrase.
- **Live check** at the bottom of the home page: type any Santa Ana address and run every check against government servers in about a second.
- **Keep the house:** the county's building footprints are drawn on the lot. Code tries to slide the split line so the existing house sits wholly on one lot (both lots still at least 1,200 sq ft and 40%). If it fits, the nonprofit can keep the house and build 3 instead of demolishing.
- **No parking needed:** flags lots inside a Caltrans High Quality Transit Area. HCD says no parking can be required within 1/2 mile walking distance of high-quality transit (fact sheet April 2026 p.1). Caltrans areas are straight-line, so this is "likely".
- **Why a nonprofit wins:** a card on each 4-home site comparing an investor (up to 2 homes, or a 3-year live-in promise to split) with a nonprofit (up to 4).
- **Call sheet:** every UNKNOWN turned into the exact question and who to ask (listing agent, planning desk, housing division, surveyor), plus a copyable draft email to the listing agent. Drafts only; FourFold never sends anything.
- **Investor vs nonprofit cost:** purchase cost per home for an investor (asking ÷ 2, no split without the live-in promise) next to the nonprofit's (asking ÷ 4). Real asking prices only.
- **Fund the gap:** a calculator on each site page. The purchase price is real; construction, time costs, fees, budget, sale proceeds and subsidies are typed in by the user. The brief's worked-example numbers are offered as one-click ASSUMPTION examples, except new construction, which has no default (the brief's $40k is repairs to one existing home). Shows the gap, which cost lines are still unfunded, and what a donation would cover.
- **Filters:** the ranked list filters by verdict, price, cost per home, keeps-the-house, no parking, no tenant flag and address, and the filtered view can be shared as a link. The city list filters by lot size, zone and address.
- **Exports:** printable briefing per site (`/site/sa-04/brief`, save as PDF), a printable ten-site call list (`/brief`), and CSV downloads (`/results.csv`, `/city.csv`).
- **Recent SB 9 projects** (`/comparables`, and a card on each site page): 68 projects in Orange County labelled SB 9, SB9 or lot split in cities' Housing Element Annual Progress Reports (HCD APR Tables A and A2 on data.ca.gov, checked 2026-11-07), 55 of them in Garden Grove. Santa Ana reports every year but never labels a project as SB 9, so its count is UNKNOWN, not zero. Of 15 projects with both permit and completion dates, the median gap was 9.3 months.
- **Whole city** (`/city`): every one of Santa Ana's 57,926 parcels screened once. 30,590 are zoned single-family, 30,352 are big enough to split, and **25,246 pass flood, fire and the city historic list on a first screen** (347 more sit inside a historic district). Map plus a searchable list that opens the live check. Built by `npm run citywide` (66 requests to public GIS services, cached).
- **Site groups** (Groups tab, `/clusters`): viable listings within 0.5 mi of each other (**ASSUMPTION**: a walkable one-crew radius, a team judgment, not a rule), so a small nonprofit can run one acquisitions push, one city process and one contractor. Group A today: 927 S Laurel St and 617 S Corwin Ct, 8 homes within 0.24 mi (617 S Corwin is UNKNOWN on zoning). At 1 mi, 1217 S Huron Dr joins for 12 homes. Code: `src/lib/clusters.ts`.
- **Local support** (window on each site): public signals about the city from `data/support/santa-ana.json`, checked 2026-11-07. Housing element in compliance (HCD, POSITIVE). 6th cycle RHNA progress: very low income 359 of 606, moderate 260 of 545, ahead on low and above moderate (NEUTRAL, an ASSUMPTION). Pre-approved ADU plans page (a mild POSITIVE, an ASSUMPTION since it is about ADUs, not SB 9). UNKNOWN: SB 9 projects in the city's state reports, HCD letters to the city, and the city's own SB 9 rules (leads only, records portal would not open). These describe the city, not whether a given organization has local support.
- **Continual learning from project outcomes** (`/learn`, `data/outcomes/`, `src/lib/learning.ts`): when an organization records a real project (what FourFold got right or wrong, stage dates, actual costs), the next rebuild uses it for per-check calibration, city-confirmed rule notes, timelines, real costs in place of the brief's assumptions in Fund the gap, and call-sheet questions. It never overturns a hard FAIL. As of 2026-11-07 there are **0 real records**; `data/outcomes/examples/` is made up and ignored unless a test or the labelled demo toggle asks for it.

## How Claude is used

- **Built with Claude Code:** the whole app, the data probe, and the rule encoding from the HCD fact sheets. A Claude subagent checked every listing Jerry collected against the city parcel layer (see `data/listings-check.md`).
- **Inside the tool: code decides, Claude reads.** Eligibility is decided only by code using government data. Claude (`claude-sonnet-5-5`, structured JSON output) reads only the free-text listing description and returns tenant-occupied / vacant / owner-occupied flags with a quoted phrase. Code then checks each quote really appears in the text and drops any that do not. A Claude flag can turn the tenant test into "possible FAIL, confirm with agent". It can never make a test PASS.

## SB 9 tests and where each comes from

| Test | Data | Rule source |
|---|---|---|
| Address → parcel polygon | Santa Ana Assessor Parcels | needed for every test |
| Single-family zone (R1, RE) | Santa Ana Zoning Classifications | HCD SB 9 Fact Sheet (Sept 2024) p.2; Gov. Code 65852.21(a), 66411.7(a)(3)(A) |
| Split into two lots ≥ 1,200 sq ft, neither < 40% | polygon area in State Plane feet (wkid 2230) | HCD fact sheet (April 2026) p.1 (1,200 sq ft, "roughly equal"). 40%: Gov. Code 66411.7(a)(1)(B), not stated in the fact sheets and **not verified** against statute text today |
| Special flood hazard area | FEMA NFHL, cross-checked with OC Floodplains | HCD fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K). Statute has exceptions |
| Very high fire hazard severity zone | OC FHSZ LRA (fallback CAL FIRE LRA 2011) | same |
| Historic property or district | Santa Ana Historic Resources layer (properties + districts) | HCD fact sheet (April 2026) p.3-4 (AB 1061) |
| Landslide zone (site risk only, does not change verdict) | CGS Landslide Zones | Not an SB 9 exclusion in the HCD fact sheets |
| Tenant in last 3 years | listing text read by Claude (possible FAIL only) | HCD fact sheet (April 2026) p.2-3 |
| Rent restriction, rent control, Ellis Act; prior SB 9 split; earthquake fault; wetlands, habitat, farmland, hazardous waste | **always UNKNOWN** in the MVP, each with a next step | HCD fact sheet (April 2026) p.2-3 |

**Max homes:** 4 if every counted test passes or is unknown (two lots, up to two units each: HCD fact sheet April 2026 p.2). 2 if only the lot-size test fails (two units without a split). 0 if any other test fails.

**Land cost per home** = asking price ÷ max homes. Labelled "land and building purchase per home, before construction".

## Sources and assumptions

| Item | Source or assumption | Date checked |
|---|---|---|
| SB 9 rules | [HCD Duplexes and Lot Splits fact sheet, April 2026](https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf); [HCD SB 9 Fact Sheet, Sept 2024](https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf) | 2026-11-07 |
| Parcels | [Santa Ana Assessor Parcels](https://gis.santa-ana.org/server/rest/services/Public/GIS_AssessorParcels/MapServer/0) | 2026-11-07 |
| Zoning | [Santa Ana Zoning Classifications](https://gis.santa-ana.org/server/rest/services/Public/PBA_ZoningClassifications/FeatureServer/0) | 2026-11-07 |
| Historic | [Santa Ana Historic Resources](https://gis.santa-ana.org/server/rest/services/Public/PBA_HistoricResource/FeatureServer) | 2026-11-07 |
| Flood | [FEMA NFHL layer 28](https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28); [OC Floodplains](https://www.ocgis.com/arcpub/rest/services/Map_Layers/Floodplains/MapServer/0) | 2026-11-07 |
| Fire | [OC FHSZ LRA](https://www.ocgis.com/arcpub/rest/services/Map_Layers/Fire_Hazard_Severity_Zones_LRA/MapServer/0); [CAL FIRE LRA 2011](https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/1) | 2026-11-07 |
| Building footprints | [OC Building Footprints](https://www.ocgis.com/arcpub/rest/services/Map_Layers/Building_Footprints/MapServer/0) | 2026-11-07 |
| Transit (parking) | [Caltrans High Quality Transit Areas](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHrailroad/CA_HQ_Transit_Areas/FeatureServer/0) | 2026-11-07 |
| Landslide | [CGS Landslide Zones](https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0) | 2026-11-07 |
| Recent SB 9 projects | [HCD Housing Element APR data](https://data.ca.gov/@california-department-of-housing-and-community-development/housing-element-annual-progress-report-apr-data-by-jurisdiction-and-year), matched on "SB 9 / SB9 / lot split" in project notes; only projects a city chose to label | 2026-11-07 |
| Cost examples in the fund calculator | **ASSUMPTION**: the brief's worked example per home ($85k time costs, $50k fees, $285k family price, $100k subsidies, $55k rent), offered as optional examples only | 2026-11-06 |
| Listings | 10 public Zillow / Redfin listings collected by hand by Jerry; link on each site page; no agent or seller names stored | 2026-11-07 |
| $360k land and building purchase per home | **ASSUMPTION**: the brief's worked example (`docs/background.md`), mock numbers, not a real deal | 2026-11-06 |
| RE zone counts as single-family | **ASSUMPTION**: zone description "Residential-Estate"; confirm in the Santa Ana zoning code | 2026-11-07 |
| Santa Ana is in an urbanized area (SB 9 applies to urbanized areas, fact sheet April 2026 p.1) | **ASSUMPTION**, not checked against Census data | 2026-11-07 |
| Split line | **ASSUMPTION**: a straight equal-area cut across the lot's long side. A sketch, not a surveyed parcel map | n/a |

## What is UNKNOWN and why

- **Tenant history (3 years):** no public data. Claude reads the listing for clues, but a listing can't prove there was no tenant. Ask the listing agent.
- **Rent restriction, rent control, Ellis Act withdrawal:** not in free parcel data. Ask the agent and the city housing division.
- **Prior SB 9 split, or an adjacent split by the same owner:** needs the parcel's map history. Ask the planning desk.
- **Earthquake fault zone:** the CGS seismic hazard service needed a token when tested. Check CGS EQ Zapp.
- **Wetlands, habitat, farmland, conservation easement, hazardous waste:** not checked. Check DTSC EnviroStor and the planning desk.
- **Historic:** we check Santa Ana's own list and districts. The State Historic Resources Inventory is not checked, so a clean city result still says UNKNOWN.
- **A1 "General Agricultural" zone:** HCD says agricultural zones are not SB 9 zones, but Santa Ana's A1 can hold ordinary houses. Shown as possible FAIL; ask the city.

## What is real and what is mocked

| Part | Status |
|---|---|
| Parcel lookup, lot area, zoning, flood, fire, historic, landslide checks | working, live government data |
| Split sketch and SVG | working; a sketch, not a survey |
| Claude listing reader | working; all 10 listings read on 2026-11-07 (1213 S Corta flagged: "DO NOT DISTURB TENANTS."). The live check reads listings only when `ANTHROPIC_API_KEY` is set in Vercel |
| Keep-the-house and no-parking flags | working; footprints may include attached garages, and transit areas are straight-line |
| Whole-city screen | working; a first screen using parcel centroids, not a verdict. Parcels that share one outline (condo or mobile-home units) are excluded |
| Listings | real public listings, collected by hand on 2026-11-07; prices can change |
| Ranking and land cost per home | working; uses asking price, not sale price |
| Site groups | working; the 0.5 mi radius is an ASSUMPTION |
| Local support | working on public data for Santa Ana only; 3 of 6 signals UNKNOWN; statuses are FourFold's reading (ASSUMPTION where a judgment) |
| Continual learning (outcomes) | code working and tested on made-up examples only; 0 real records, so nothing has been learned yet |
| One-screen app (3D, Map, Technical views) | working; the 3D and blueprint drawings use the same sketched split, not a survey |
| Other cities | not built; Santa Ana only |

## Where it gets things wrong

- Lot area comes from the city polygon. It can differ from the listing (sa-01: listing 10,001 sq ft, city polygon about 8,682).
- "Intersects" means any part of the parcel. A parcel that barely touches a flood zone gets FAIL; we pull the outline in 1 ft to avoid edge-touch errors, but a sliver can still count.
- Fire map vintage may predate CAL FIRE's 2025 LRA maps.
- Address matching is by text. Some city addresses differ from listings (Valencia St vs Ave, Fay Cir with no "W"). We use a looser match and show the APN so a person can confirm it.
- Six of the ten listing descriptions are the collector's summaries, not verbatim listing text. Quotes from those are labelled as coming from the summary.
- A FAIL does not cover statutory exceptions (for example a flood-zone site that meets FEMA requirements).
- The whole-city screen tests each parcel's center point, not its full outline, and cannot check tenants, rent control, prior splits, fault zones or environmental sites. 105 candidates have no address and 42 are over an acre (possibly parks or schools). Treat it as a list of lots worth a closer look, not a list of eligible lots.
- The county fire layer has no fire hazard zones inside Santa Ana, so fire never fails here. Other cities will differ.

## Next steps

- One more week: add Anaheim and Fullerton (their parcel and zoning services are listed in the lane data), a listing feed instead of hand collection, the CGS fault layer, the state historic inventory, and a one-click "questions for the listing agent" draft.
- Path to the next 100 projects: every check is a public ArcGIS service. A new city needs its parcel and zoning layer plus a list of its single-family zone codes, about an hour of work per city, then the same pipeline ranks every listing in it.

## Try it

Needs Node 20+.

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to turn on the listing reader
npm run precompute           # data/listings.json -> data/results.json (raw API responses cached in .cache/)
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run citywide` rebuilds the whole-city screen (`data/citywide.json`); `npm run probe` hits each endpoint once and prints the fields; `npx tsx scripts/one.ts "1209 S Townsend St"` checks one address in the terminal.

## Deploy

```bash
vercel --prod
```

The app reads `data/results.json` at build time, so pages load instantly. `/api/check` runs a live check; every external call has an 8 second timeout, and a failed call becomes UNKNOWN with the reason while the other checks still return. Set `ANTHROPIC_API_KEY` in the Vercel project's environment variables for the live listing reader.

## Data and privacy

This project uses only public data. It contains no personal information about real tenants, buyers, sellers or agents. It does not file applications or contact any city or person.

Prototype. Not legal or financial advice. Confirm with the city and a professional.

## License

MIT, see the LICENSE file.
