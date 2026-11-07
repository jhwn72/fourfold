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

// Other Orange County cities: SCAG 2024 regional zoning (preliminary, Oct 2025), parcel-level, fields
// ZN24_CITY (the city's own code) and ZN24_SCAG (SCAG regional category). Code meanings are from the SCAG
// layer's published legend (layer description, read 2026-11-07): 1110 Single Family Residential, 1111 High
// Density SFR (9+ DU/ac), 1112 Medium Density SFR (3-8 DU/ac), 1113 Low Density SFR (2 or less DU/ac).
// ASSUMPTION: a parcel SCAG codes 1110-1113 sits in a single-family residential zone for SB 9. SCAG says the
// data is for planning only and the city's zoning is official. 1100 Residential, 1140 Mixed Residential and
// 1150 Rural Residential do not say single-family, so they stay UNKNOWN. Other documented categories
// (multi-family 1120-1125, mobile homes 113x, commercial 12xx, industrial 13xx, etc.) are not single-family.
const SCAG_SF = new Set(["1110", "1111", "1112", "1113"]);
const SCAG_LABEL: Record<string, string> = {
  "1100": "Residential", "1110": "Single Family Residential", "1111": "High Density Single Family Residential",
  "1112": "Medium Density Single Family Residential", "1113": "Low Density Single Family Residential",
  "1120": "Multi-Family Residential", "1121": "Mixed Multi-Family Residential", "1122": "Duplexes, Triplexes and 2- or 3-Unit Condominiums and Townhouses",
  "1123": "Low-Rise Apartments, Condominiums, and Townhouses", "1124": "Medium-Rise Apartments and Condominiums", "1125": "High-Rise Apartments and Condominiums",
  "1130": "Mobile Homes and Trailer Parks", "1131": "Trailer Parks and Mobile Home Courts, High-Density", "1132": "Mobile Home Courts and Subdivisions, Low-Density",
  "1140": "Mixed Residential", "1150": "Rural Residential", "1200": "Commercial and Services", "1210": "General Office Use", "1220": "Retail Stores and Commercial Services",
  "1230": "Other Commercial", "1240": "Public Facilities", "1260": "Educational Institutions", "1300": "Industrial", "1310": "Light Industrial", "1320": "Heavy Industrial",
  "1340": "Wholesaling and Warehousing", "1400": "Transportation, Communications, and Utilities",
};
const NOT_SF = (c: string) => /^11(2\d|3\d)$/.test(c) || /^1[2-4]\d\d$/.test(c);

export async function scagZoningCheck(parcel: Parcel, city: string, geo?: { lon: number; lat: number }): Promise<CheckResult> {
  const desk = `Ask the ${city} planning desk whether this zone is single-family.`;
  const base = {
    id: "zoning",
    test: "Single-family zone",
    source_name: SRC.scagZoning.name,
    source_url: SRC.scagZoning.url,
    rule: "HCD SB 9 Fact Sheet (Sept 2024) p.2: single-family residential zones only. Gov. Code 65852.21(a), 66411.7(a)(3)(A).",
    affects_verdict: true,
  };
  try {
    const res = await arcgisQuery(SRC.scagZoning.url, {
      ...(geo
        ? { geometry: JSON.stringify({ x: geo.lon, y: geo.lat, spatialReference: { wkid: 4326 } }), geometryType: "esriGeometryPoint", inSR: 4326, spatialRel: "esriSpatialRelIntersects", returnGeometry: false }
        : polyGeom(shrinkRing(largestRing(parcel.rings), 5))),
      outFields: "APN24,ZN24_CITY,ZN24_SCAG,ZN24_SCAG_2ND",
    });
    // Prefer the record with this parcel's APN when SCAG returns neighbors.
    const apnDigits = parcel.apn.replace(/\D/g, "");
    let feats = res.features;
    const same = feats.filter((f) => String(f.attributes.APN24 ?? "") === apnDigits);
    if (same.length) feats = same;
    const seen = new Set<string>();
    const zones = feats
      .map((f) => ({ local: String(f.attributes.ZN24_CITY ?? "").trim(), code: String(f.attributes.ZN24_SCAG ?? "").trim(), second: String(f.attributes.ZN24_SCAG_2ND ?? "").trim() }))
      .filter((z) => (seen.has(z.local + z.code) ? false : (seen.add(z.local + z.code), true)));
    const value = zones.length
      ? zones.map((z) => `${z.local || "no local code"} (SCAG ${z.code || "?"}${SCAG_LABEL[z.code] ? ` ${SCAG_LABEL[z.code]}` : ""})${z.second ? `, secondary ${z.second}` : ""}`).join("; ")
      : "No zoning record found";
    const caveat = " Regional SCAG data (preliminary 2024), not the city's official map; code meaning from SCAG's legend (ASSUMPTION*).";
    if (!zones.length) return { ...base, status: "UNKNOWN", value, checked_at: now(), note: "SCAG returned no zoning for this parcel.", next_step: desk };
    const allSf = zones.every((z) => SCAG_SF.has(z.code) && (!z.second || SCAG_SF.has(z.second)));
    const allNot = zones.every((z) => NOT_SF(z.code));
    if (allSf) return { ...base, status: "PASS", value, checked_at: now(), note: "Zoned single-family." + caveat, next_step: `Confirm the zone with the ${city} planning desk.` };
    if (allNot) return { ...base, status: "FAIL", value, checked_at: now(), note: "Not a single-family zone, so SB 9 does not apply." + caveat };
    return { ...base, status: "UNKNOWN", value, checked_at: now(), note: (zones.length > 1 ? "Parcel has more than one zoning record." : "SCAG's category does not say whether this zone is single-family.") + caveat, next_step: desk };
  } catch (e) {
    return unknownFromError(base, e, `Retry, or ${desk.charAt(0).toLowerCase()}${desk.slice(1)}`);
  }
}
