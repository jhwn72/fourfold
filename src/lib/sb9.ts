// SB 9 rules, verdict, max homes and land cost per home.
// Code decides eligibility from government data. The listing reader (Claude) can only mark a test
// "possible FAIL, confirm with agent"; it can never make a test PASS.
//
// Sources (checked 2026-11-07):
// - HCD Housing Law Fact Sheet, Duplexes and Lot Splits (SB 9), April 2026:
//   https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf
//   p.1 two 1,200 sq ft lots; p.2 up to two units on each resulting lot; p.2 owner-occupancy affidavit does
//   not apply to a community land trust or nonprofit; p.2-3 exceptions (tenant, rent control, historic,
//   65913.4(a)(6)(B)-(K) sites, prior split).
// - HCD SB 9 Fact Sheet, September 2024: https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf
//   p.2 single-family zones only; p.7 up to four units with a lot split.
import { fireCheck } from "./checks/fire";
import { footprintCheck } from "./checks/footprint";
import { transitCheck } from "./checks/transit";
import { floodCheck } from "./checks/flood";
import { historicCheck } from "./checks/historic";
import { landslideCheck } from "./checks/landslide";
import { lotSplitCheck } from "./checks/lot-split";
import { manualChecks } from "./checks/manual";
import { findParcel } from "./checks/parcel";
import { zoningCheck } from "./checks/zoning";
import { now, unknownFromError } from "./checks/util";
import { SRC } from "./sources";
import type { CheckResult, ListingEvidence, SiteResult, Verdict } from "./types";

export { BRIEF_LAND_PER_HOME } from "./constants";

export const NO_EVIDENCE: ListingEvidence = { status: "skipped", note: "No listing description to read.", flags: [] };

export type ListingInput = {
  id: string;
  address: string;
  city: string;
  asking_price: number | null;
  description?: string;
  source_url?: string;
  date_collected?: string;
};

const LIVE_IDS = ["zoning", "lot_split", "flood", "fire"];

// Short plain-language labels for verdict reasons.
const FAIL_LABEL: Record<string, string> = {
  parcel: "address not found",
  zoning: "not a single-family zone",
  lot_split: "lot too small to split",
  flood: "in a FEMA high-risk flood zone",
  fire: "in a very high fire risk zone",
  historic: "listed historic resource",
  tenant: "listing suggests a tenant",
};
const label = (c: CheckResult) => FAIL_LABEL[c.id] ?? c.test.toLowerCase();

export function decide(checks: CheckResult[], hasParcel: boolean, price: number | null) {
  let verdict: Verdict;
  let reason: string;
  const counted = checks.filter((c) => c.affects_verdict);
  const fails = counted.filter((c) => c.status === "FAIL");
  const possible = counted.filter((c) => c.possible_fail);
  const liveUnknown = counted.filter((c) => LIVE_IDS.includes(c.id) && c.status === "UNKNOWN");
  const confirmLater = counted.filter((c) => c.status === "UNKNOWN" && !LIVE_IDS.includes(c.id));

  if (!hasParcel) {
    verdict = "UNKNOWN";
    reason = "Could not find this address in the Santa Ana parcel data.";
  } else if (fails.length) {
    verdict = "NO";
    reason = "Fails: " + fails.map((c) => `${label(c)}, ${c.value}`).join("; ") + ".";
  } else if (possible.length) {
    verdict = "UNKNOWN";
    reason = "Possible fail, confirm: " + possible.map(label).join("; ") + ".";
  } else if (liveUnknown.length) {
    verdict = "UNKNOWN";
    reason = "Could not check: " + liveUnknown.map((c) => c.test.toLowerCase()).join("; ") + ".";
  } else {
    verdict = "LIKELY YES";
    reason = `Passes zoning, lot size, flood and fire on public data. ${confirmLater.length} open questions.`;
  }

  // Max homes: SB 9 lot split gives 2 lots with up to 2 units each (fact sheet April 2026 p.2).
  // If the only failure is lot size, SB 9 can still allow up to 2 units on the unsplit lot.
  let max_homes: number | null = null;
  if (hasParcel) {
    const nonSplitFails = fails.filter((c) => c.id !== "lot_split");
    const splitFail = fails.some((c) => c.id === "lot_split");
    max_homes = nonSplitFails.length ? 0 : splitFail ? 2 : 4;
  }
  const land_cost_per_home = price && max_homes ? Math.round(price / max_homes) : null;
  return { verdict, reason, max_homes, land_cost_per_home };
}

export async function checkSite(input: ListingInput, evidence: ListingEvidence = NO_EVIDENCE): Promise<SiteResult> {
  let parcelCheck: CheckResult;
  let found: Awaited<ReturnType<typeof findParcel>> = { parcel: null, note: "" };
  const pBase = {
    id: "parcel", test: "Address matches a Santa Ana parcel", source_name: SRC.saParcels.name, source_url: SRC.saParcels.url,
    rule: "Needed to run every other test.", affects_verdict: true,
  };
  try {
    found = await findParcel(input.address);
    parcelCheck = found.parcel
      ? { ...pBase, status: "PASS", value: `APN ${found.parcel.apn}, ${found.parcel.site_address}`, checked_at: now(), note: found.note }
      : { ...pBase, status: "UNKNOWN", value: "No match", checked_at: now(), note: found.note, next_step: "Check the address spelling, or look up the APN on the county parcel map." };
  } catch (e) {
    parcelCheck = unknownFromError(pBase, e, "Retry in a minute.");
  }

  const checks: CheckResult[] = [parcelCheck];
  let split = null;
  let buildings: number[][][] = [];
  let keep_house: SiteResult["keep_house"] = "unknown";
  if (found.parcel) {
    const p = found.parcel;
    const ls = lotSplitCheck(p);
    split = ls.split;
    const [zoning, flood, fire, historic, landslide, parking, fp] = await Promise.all([
      zoningCheck(p), floodCheck(p), fireCheck(p), historicCheck(p), landslideCheck(p), transitCheck(p), footprintCheck(p, ls.split),
    ]);
    buildings = fp.buildings;
    if (ls.check.status === "PASS") split = fp.split;
    keep_house = fp.keep;
    checks.push(zoning, ls.check, flood, fire, historic);
    checks.push(...manualChecks(evidence));
    checks.push(fp.check, parking, landslide);
  } else {
    checks.push(...manualChecks(evidence));
  }

  const d = decide(checks, Boolean(found.parcel), input.asking_price);
  return {
    id: input.id,
    address: input.address,
    city: input.city,
    asking_price: input.asking_price,
    listing_source_url: input.source_url ?? "",
    date_collected: input.date_collected ?? "",
    parcel: found.parcel,
    checks,
    verdict: d.verdict,
    verdict_reason: d.reason,
    max_homes: d.max_homes,
    land_cost_per_home: d.land_cost_per_home,
    split,
    buildings,
    keep_house,
    listing_evidence: evidence,
    unknown_count: checks.filter((c) => c.status === "UNKNOWN").length,
    computed_at: now(),
  };
}

/** Ranking: LIKELY YES first, then land cost per home ascending (unknown price last), then fewest UNKNOWNs. */
export function rank(results: SiteResult[]): SiteResult[] {
  const order: Record<Verdict, number> = { "LIKELY YES": 0, UNKNOWN: 1, NO: 2 };
  return [...results].sort(
    (a, b) =>
      order[a.verdict] - order[b.verdict] ||
      (a.land_cost_per_home ?? Infinity) - (b.land_cost_per_home ?? Infinity) ||
      a.unknown_count - b.unknown_count
  );
}
