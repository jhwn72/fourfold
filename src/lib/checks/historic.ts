// Historic resource. City of Santa Ana Historic Properties (points with APN and category) and Historic Districts.
// Rule: HCD SB 9 fact sheet (April 2026) p.3: SB 9 does not apply to a contributing structure in a historic
// district, a resource on the State Historic Resource Inventory, or a historic property, district or landmark
// under a local ordinance (AB 1061, 2025, p.4). We do not check the State inventory, so a clean result stays UNKNOWN.
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom, unknownFromError } from "./util";

export async function historicCheck(parcel: Parcel): Promise<CheckResult> {
  const base = {
    id: "historic",
    test: "Not historic (landmark, listed, or district contributor)",
    source_name: `${SRC.saHistoricProps.name}; ${SRC.saHistoricDistricts.name}`,
    source_url: SRC.saHistoricProps.url,
    rule: "HCD SB 9 fact sheet (April 2026) p.3-4, as amended by AB 1061 (2025). Gov. Code 65852.21, 66411.7.",
    affects_verdict: true,
  };
  try {
    const ring = shrinkRing(largestRing(parcel.rings));
    const [props, districts] = await Promise.all([
      arcgisQuery(SRC.saHistoricProps.url, { ...polyGeom(ring), outFields: "CATEGORY,ADDRESS,HISTORIC_NAME,APN" }),
      arcgisQuery(SRC.saHistoricDistricts.url, { ...polyGeom(ring), outFields: "DISTRICTNAME" }),
    ]);
    const byApn = parcel.apn !== "UNKNOWN"
      ? await arcgisQuery(SRC.saHistoricProps.url, { where: `APN='${parcel.apn.replace(/'/g, "''")}'`, outFields: "CATEGORY,ADDRESS,HISTORIC_NAME,APN", returnGeometry: false })
      : { features: [] };
    const listed = [...props.features, ...byApn.features];
    const district = districts.features.map((f) => String(f.attributes.DISTRICTNAME));
    if (listed.length) {
      const a = listed[0].attributes;
      const cat = String(a.CATEGORY ?? "");
      const named = /landmark|key|contribut/i.test(cat);
      return {
        ...base, status: named ? "FAIL" : "UNKNOWN", possible_fail: !named, checked_at: now(),
        value: `On Santa Ana historic list: category "${cat}"${a.HISTORIC_NAME ? `, ${a.HISTORIC_NAME}` : ""}${district.length ? `; in ${district.join(", ")}` : ""}`,
        note: named ? "Listed as a local historic resource. SB 9 does not apply." : "Listed with an unclear category. Possible FAIL.",
        next_step: "Call the Santa Ana planning desk (historic preservation) to confirm the listing.",
      };
    }
    if (district.length) {
      return {
        ...base, status: "UNKNOWN", checked_at: now(),
        possible_fail: true,
        value: `Inside ${district.join(", ")}`,
        note: "Possible FAIL: inside a historic district. Excluded if the house is a contributing structure.",
        next_step: "Ask the Santa Ana planning desk whether the house is a contributing structure.",
      };
    }
    return {
      ...base, status: "UNKNOWN", checked_at: now(),
      value: "Not on the city historic list or in a city district",
      note: "State inventory not checked.",
      next_step: "Ask the city planning desk to confirm no state or local historic listing.",
    };
  } catch (e) {
    return unknownFromError(base, e, "Call the Santa Ana planning desk to confirm historic status.");
  }
}
