// Regression checks for the multi-city change. Run: npx tsx scripts/test-multicity.ts
// 1. Santa Ana: rerun every check for each site in data/results.json (cached GIS responses, the stored
//    listing evidence, no Claude call) and assert the verdict and every check match, ignoring timestamps.
// 2. Leads: every lead in data/leads.json and data/leads-results.json has asking_price null.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "fs";
import type { SiteResult } from "../src/lib/types";

process.env.FOURFOLD_CACHE = "1";

const strip = (v: unknown): unknown => JSON.parse(JSON.stringify(v, (k, x) => (k === "checked_at" || k === "computed_at" ? undefined : x)));

async function main() {
  const { checkSite, decide } = await import("../src/lib/sb9");
  const { applyLearned, learn } = await import("../src/lib/learning");
  const { loadOutcomes } = await import("../src/app/learn/load");
  const learned = learn((await loadOutcomes()).records);
  const saved: SiteResult[] = JSON.parse(readFileSync("data/results.json", "utf8")).results;
  let n = 0;
  for (const old of saved) {
    const input = { id: old.id, address: old.address, city: old.city, asking_price: old.asking_price, source_url: old.listing_source_url, date_collected: old.date_collected };
    const r = applyLearned(await checkSite(input, old.listing_evidence), learned, decide);
    assert.equal(r.verdict, old.verdict, `${old.id} verdict`);
    assert.equal(r.verdict_reason, old.verdict_reason, `${old.id} reason`);
    assert.equal(r.max_homes, old.max_homes, `${old.id} max_homes`);
    assert.deepEqual(strip(r.checks), strip(old.checks), `${old.id} checks`);
    assert.deepEqual(r.parcel, old.parcel, `${old.id} parcel`);
    n++;
  }
  console.log(`Santa Ana: ${n} sites unchanged (verdicts, checks, parcels).`);

  const leads = JSON.parse(readFileSync("data/leads.json", "utf8")).leads as { id: string; asking_price: unknown }[];
  for (const l of leads) assert.equal(l.asking_price, null, `${l.id} asking_price must be null`);
  if (existsSync("data/leads-results.json")) {
    const lr = JSON.parse(readFileSync("data/leads-results.json", "utf8")).results as SiteResult[];
    for (const r of lr) { assert.equal(r.asking_price, null, `${r.id} asking_price`); assert.equal(r.land_cost_per_home, null); }
    assert.equal(lr.length, leads.length);
  }
  console.log(`Leads: ${leads.length} leads, all asking_price null.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
