// Special flood hazard area. FEMA NFHL first, OC Floodplains (county copy) as a cross-check and fallback.
// Rule: HCD SB 9 fact sheet (April 2026) p.3 and SB 9 Fact Sheet (Sept 2024) p.5: SB 9 does not apply to sites
// listed in Gov. Code 65913.4(a)(6)(B)-(K), which includes flood risk areas. The statute has exceptions
// (for example a site that meets FEMA floodplain requirements), so a FAIL here means "excluded unless an
// exception applies".
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom } from "./util";

type Zones = { zones: string[]; sfha: boolean };

async function query(url: string, ring: number[][], retries: number): Promise<Zones> {
  const res = await arcgisQuery(url, { ...polyGeom(ring), outFields: "FLD_ZONE,SFHA_TF,ZONE_SUBTY" }, { retries });
  const zones = [...new Set(res.features.map((f) => `${f.attributes.FLD_ZONE}${f.attributes.ZONE_SUBTY && String(f.attributes.ZONE_SUBTY).trim() ? ` (${String(f.attributes.ZONE_SUBTY).trim().toLowerCase()})` : ""}`))];
  return { zones, sfha: res.features.some((f) => f.attributes.SFHA_TF === "T") };
}

export async function floodCheck(parcel: Parcel): Promise<CheckResult> {
  const ring = shrinkRing(largestRing(parcel.rings));
  const [fema, oc] = await Promise.allSettled([query(SRC.fema.url, ring, 1), query(SRC.ocFlood.url, ring, 0)]);
  const base = {
    id: "flood",
    test: "Not in a FEMA high-risk flood zone",
    rule: "HCD SB 9 fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K) via 65852.21(a)(2), 66411.7(a)(3)(C). Exceptions exist in statute.",
    affects_verdict: true,
  };
  const describe = (z: Zones) => (z.zones.length ? z.zones.join(", ") : "no mapped flood zone");
  const verdictOf = (z: Zones) => (z.sfha ? "FAIL" : "PASS") as "FAIL" | "PASS";

  if (fema.status === "fulfilled" && oc.status === "fulfilled") {
    if (fema.value.sfha !== oc.value.sfha) {
      return {
        ...base, status: "UNKNOWN", checked_at: now(),
        value: `FEMA: ${describe(fema.value)}; OC copy: ${describe(oc.value)}`,
        source_name: `${SRC.fema.name}; ${SRC.ocFlood.name}`, source_url: SRC.fema.url,
        note: "FEMA and the county copy disagree. Showing both instead of picking one.",
        next_step: "Check the FEMA Flood Map Service Center for this address.",
      };
    }
    return {
      ...base, status: verdictOf(fema.value), checked_at: now(),
      value: `FEMA: ${describe(fema.value)}`,
      source_name: SRC.fema.name, source_url: SRC.fema.url,
      note: (fema.value.sfha ? "Part of the parcel is in a high-risk flood zone. Out unless a statutory exception applies." : "Not in a high-risk flood zone.") + " County copy agrees.",
      next_step: fema.value.sfha ? "Ask a civil engineer whether the site can meet FEMA floodplain requirements." : undefined,
    };
  }
  if (fema.status === "fulfilled" || oc.status === "fulfilled") {
    const ok = (fema.status === "fulfilled" ? fema.value : (oc as PromiseFulfilledResult<Zones>).value);
    const usedFema = fema.status === "fulfilled";
    const failed = usedFema ? oc : fema;
    return {
      ...base, status: verdictOf(ok), checked_at: now(),
      value: `${usedFema ? "FEMA" : "OC copy"}: ${describe(ok)}`,
      source_name: usedFema ? SRC.fema.name : SRC.ocFlood.name, source_url: usedFema ? SRC.fema.url : SRC.ocFlood.url,
      note: `${usedFema ? "County copy" : "FEMA"} did not respond (${(failed as PromiseRejectedResult).reason?.message ?? "error"}), so this uses one source only.`,
      next_step: ok.sfha ? "Ask a civil engineer whether the site can meet FEMA floodplain requirements." : undefined,
    };
  }
  return {
    ...base, status: "UNKNOWN", checked_at: now(), value: "Could not reach the data source",
    source_name: SRC.fema.name, source_url: SRC.fema.url,
    note: `FEMA: ${(fema as PromiseRejectedResult).reason?.message}. OC copy: ${(oc as PromiseRejectedResult).reason?.message}.`,
    next_step: "Retry, or check the FEMA Flood Map Service Center for this address.",
  };
}
