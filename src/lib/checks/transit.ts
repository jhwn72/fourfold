// No-parking flag. HCD fact sheet (April 2026) p.1: a city may require up to one parking space per unit,
// "except no parking can be required if the parcel is within one-half mile walking distance of either a
// high-quality transit corridor or a major transit stop, or within a block of a car-share vehicle."
// Data: Caltrans High Quality Transit Areas. These are straight-line areas, not walking distance, so a hit is "likely".
// Informational: does not change the verdict.
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom, unknownFromError } from "./util";

export async function transitCheck(parcel: Parcel): Promise<CheckResult> {
  const base = {
    id: "parking",
    test: "No parking can be required: near high-quality transit (bonus, does not change the verdict)",
    source_name: SRC.hqta.name,
    source_url: SRC.hqta.url,
    rule: "HCD SB 9 fact sheet (April 2026) p.1: no parking within 1/2 mile walking distance of a high-quality transit corridor or major transit stop.",
    affects_verdict: false,
  };
  try {
    const res = await arcgisQuery(SRC.hqta.url, { ...polyGeom(shrinkRing(largestRing(parcel.rings))), outFields: "agency_primary,hqta_type,route_id" });
    if (res.features.length) {
      const a = res.features[0].attributes;
      return {
        ...base, status: "PASS", checked_at: now(),
        value: `In a high-quality transit area (${a.agency_primary}${a.route_id ? `, route ${a.route_id}` : ""}; ${String(a.hqta_type).replace(/_/g, " ")})`,
        note: "Likely no parking can be required, which frees lot space for homes. Caltrans areas are straight-line, not walking distance, so confirm with the city.",
      };
    }
    return {
      ...base, status: "FAIL", checked_at: now(), value: "Not in a mapped high-quality transit area",
      note: "The city may require up to 1 parking space per unit. A car-share vehicle within a block would also remove it (not checked).",
    };
  } catch (e) {
    return unknownFromError(base, e, "Ask the city whether parking can be required.");
  }
}
