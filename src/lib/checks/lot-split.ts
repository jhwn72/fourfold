// Lot size and split test. No external call: area comes from the parcel polygon in feet.
//
// Rule sources:
// - HCD fact sheet, Duplexes and Lot Splits (SB 9), April 2026, page 1: local standards "cannot preclude
//   the creation of two 1,200 square-foot lots"; the statute allows a split "into two lots of roughly equal size".
// - The 40% minimum share is Gov. Code 66411.7(a)(1)(B) as summarized in the team brief. The HCD fact sheets
//   we read do not state 40%, and leginfo blocks automated fetch, so it is labelled UNVERIFIED in the UI.
import { equalSplit, largestRing } from "../geometry";
import { CHECKED, SRC } from "../sources";
import type { CheckResult, Parcel, SplitPlan } from "../types";
import { now } from "./util";

export const MIN_LOT_SQFT = 1200;
export const MIN_SHARE = 0.4;

export function lotSplitCheck(parcel: Parcel): { check: CheckResult; split: SplitPlan | null } {
  const ring = largestRing(parcel.rings);
  const s = equalSplit(ring);
  const total = parcel.area_sqft;
  const small = Math.min(s.lot_a_sqft, s.lot_b_sqft);
  const pass = s.lot_a_sqft >= MIN_LOT_SQFT && s.lot_b_sqft >= MIN_LOT_SQFT && small / total >= MIN_SHARE;
  const diff = parcel.assessor_area_sqft ? Math.abs(parcel.assessor_area_sqft - total) / total : 0;
  const crossCheck = parcel.assessor_area_sqft
    ? ` City layer's own area field: ${Math.round(parcel.assessor_area_sqft).toLocaleString()} sq ft${diff > 0.02 ? " (differs by more than 2%, check the parcel map)" : " (matches)"}.`
    : "";
  return {
    split: { ...s, lot_a: s.lot_a, lot_b: s.lot_b },
    check: {
      id: "lot_split",
      test: "Splits into two lots of 1,200+ sq ft, neither under 40%",
      status: pass ? "PASS" : "FAIL",
      value: `Lot ${Math.round(total).toLocaleString()} sq ft; equal split = ${Math.round(s.lot_a_sqft).toLocaleString()} + ${Math.round(s.lot_b_sqft).toLocaleString()} sq ft`,
      source_name: SRC.saParcels.name + " (area measured from the parcel map)",
      source_url: SRC.saParcels.url,
      checked_at: now(),
      note:
        (pass
          ? "Big enough on paper. Street access, frontage and the city's written standards still apply."
          : "Too small for two 1,200 sq ft lots. SB 9 may still allow up to 2 homes without a split.") + crossCheck,
      rule: `HCD SB 9 fact sheet (April 2026) p.1: two 1,200 sq ft lots, roughly equal size. 40% minimum: Gov. Code 66411.7(a)(1)(B), UNVERIFIED against statute text on ${CHECKED}.`,
      next_step: pass ? "Ask the city planning desk about street access for the rear lot." : undefined,
      affects_verdict: true,
    },
  };
}
