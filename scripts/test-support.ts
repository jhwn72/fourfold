// Quick checks for src/lib/support.ts. Run: npx tsx scripts/test-support.ts
// Profiles below are made-up test inputs, not real organizations.
import assert from "node:assert/strict";
import { assessSupport, getCitySignals, isRecommended, EMPTY_PROFILE, type CitySignals, type OrgProfile } from "../src/lib/support";

const city = getCitySignals("Santa Ana");
assert.ok(city, "Santa Ana signals load");
assert.equal(getCitySignals(" santa ana ")?.city, "Santa Ana");
assert.equal(getCitySignals("Nowhere"), null);
for (const s of city!.signals) {
  assert.ok(s.source.url.startsWith("https://"), `${s.id} has a source URL`);
  assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/, `${s.id} has a checked date`);
}

// No profile: UNKNOWN, with steps, never recommended
let r = assessSupport(city, null);
assert.equal(r.level, "UNKNOWN");
assert.ok(r.steps.length > 0);
assert.ok(r.steps[0].includes("housing division"));
assert.equal(isRecommended("LIKELY YES", r.level), false);

// Empty profile (everything unknown): UNKNOWN
r = assessSupport(city, EMPTY_PROFILE);
assert.equal(r.level, "UNKNOWN");
assert.equal(r.answered, 0);

// All no: WEAK
const allNo: OrgProfile = { ...EMPTY_PROFILE, name: "Test Org", type: "nonprofit", housingDivision: "no", planning: "no", councilOffice: "no", communityMeeting: "no", lettersOfSupport: "no", localFunding: "no", boardInCity: "no" };
r = assessSupport(city, allNo);
assert.equal(r.level, "WEAK");
assert.equal(r.orgPoints, 0);
assert.equal(isRecommended("LIKELY YES", r.level), false);

// SOME: housing division (2) + planned meeting (1) = 3
const some: OrgProfile = { ...allNo, housingDivision: "yes", communityMeeting: "planned" };
r = assessSupport(city, some);
assert.equal(r.orgPoints, 3);
assert.equal(r.level, "SOME");
assert.equal(isRecommended("LIKELY YES", r.level), true);
assert.equal(isRecommended("UNKNOWN", r.level), false);
assert.equal(isRecommended("NO", r.level), false);
assert.ok(!r.steps.some((s) => s.startsWith("Meet the")), "no housing division step once met");

// STRONG: projects in city (2) + division (2) + letters (2) + funding (2) = 8
const strong: OrgProfile = { ...allNo, cities: "Anaheim, Santa Ana", housingDivision: "yes", lettersOfSupport: "yes", localFunding: "yes", localFundingAmount: "test" };
r = assessSupport(city, strong);
assert.equal(r.orgPoints, 8);
assert.equal(r.level, "STRONG");
assert.ok(r.reasons.some((x) => x.ref === "cities" && x.effect === "+"));

// City name match is exact per list item, not substring
r = assessSupport(city, { ...strong, cities: "Santa Ana Heights" });
assert.equal(r.orgPoints, 6);

// A NEGATIVE city signal lowers one step
const negCity: CitySignals = { ...city!, signals: [...city!.signals, { ...city!.signals[0], id: "neg", status: "NEGATIVE" }] };
assert.equal(assessSupport(negCity, strong).level, "SOME");
assert.equal(assessSupport(negCity, some).level, "WEAK");

// Every reason is tied to a signal or profile field
for (const x of assessSupport(city, strong).reasons) assert.ok(x.ref.length > 0);

// Unknown city: still works, says so
r = assessSupport(null, strong, "Irvine");
assert.ok(r.reasons.some((x) => x.text.includes("No public signals")));

console.log("test-support: all checks passed");
