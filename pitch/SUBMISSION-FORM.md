# Submission form answers (copy and paste)

Form: https://claudesocal.com/uci-impact-lab (#submit). Due 2:30 PM.

## Lane

```
1 Find it
```

## One-liner

```
FourFold helps small housing nonprofits find Orange County houses, for sale or off-market, that SB 9 lets them turn into four homes, with every test sourced and the next call drafted.
```

## The real user, before and after

```
A one-person acquisitions lead at a small housing nonprofit with no GIS team. Today, checking one listing for an SB 9 lot split means opening the parcel map, the zoning map, FEMA's flood map and the fire map, then reading the law, and most listings fail a test you only find at the end. Investors can't split a lot under SB 9 unless they promise to live there 3 years; nonprofits and community land trusts are exempt (HCD SB 9 fact sheet, April 2026, p.2), so this is an edge only they have.

After: one screen ranks the houses for sale in a city by verdict and cost per home, shows the real lot splitting into two lots with up to four homes, lists every test with its source and date, says UNKNOWN where public data can't answer, and drafts the next call and the offer letter.
```

## What it does

```
- Checks each site against SB 9's tests using public data: city and county parcel maps, city zoning (SCAG regional zoning elsewhere in OC), FEMA flood zones, CAL FIRE fire zones, Santa Ana's historic list, plus site notes (landslide, transit/no parking, whether the existing house can stay).
- Code decides every verdict. Claude only reads listing text for tenant or vacancy clues and must quote it; it can flag a possible problem but never pass a test.
- 10 verified Santa Ana listings (4 likely yes, 2 unknown, 4 no), 17 unverified leads in Anaheim and Fullerton, and 75 off-market lots to send offers to.
- Every parcel screened in 3 cities: 162,193 parcels, with 25,246 (Santa Ana), 36,051 (Anaheim) and 18,509 (Fullerton) passing a first screen.
- Groups: 16 dense areas where a nonprofit could buy and build across a whole neighborhood.
- For each site: the next call, a call sheet and draft emails, fund-the-gap calculator, local support check, a What's next roadmap (offer, due diligence, SB 9 filing with HCD's 30-day completeness and 60-day decision clocks), and a printable briefing.
- Live check for any Orange County address.
- Learns from real project outcomes as nonprofits record them (0 recorded so far).
```

## Sources and assumptions

```
Law: HCD Housing Law Fact Sheet, Duplexes and Lot Splits (SB 9), April 2026; HCD SB 9 Fact Sheet, Sept 2024 (Gov. Code 65852.21, 66411.7). Checked 2026-11-07.
Data (all checked 2026-11-07): City of Santa Ana parcels, zoning and historic resources; Anaheim PropertyInfo; Fullerton Parcels and HIOZ Sites (not confirmed as the city's official service); OC Public Works parcels, floodplains, fire hazard zones and building footprints; FEMA National Flood Hazard Layer; CAL FIRE fire hazard zones; CGS landslide zones; Caltrans High Quality Transit Areas; SCAG zoning; U.S. Census Geocoder; HCD Housing Element APR data (68 OC SB 9 projects); HCD housing element compliance and RHNA progress.
Listings: 10 public Santa Ana listings collected by hand 2026-11-07; 17 Anaheim/Fullerton leads from web search, price and status unverified.
Assumptions (marked * in the app, listed in the README): the brief's $360k per home worked example; a 0.5 mile radius for listing groups; a density threshold for areas; "up to N homes" in areas as an upper bound (lots x 4); RE (Santa Ana) and some Anaheim/Fullerton zone codes counted as single-family; SCAG zone codes outside those cities; Santa Ana counted as an urbanized area; the sketched split line (not a survey); the 40% minimum lot share (statute, not verified against the text today); fund-the-gap example costs from the brief.
```

## Public repo URL

```
https://github.com/jhwn72/fourfold
```

## Live demo URL

```
https://fourfold-splitter.vercel.app
```

## Video

Upload the MP4 or MOV on the form (up to 2 minutes). Say in the form or video that Claude built the app and wrote the script.
