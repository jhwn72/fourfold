// Checks for src/lib/learning.ts. Run: npx tsx scripts/test-learning.ts
// Uses the MADE UP example (data/outcomes/examples) only through includeExamples.
import assert from "node:assert/strict";
import { loadOutcomes } from "../src/app/learn/load";
import { applyLearned, EMPTY_LEARNED, learn, learnedCostExamples, lessonsForListingReader, promotedQuestionsFor } from "../src/lib/learning";
import { validateOutcome } from "../src/lib/outcomes";
import type { CheckResult, SiteResult } from "../src/lib/types";

// Stand-in for sb9.ts decide: test only needs to see that it is called with the new checks.
const decide = (checks: CheckResult[]) => {
  const fail = checks.some((c) => c.affects_verdict && c.status === "FAIL");
  const possible = checks.some((c) => c.affects_verdict && c.possible_fail);
  return { verdict: (fail ? "NO" : possible ? "UNKNOWN" : "LIKELY YES") as SiteResult["verdict"], reason: "test", max_homes: 4, land_cost_per_home: null };
};
const chk = (id: string, status: CheckResult["status"], value: string, possible_fail = false): CheckResult => ({
  id, test: id, status, value, source_url: "", source_name: "", checked_at: "", note: "orig.", rule: "", affects_verdict: true, possible_fail,
});
const site = (city: string, zoning: CheckResult): SiteResult => ({
  id: "t", address: "test", city, asking_price: null, listing_source_url: "", date_collected: "", parcel: null,
  checks: [zoning, chk("tenant", "UNKNOWN", "Not checked")], verdict: "UNKNOWN", verdict_reason: "orig",
  max_homes: null, land_cost_per_home: null, split: null, listing_evidence: { status: "skipped", note: "", flags: [] }, unknown_count: 2, computed_at: "",
});

async function main() {
  // Real records: none today. Everything falls back.
  const real = await loadOutcomes();
  assert.equal(real.rejected.length, 0, JSON.stringify(real.rejected));
  assert.ok(real.records.every((r) => !r.is_example), "examples must not load without includeExamples");
  const lr = learn(real.records);
  if (real.records.length === 0) {
    assert.deepEqual(lr, EMPTY_LEARNED);
    assert.equal(lr.overrides.length, 0);
    assert.equal(lr.timeline.length, 0);
    assert.equal(learnedCostExamples(lr), null);
    assert.deepEqual(lessonsForListingReader(real.records), []);
    const s = site("Santa Ana", chk("zoning", "UNKNOWN", "A1 (General Agricultural)", true));
    assert.equal(applyLearned(s, lr, decide), s, "no records: result unchanged");
    assert.deepEqual(promotedQuestionsFor(s, lr), []);
  }

  // With the MADE UP example.
  const ex = await loadOutcomes({ includeExamples: true });
  assert.equal(ex.records.length, real.records.length + 1);
  const L = learn(ex.records.filter((r) => r.is_example));
  assert.equal(L.example_count, 1);

  const zc = L.calibration.find((c) => c.check_id === "zoning")!;
  assert.deepEqual([zc.confirmed, zc.corrected], [0, 1]);
  assert.equal(L.calibration.find((c) => c.check_id === "flood")!.confirmed, 1);

  assert.equal(L.overrides.length, 1, "site-scoped tenant correction must not become a city override");
  assert.equal(L.overrides[0].effect, "pass");
  assert.match(L.overrides[0].note, /^Learned from project example-made-up-1, 2026-02-10: /);

  // Override flips a possible FAIL in Santa Ana A1 ...
  const a1 = applyLearned(site("Santa Ana", chk("zoning", "UNKNOWN", "A1 (General Agricultural)", true)), L, decide);
  assert.equal(a1.checks[0].status, "PASS");
  assert.equal(a1.checks[0].possible_fail, false);
  assert.match(a1.checks[0].note, /Learned from project/);
  assert.equal(a1.unknown_count, 1);
  // ... but not another city, not another zone, and never a hard FAIL.
  const other = site("Irvine", chk("zoning", "UNKNOWN", "A1 (General Agricultural)", true));
  assert.equal(applyLearned(other, L, decide), other);
  assert.equal(applyLearned(site("Santa Ana", chk("zoning", "UNKNOWN", "SP2 (Specific plan)")), L, decide).checks[0].status, "UNKNOWN");
  const hard = applyLearned(site("Santa Ana", chk("zoning", "FAIL", "A1 (General Agricultural); C2")), L, decide);
  assert.equal(hard.checks[0].status, "FAIL");
  assert.match(hard.checks[0].note, /Learned from project/);

  // Note-only when not confirmed in writing.
  const weak = structuredClone(ex.records.find((r) => r.is_example)!);
  weak.corrections[0].city_confirmed_in_writing = false;
  const W = learn([weak]);
  assert.equal(W.overrides[0].effect, "note");
  assert.equal(applyLearned(site("Santa Ana", chk("zoning", "UNKNOWN", "A1 (x)", true)), W, decide).checks[0].status, "UNKNOWN");

  // Timelines: offer 2026-01-05 -> under contract 2026-01-20 = 15 days.
  assert.equal(L.timeline[0].from, "offer");
  assert.equal(L.timeline[0].median_days, 15);
  assert.equal(L.total_days, null, "not completed, so no total");

  // Costs: 1,000,000 / 4 homes = 250,000 per home. Examples never replace the fund calculator's ASSUMPTIONs.
  assert.equal(L.costs.find((c) => c.line === "purchase")!.median_per_home, 250000);
  assert.equal(learnedCostExamples(L), null);

  // Call sheet: tenant questions promoted for Santa Ana sites where tenant is open.
  const qs = promotedQuestionsFor(site("Santa Ana", chk("zoning", "PASS", "R1")), L);
  assert.ok(qs.length >= 2 && qs.every((q) => q.check_id === "tenant"));
  assert.equal(promotedQuestionsFor(site("Irvine", chk("zoning", "PASS", "R1")), L).length, 0);

  // Listing reader lessons.
  assert.equal(L.listing_lessons.length, 1);
  assert.match(L.listing_lessons[0], /"recently vacated" turned out to mean a tenant had lived there/);

  // Validator rejects bad records.
  assert.equal(validateOutcome({}).ok, false);
  const bad = structuredClone(weak);
  bad.stages.closed = "2025-01-01";
  assert.equal(validateOutcome(bad).ok, false, "stages out of order");
  const unlabeled = { ...structuredClone(weak), warning: "test" };
  assert.equal(validateOutcome(unlabeled).ok, false, "example without MADE UP warning");

  console.log(`test-learning: all checks passed (${real.records.length} real records, 1 MADE UP example).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
