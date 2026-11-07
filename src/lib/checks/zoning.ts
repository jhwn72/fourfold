// Single-family residential zoning, from the City of Santa Ana zoning layer.
// Rule: HCD SB 9 Fact Sheet (Sept 2024) p.2, "Single-Family Residential Zones Only"
// (Gov. Code 65852.21(a); 66411.7(a)(3)(A)). Multifamily, commercial, agricultural and mixed-use zones
// are not subject to SB 9 even if they allow single-family homes.
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom, unknownFromError } from "./util";

// Santa Ana zone classes whose description is single-family (from the layer's ZONEDESC values, 2026-11-07):
// R1 "Single-Family Residence", RE "Residential-Estate". ASSUMPTION: RE's primary purpose is single-family;
// confirm in the Santa Ana zoning code.
const SINGLE_FAMILY = new Set(["R1", "RE"]);

export async function zoningCheck(parcel: Parcel): Promise<CheckResult> {
  const base = {
    id: "zoning",
    test: "Single-family residential zone",
    source_name: SRC.saZoning.name,
    source_url: SRC.saZoning.url,
    rule: "HCD SB 9 Fact Sheet (Sept 2024) p.2: single-family residential zones only. Gov. Code 65852.21(a), 66411.7(a)(3)(A).",
    affects_verdict: true,
  };
  try {
    const res = await arcgisQuery(SRC.saZoning.url, {
      ...polyGeom(shrinkRing(largestRing(parcel.rings))),
      outFields: "ZONECLASS,ZONEDESC,ZONEOVERLAY",
    });
    const zones = res.features.map((f) => ({
      cls: String(f.attributes.ZONECLASS ?? ""),
      desc: String(f.attributes.ZONEDESC ?? ""),
      overlay: f.attributes.ZONEOVERLAY ? String(f.attributes.ZONEOVERLAY) : null,
    }));
    const value = zones.length
      ? zones.map((z) => `${z.cls} (${z.desc})${z.overlay ? `, overlay ${z.overlay}` : ""}`).join("; ")
      : "No zoning polygon found";
    const overlayNote = zones.some((z) => z.overlay) ? " Parcel has a zoning overlay; ask the city how it applies." : "";
    if (!zones.length) {
      return { ...base, status: "UNKNOWN", value, checked_at: now(), note: "The zoning layer returned nothing for this parcel.", next_step: "Call the Santa Ana planning desk to confirm the zone." };
    }
    const allSf = zones.every((z) => SINGLE_FAMILY.has(z.cls));
    const anySf = zones.some((z) => SINGLE_FAMILY.has(z.cls));
    const specific = zones.some((z) => /^(SD|SP)/.test(z.cls));
    if (allSf) {
      return { ...base, status: "PASS", value, checked_at: now(), note: "Zoned single-family." + overlayNote + (zones.some((z) => z.cls === "RE") ? " RE treated as single-family (ASSUMPTION, confirm in the zoning code)." : "") };
    }
    if (anySf || specific) {
      return { ...base, status: "UNKNOWN", value, checked_at: now(), note: anySf ? "Parcel crosses more than one zone." : "Specific development or specific plan zone; whether it counts as single-family depends on the plan.", next_step: "Call the Santa Ana planning desk to confirm the zone." };
    }
    return { ...base, status: "FAIL", value, checked_at: now(), note: "Not a single-family zone, so SB 9 does not apply." + overlayNote };
  } catch (e) {
    return unknownFromError(base, e, "Retry, or call the Santa Ana planning desk to confirm the zone.");
  }
}
