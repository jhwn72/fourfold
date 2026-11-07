// Landslide zone (CGS Seismic Hazard Zones). Informational site risk only: landslide zones are not in the SB 9
// exclusion list as summarized by HCD (fact sheet April 2026 p.3), so this does not change the verdict.
// It matters for whether the site is buildable (lane brief, scenario F03).
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom, unknownFromError } from "./util";

export async function landslideCheck(parcel: Parcel): Promise<CheckResult> {
  const base = {
    id: "landslide",
    test: "Not in a CGS landslide zone (site risk, does not change the verdict)",
    source_name: SRC.cgsLandslide.name,
    source_url: SRC.cgsLandslide.url,
    rule: "Not an SB 9 exclusion in the HCD fact sheets. Shown as a buildability risk.",
    affects_verdict: false,
  };
  try {
    const res = await arcgisQuery(SRC.cgsLandslide.url, { ...polyGeom(shrinkRing(largestRing(parcel.rings))), outFields: "QUAD_NAME,RELEASED" });
    const hit = res.features.length > 0;
    return {
      ...base, status: hit ? "FAIL" : "PASS", checked_at: now(),
      value: hit ? `In landslide zone (${res.features.map((f) => `${f.attributes.QUAD_NAME} quad, released ${f.attributes.RELEASED}`).join("; ")})` : "Not in a mapped landslide zone",
      note: hit ? "Expect a geotechnical report and extra cost." : "No mapped landslide zone.",
      next_step: hit ? "Budget for a geotechnical report." : undefined,
    };
  } catch (e) {
    return unknownFromError(base, e, "Check the CGS EQ Zapp map for this address.");
  }
}
