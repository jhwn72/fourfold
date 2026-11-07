# Listings check (Jerry's 10 Santa Ana listings)

Checked 2026-11-07 against:

- City of Santa Ana Assessor Parcels: https://gis.santa-ana.org/server/rest/services/Public/GIS_AssessorParcels/MapServer/0 (SiteAddress, AssessmentNo, SiteZip5, Shape.STArea() in sq ft)
- OC Parcels (bedroom count, year built): https://www.ocgis.com/arcpub/rest/services/Map_Layers/Parcels/FeatureServer/0

Zillow and Redfin pages were not fetched. Listing facts below are as Jerry entered them.
"Gap" = (listed lot − parcel polygon area) / parcel area. Flag threshold: over 10%.

| id | address (listing) | APN | city SiteAddress | parcel sq ft | listed sq ft | gap | beds listing / OC | issues |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sa-01 | 4202 W Fay Cir | 198-331-18 | 4202 FAY CIR | 8,682 | 10,001 | **+15.2%** | not stated / 4 | Lot gap over 10%. City layer has no "W"; exact match fails, app's looser match finds it. Partly in FEMA flood zone A (app check). |
| sa-02 | 617 S Corwin Ct | 144-283-01 | 617 S CORWIN CT | 6,935 | 7,104 | +2.4% | 3 / 3 | Clean |
| sa-03 | 1629 S Townsend St | 408-243-12 | 1629 S TOWNSEND ST | 6,001 | 6,500 | +8.3% | 2 / 2 | Gap under threshold but notable; 6,500 may be rounded |
| sa-04 | 1209 S Townsend St | 109-453-19 | 1209 S TOWNSEND ST | 6,499 | 6,500 | 0.0% | 3 / 3 | Clean |
| sa-05 | 927 S Laurel St | 144-372-04 | 927 S LAUREL ST | 6,080 | 6,084 | +0.1% | 3 / **4** | Bedroom count differs from county record |
| sa-06 | 1213 S Corta Dr | 108-384-06 | 1213 S CORTA DR | 6,579 | 6,578 | 0.0% | not stated / 3 | Clean data. Excerpt says tenant-occupied (SB 9 tenant check likely fails) |
| sa-07 | 5510 Roosevelt Ave | 099-212-03 | 5510 ROOSEVELT AVE | 6,446 | 6,439 | −0.1% | 3 / **1** | Bedroom count differs (county 1, built 1937; listing says renovated). County address is "5510 W ROOSEVELT ST" |
| sa-08 | 1217 S Huron Dr | 109-691-15 | 1217 S HURON DR | 6,098 | 6,060 | −0.6% | 4 / 4 | Clean |
| sa-09 | 408 N Jackson St | 198-241-02 | 408 N JACKSON ST | 7,430 | 7,505 | +1.0% | not stated / 2 | Excerpt "2 HOUSE ON A LOT" is ambiguous; number of existing units UNKNOWN |
| sa-10 | 2121 Valencia St | 003-131-15 | 2121 VALENCIA AVE | 7,433 | 7,438 | +0.1% | 3 / 3 | Street suffix: city layer AVE, county "N VALENCIA ST", listing St. App's looser match finds the one parcel |

Every address matched exactly one parcel. Every source_url ZIP matches the parcel's SiteZip5.

## JSON checks

- All required fields present; ids unique; prices and lot sizes positive numbers; dates valid ISO (2026-11-07); city is Santa Ana; URLs are well-formed https Zillow/Redfin links.
- No agent, seller or tenant names, phone numbers or emails found. Nothing stripped.
- `description` kept exactly as given. Added `description_type`: "excerpt+summary" (sa-02, 05, 06, 09) or "summary" (the other 6).

## Honesty note on descriptions

Only text after "Listing excerpt:" looks like a direct quote from the listing. "Listing summary:" text and lines like "Description does not establish occupancy" are Jerry's paraphrase. Any phrase the app shows as an "exact quote" from a summary-only listing would be quoting Jerry, not the listing. The app should only quote from the excerpt part, or label summary quotes as "collector's summary".

## Questions for Jerry

1. sa-01 (4202 W Fay Cir): the listing says 10,001 sq ft lot; the city parcel map shows about 8,682. Can you re-check the lot size on the listing?
2. sa-01: can you copy one exact sentence from the listing description? Right now it's only a summary.
3. sa-05 (927 S Laurel St): listing says 3 bedrooms, county record says 4. Which does the listing show?
4. sa-07 (5510 Roosevelt Ave): listing says 3 bedrooms, county record says 1. Does the listing mention an addition or conversion?
5. sa-09 (408 N Jackson St): does "2 HOUSE ON A LOT" mean two homes exist now, or one home plus approved ADU plans? Any exact wording on that?
6. sa-10 (2121 Valencia St): city records list it as Valencia Ave. Is the listing really "St"?
7. sa-03, 04, 07, 08, 10: can you grab one short exact sentence from each listing description (especially anything about occupancy or tenants)? These are summary-only right now.
