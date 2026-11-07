// Very high fire hazard severity zone. OC county copy of the CAL FIRE LRA map first, CAL FIRE statewide LRA
// (2011) layer as a fallback. Vintage caveat: CAL FIRE published newer LRA maps effective 2025; the newer
// download was UNVERIFIED in the event data list, so these layers may be out of date.
// Rule: HCD SB 9 fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K). HCD's Sept 2024 letter to Laguna
// Beach (fact sheet p.3) says that city misapplied the fire and fault exclusions, so a FAIL needs confirming.
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom, unknownFromError } from "./util";

export async function fireCheck(parcel: Parcel): Promise<CheckResult> {
  const ring = shrinkRing(largestRing(parcel.rings));
  const base = {
    id: "fire",
    test: "Not in a very high fire hazard severity zone",
    rule: "HCD SB 9 fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K) via 65852.21(a)(2), 66411.7(a)(3)(C).",
    affects_verdict: true,
  };
  const caveat = " Map vintage may predate CAL FIRE's 2025 LRA maps.";
  for (const src of [SRC.ocFire, SRC.calFireLra]) {
    try {
      const res = await arcgisQuery(src.url, { ...polyGeom(ring), outFields: "*" });
      const classes = [...new Set(res.features.map((f) => String(f.attributes.HAZ_CLASS ?? f.attributes.HAZ_CODE ?? "zone")))];
      const vh = classes.some((c) => /very high/i.test(c) || c === "3");
      return {
        ...base, status: vh ? "FAIL" : "PASS", checked_at: now(),
        value: classes.length ? classes.join(", ") : "Not in a mapped LRA fire hazard zone",
        source_name: src.name, source_url: src.url,
        note: (vh ? "In a very high fire hazard severity zone. Statute has narrow exceptions." : "Not in a very high fire hazard severity zone.") + caveat,
        next_step: vh ? "Confirm with the city fire marshal; check CAL FIRE's 2025 LRA map." : undefined,
      };
    } catch (e) {
      if (src === SRC.calFireLra) return unknownFromError({ ...base, source_name: src.name, source_url: src.url }, e, "Check CAL FIRE's fire hazard map for this address.");
    }
  }
  throw new Error("unreachable");
}
