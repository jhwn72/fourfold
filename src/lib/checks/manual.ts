// SB 9 tests we cannot check from free public data in the MVP. Always UNKNOWN, each with a next step.
// The tenant test can be marked "possible FAIL" by the listing reader, never PASS.
import { CHECKED, SRC } from "../sources";
import type { CheckResult, ListingEvidence } from "../types";

const S9 = SRC.hcdSb9Short;

export function manualChecks(evidence: ListingEvidence): CheckResult[] {
  const at = new Date(CHECKED + "T12:00:00-08:00").toISOString();
  const mk = (id: string, test: string, rule: string, next: string, value = "Not checked: no free public data", note = ""): CheckResult => ({
    id, test, status: "UNKNOWN", value, source_name: S9.name, source_url: S9.url, checked_at: at, note, rule, next_step: next, affects_verdict: true,
  });

  const tenant = evidence.flags.find((f) => f.flag === "tenant_occupied" && f.present);
  const vacant = evidence.flags.find((f) => f.flag === "vacant" && f.present);
  const owner = evidence.flags.find((f) => f.flag === "owner_occupied" && f.present);
  let tValue = "Not checked: no public data on tenancy";
  let tNote = "Only the seller can confirm.";
  if (evidence.paused) {
    tValue = "Not checked: the AI listing reader is paused";
    tNote = "Claude's listing reader is paused in this archive. Try a sample listing to see a saved read. Only the seller can confirm tenancy.";
  } else if (tenant) {
    tValue = `Listing says: "${tenant.quote}"`;
    tNote = "Possible fail: the listing suggests a tenant. A tenant in the last 3 years rules out SB 9. Confirm with the agent.";
  } else if (vacant || owner) {
    const f = (vacant ?? owner)!;
    tValue = `Listing says: "${f.quote}"`;
    tNote = "No tenant mentioned, but a listing can't prove 3 years without one. Still UNKNOWN.";
  }

  return [
    {
      ...mk("tenant", "No tenant in the last 3 years", "HCD SB 9 fact sheet (April 2026) p.2-3; Gov. Code 65852.21(a)(3), 66411.7(a)(3)(D).", "Ask the listing agent for 3 years of occupancy history.", tValue, tNote),
      possible_fail: Boolean(tenant),
    },
    mk("rent_restricted", "No rent control, rent limits, or Ellis Act exit in 15 years", "HCD SB 9 fact sheet (April 2026) p.2-3.", "Ask the listing agent and the city housing division about covenants, rent control and Ellis Act history."),
    mk("prior_split", "No earlier SB 9 split here, or next door by the same owner", "HCD SB 9 fact sheet (April 2026) p.3; SB 9 Fact Sheet (Sept 2024) p.6.", "Ask the city planning desk for the parcel's map history."),
    mk("fault", "Not in an earthquake fault zone", "HCD SB 9 fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K).", "Check the state's EQ Zapp fault map (its data service needed a token when tested)."),
    mk("environment", "Not wetland, habitat, farmland, easement or toxic site", "HCD SB 9 fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K).", "Check DTSC EnviroStor and ask the city planning desk."),
  ];
}
