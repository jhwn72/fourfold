// Single-family residential zoning, from the City of Santa Ana zoning layer.
// Rule: HCD SB 9 Fact Sheet (Sept 2024) p.2, "Single-Family Residential Zones Only"
// (Gov. Code 65852.21(a); 66411.7(a)(3)(A)). Multifamily, commercial, agricultural and mixed-use zones
// are not subject to SB 9 even if they allow single-family homes.
import { arcgisQuery } from "../arcgis";
import { largestRing, shrinkRing } from "../geometry";
import { SRC } from "../sources";
import type { CheckResult, Parcel } from "../types";
import { now, polyGeom, unknownFromError } from "./util";
import { ANAHEIM_SF, FULLERTON_PRESERVATION, FULLERTON_SF, type City } from "../cities";

// Santa Ana zone classes whose description is single-family (from the layer's ZONEDESC values, 2026-11-07):
// R1 "Single-Family Residence", RE "Residential-Estate". ASSUMPTION: RE's primary purpose is single-family;
// confirm in the Santa Ana zoning code.
const SINGLE_FAMILY = new Set(["R1", "RE"]);

export async function zoningCheck(parcel: Parcel, city: City = "Santa Ana"): Promise<CheckResult> {
  if (city !== "Santa Ana") return otherCityZoning(parcel, city);
  const base = {
    id: "zoning",
    test: "Single-family zone",
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
    // A1 "General Agricultural" in Santa Ana can cover ordinary house lots. HCD (Sept 2024 p.2) says agricultural
    // zones are not SB 9 zones, but the test is the zone's primary purpose, so we do not call it a clear FAIL.
    const agri = zones.some((z) => z.cls === "A1");
    if (agri && !anySf) {
      return { ...base, status: "UNKNOWN", possible_fail: true, value, checked_at: now(), note: "Possible fail: zoned General Agricultural (A1). HCD says farm zones are not SB 9 zones, but this one has a house. The city decides.", next_step: "Ask the Santa Ana planning desk whether SB 9 applies in the A1 zone." };
    }
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

// Anaheim and Fullerton: same rule, each city's own zoning layer. Code lists and ASSUMPTIONs are in src/lib/cities.ts.
async function otherCityZoning(parcel: Parcel, city: "Anaheim" | "Fullerton"): Promise<CheckResult> {
  const src = city === "Anaheim" ? SRC.anZoning : SRC.fuZoning;
  const desk = `Ask the ${city} planning desk to confirm the zone.`;
  const base = {
    id: "zoning",
    test: "Single-family zone",
    source_name: src.name,
    source_url: src.url,
    rule: "HCD SB 9 Fact Sheet (Sept 2024) p.2: single-family residential zones only. Gov. Code 65852.21(a), 66411.7(a)(3)(A).",
    affects_verdict: true,
  };
  try {
    const res = await arcgisQuery(src.url, {
      ...polyGeom(shrinkRing(largestRing(parcel.rings))),
      outFields: city === "Anaheim" ? "ZONING,ZONINGDES" : "ZONE_ABR1,ZONE_ABR2,ZONE_DSC,OVERLAY1",
    });
    const seen = new Set<string>();
    const zones = res.features
      .map((f) => {
        const a = f.attributes;
        return city === "Anaheim"
          ? { cls: String(a.ZONING ?? "").trim(), detail: String(a.ZONING ?? "").trim(), desc: String(a.ZONINGDES ?? "").trim(), overlay: null as string | null }
          : { cls: String(a.ZONE_ABR1 ?? "").trim(), detail: String(a.ZONE_ABR2 ?? "").trim(), desc: String(a.ZONE_DSC ?? "").trim(), overlay: String(a.OVERLAY1 ?? "").trim() || null };
      })
      .filter((z) => (seen.has(z.detail + z.desc) ? false : (seen.add(z.detail + z.desc), true)));
    const sfSet = city === "Anaheim" ? ANAHEIM_SF : FULLERTON_SF;
    const value = zones.length
      ? zones.map((z) => `${z.detail} (${z.desc})${z.overlay ? `, overlay ${z.overlay}` : ""}`).join("; ")
      : "No zoning polygon found";
    if (!zones.length) {
      return { ...base, status: "UNKNOWN", value, checked_at: now(), note: "The zoning layer returned nothing for this parcel.", next_step: desk };
    }
    const allSf = zones.every((z) => sfSet.has(z.cls));
    const anySf = zones.some((z) => sfSet.has(z.cls));
    const plan = zones.some((z) => (city === "Anaheim" ? /^SP \d/.test(z.cls) : z.cls === "SP" || z.cls === "PR"));
    const overlayNote = zones.some((z) => z.overlay) ? " Parcel has a zoning overlay; ask the city how it applies." : "";
    const srcNote = city === "Fullerton" ? " Zoning layer is published under a Fullerton GIS account, not confirmed official." : "";
    if (allSf) {
      const pres = zones.some((z) => FULLERTON_PRESERVATION.has(z.cls));
      if (pres) {
        return { ...base, status: "PASS", value, checked_at: now(), note: "Zoned one-family residential, preservation (R-1-7.2P), treated as single-family (ASSUMPTION). The preservation zone may be a local historic district, which SB 9 can exclude." + overlayNote + srcNote, next_step: "Ask the Fullerton planning desk whether the preservation zone counts as a historic district for SB 9." };
      }
      return { ...base, status: "PASS", value, checked_at: now(), note: `Zoned single-family by the layer's own description (code list is an ASSUMPTION, confirm with the ${city} planning desk).` + overlayNote + srcNote };
    }
    if (anySf || plan) {
      return { ...base, status: "UNKNOWN", value, checked_at: now(), note: (anySf ? "Parcel crosses more than one zone." : "Specific plan or planned development zone; whether it counts as single-family depends on the plan.") + srcNote, next_step: desk };
    }
    return { ...base, status: "FAIL", value, checked_at: now(), note: "Not a single-family zone, so SB 9 does not apply." + overlayNote + srcNote };
  } catch (e) {
    return unknownFromError(base, e, `Retry, or ask the ${city} planning desk to confirm the zone.`);
  }
}
