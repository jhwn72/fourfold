import { FetchError } from "../arcgis";
import type { CheckResult } from "../types";

export const now = () => new Date().toISOString();

export function polyGeom(ring: number[][]) {
  return {
    geometry: JSON.stringify({ rings: [ring], spatialReference: { wkid: 2230 } }),
    geometryType: "esriGeometryPolygon",
    inSR: 2230,
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: false,
  };
}

/** A failed or timed-out call becomes UNKNOWN with the reason. The other checks still run. */
export function unknownFromError(base: Omit<CheckResult, "status" | "value" | "checked_at" | "note">, e: unknown, nextStep: string): CheckResult {
  const reason = e instanceof FetchError || e instanceof Error ? e.message : String(e);
  return {
    ...base,
    status: "UNKNOWN",
    value: "Could not reach the data source",
    checked_at: now(),
    note: `Data source error: ${reason}.`,
    next_step: nextStep,
  };
}
