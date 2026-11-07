// "Keep the house": where does the existing building sit on the lot? If it fits wholly on one half of the
// sketched split, a nonprofit could keep it and add up to 3 new homes instead of demolishing.
// Data: OC Public Works Building Footprints. Informational: does not change the SB 9 verdict.
// Note: SB 9 does not let a city require a setback for an existing structure (HCD SB 9 Fact Sheet, Sept 2024, p.4).
import { arcgisQuery } from "../arcgis";
import { centroid, largestRing, pointInRing, polygonArea, shrinkRing, splitClearing } from "../geometry";
import { MIN_LOT_SQFT, MIN_SHARE } from "./lot-split";
import { SRC } from "../sources";
import type { CheckResult, KeepHouse, Parcel, SplitPlan } from "../types";
import { now, polyGeom, unknownFromError } from "./util";

export async function footprintCheck(parcel: Parcel, split: SplitPlan | null): Promise<{ check: CheckResult; buildings: number[][][]; keep: KeepHouse; split: SplitPlan | null }> {
  const base = {
    id: "existing_house",
    test: "Existing house fits on one half, so it can stay (bonus, does not change the verdict)",
    source_name: SRC.ocFootprints.name,
    source_url: SRC.ocFootprints.url,
    rule: "Site layout, not an SB 9 test. Existing structures need no new setback: HCD SB 9 Fact Sheet (Sept 2024) p.4.",
    affects_verdict: false,
  };
  try {
    const ring = largestRing(parcel.rings);
    const res = await arcgisQuery(SRC.ocFootprints.url, { ...polyGeom(shrinkRing(ring)), outFields: "Address", returnGeometry: true, outSR: 2230 });
    // Keep buildings whose centroid is on this parcel (drops neighbors that touch the line).
    const buildings = res.features
      .map((f) => f.geometry?.rings?.[0])
      .filter((r): r is number[][] => !!r && r.length > 2 && pointInRing(centroid(r), ring));
    if (!buildings.length) {
      return { buildings, keep: "none", split, check: { ...base, status: "UNKNOWN", value: "No building footprint mapped on this lot", checked_at: now(), note: "Footprint data may be missing or out of date.", next_step: "Check aerial photos or ask the listing agent." } };
    }
    const total = Math.round(buildings.reduce((s, b) => s + polygonArea([b]), 0));
    if (!split) {
      return { buildings, keep: "unknown", split, check: { ...base, status: "UNKNOWN", value: `${buildings.length} building(s), ${total.toLocaleString()} sq ft footprint`, checked_at: now(), note: "No split sketched." } };
    }
    const side = (b: number[][], sp: SplitPlan) => {
      const c = centroid(b);
      const pts = b.map(([x, y]) => [x + (c[0] - x) * 0.02, y + (c[1] - y) * 0.02]); // 2% inset for edge noise
      const inA = pts.every((p) => pointInRing(p, sp.lot_a));
      const inB = pts.every((p) => pointInRing(p, sp.lot_b));
      return inA ? "a" : inB ? "b" : "x";
    };
    // Try the default cut, then the cut the other way; use the first that keeps every building on one half.
    let used: SplitPlan = split;
    let sides = buildings.map((b) => side(b, split));
    let other = false;
    const fitsAll = (ss: string[]) => ss.every((x) => x === "a") || ss.every((x) => x === "b");
    if (!fitsAll(sides)) {
      // Slide the line to clear the buildings, keeping both lots >= 1,200 sq ft and neither under 40%.
      const alt = splitClearing(ring, buildings, MIN_LOT_SQFT, MIN_SHARE);
      if (alt) {
        const altSides = buildings.map((b) => side(b, alt));
        if (fitsAll(altSides)) { used = alt; sides = altSides; other = true; }
      }
    }
    const allA = sides.every((s) => s === "a"), allB = sides.every((s) => s === "b");
    const keep: KeepHouse = allA ? "fits_a" : allB ? "fits_b" : "straddles";
    const fits = keep !== "straddles";
    return {
      buildings,
      keep,
      split: used,
      check: {
        ...base,
        status: fits ? "PASS" : "FAIL",
        value: `${buildings.length} building(s), ${total.toLocaleString()} sq ft footprint; ${fits ? "all on one half of the sketched split" : "crosses the sketched split line"}`,
        checked_at: now(),
        note: (other ? `Split line moved to clear the house: lots of ${Math.round(used.lot_a_sqft).toLocaleString()} and ${Math.round(used.lot_b_sqft).toLocaleString()} sq ft (both at least 1,200 and 40%). ` : "") + (fits
          ? "Keep the existing house and add up to 3 new homes: less demolition, and the existing home can earn rent while you build. Confirm with a surveyor."
          : "No straight split line clears the house while keeping both lots at least 1,200 sq ft and 40%. A surveyor may find another layout."),
        next_step: fits ? undefined : "Ask a surveyor to try a split line that clears the house.",
      },
    };
  } catch (e) {
    return { buildings: [], keep: "unknown", split, check: unknownFromError(base, e, "Check aerial photos for where the house sits.") };
  }
}
