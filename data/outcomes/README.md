# Project outcomes

This folder holds **real project records only**: one JSON file per project that an organization actually
pursued using FourFold. FourFold learns from them (`src/lib/learning.ts`) the next time `npm run precompute`
runs and the site is rebuilt.

As of 2026-11-07 there are **0 real records**. FourFold is using public data and the brief's assumptions only.

`examples/` holds MADE UP files for testing (`"is_example": true`). The learning code ignores them unless a
test or the labelled demo toggle on `/learn` asks for them. Never put a real project in `examples/`, and never
put a made-up project in this folder.

## How to add a record

1. Fill the form at `/learn` ("Record an outcome"). It runs in your browser only and sends nothing.
2. Download the JSON, name it `<project_id>.json`, and add it here by pull request (or send it to the FourFold maintainer).
3. Run `npx tsx scripts/test-learning.ts` to check it validates.

## Format (schema_version 1, validated by `validateOutcome` in `src/lib/outcomes.ts`)

| Field | What it is |
| --- | --- |
| `project_id` | lowercase-dashes id, unique |
| `site` | `address`, `city`, optional `site_id` (FourFold id) and `apn` |
| `org` | optional organization name |
| `recorded_at` | date you wrote the record (YYYY-MM-DD) |
| `stages` | dates for any of: `offer`, `under_contract`, `closed`, `application_submitted`, `deemed_complete`, `decision`, `permits_issued`, `construction_start`, `completed`. Must run in order. |
| `decision` | `approved` or `denied` (needs `stages.decision`) |
| `outcome` | `approved`, `denied`, `withdrawn` or `in_progress` |
| `checks_confirmed` | check ids FourFold got right |
| `corrections` | one per check FourFold got wrong: `check_id`, `fourfold_said` (PASS, FAIL, UNKNOWN, possible FAIL), `reality` (plain words), `reality_status` (PASS or FAIL), `scope` (`site` or `city`), `objective`, `city_confirmed_in_writing`, optional `applies_when_value_contains` (e.g. `A1`), `listing_phrase`, `question_that_caught_it`, `evidence_source`, `date` |
| `went_right`, `went_wrong` | short lines; a `went_wrong` item may name a `check_id` and the `question_that_would_have_caught_it` |
| `actual_costs` | actual totals for `purchase`, `construction`, `time`, `fees` (null if unknown) |
| `homes_delivered` | homes actually delivered (null if not yet) |
| `source` | where these facts come from (the org's files, a city letter, a recorded document) |
| `notes` | anything else |

Check ids: parcel, zoning, lot_split, flood, fire, historic, tenant, rent_restricted, prior_split, fault,
environment, existing_house, parking, landslide.

## What FourFold learns, and the limits

- **Calibration**: how often each check was confirmed vs corrected.
- **Rule overrides**: a `city`-scoped correction adds a note to that check for sites in that city. It turns a
  possible FAIL into PASS only when `objective` and `city_confirmed_in_writing` are both true and
  `reality_status` is PASS. It never overturns a hard FAIL. Site-scoped corrections never change other sites.
- **Timelines**: median days per stage, shown next to the HCD APR comparables.
- **Costs**: median actual cost per delivered home replaces the brief's ASSUMPTION examples in the fund
  calculator only when real records with `homes_delivered` exist.
- **Call sheet**: questions that caught a problem go to the top of the call sheet for open checks in the same city.
- **Listing reader**: `listing_phrase` on tenant corrections becomes a one-line lesson in the reader's prompt.

## Do not include

No personal information about tenants, buyers, residents or applicants (names, phone numbers, emails,
incomes, unit numbers of a person). Describe facts ("a tenant lived there in 2025"), not people. No secrets.
