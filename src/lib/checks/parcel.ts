// Address -> parcel polygon, from the City of Santa Ana Assessor Parcels layer.
import { arcgisQuery } from "../arcgis";
import { polygonArea } from "../geometry";
import { SRC } from "../sources";
import type { Parcel } from "../types";

const SUFFIX: Record<string, string> = {
  STREET: "ST", AVENUE: "AVE", BOULEVARD: "BLVD", DRIVE: "DR", ROAD: "RD", LANE: "LN", PLACE: "PL",
  COURT: "CT", CIRCLE: "CIR", TERRACE: "TER", WAY: "WAY", PARKWAY: "PKWY", NORTH: "N", SOUTH: "S",
  EAST: "E", WEST: "W",
};

/** "1234 North Main Street, Santa Ana, CA 92701" -> "1234 N MAIN ST" */
export function normalizeAddress(raw: string): string {
  const street = raw.split(",")[0].toUpperCase().replace(/[.#]/g, " ").replace(/\s+/g, " ").trim();
  return street.split(" ").map((w) => SUFFIX[w] ?? w).join(" ");
}

export async function findParcel(address: string): Promise<{ parcel: Parcel | null; note: string }> {
  const norm = normalizeAddress(address);
  const esc = (s: string) => s.replace(/'/g, "''");
  const fields = { outFields: "AssessmentNo,SiteAddress,Shape.STArea()", returnGeometry: true, outSR: 2230 };
  let res = await arcgisQuery(SRC.saParcels.url, { where: `SiteAddress='${esc(norm)}'`, ...fields });
  if (!res.features.length) {
    // Looser match: same house number and street name, ignoring the suffix.
    const parts = norm.split(" ");
    const num = parts[0];
    const name = parts.slice(1).filter((w) => !Object.values(SUFFIX).includes(w) || w.length > 2).slice(0, 2).join(" ");
    if (/^\d+$/.test(num) && name) {
      res = await arcgisQuery(SRC.saParcels.url, { where: `SiteAddress LIKE '${esc(num)} %${esc(name)}%'`, ...fields });
    }
  }
  const withGeom = res.features.filter((f) => f.geometry?.rings?.length);
  if (!withGeom.length) return { parcel: null, note: `No Santa Ana parcel found for "${norm}".` };
  // Several parcels can share an address (condos, multiple legal lots). Take the largest and say so.
  withGeom.sort((a, b) => polygonArea(b.geometry!.rings!) - polygonArea(a.geometry!.rings!));
  const f = withGeom[0];
  const rings = f.geometry!.rings!;
  const parcel: Parcel = {
    apn: String(f.attributes.AssessmentNo ?? "UNKNOWN"),
    site_address: String(f.attributes.SiteAddress ?? norm),
    rings,
    area_sqft: polygonArea(rings),
    assessor_area_sqft: typeof f.attributes["Shape.STArea()"] === "number" ? (f.attributes["Shape.STArea()"] as number) : null,
    source_url: SRC.saParcels.url,
  };
  const note = withGeom.length > 1
    ? `${withGeom.length} parcel records match this address; using the largest (APN ${parcel.apn}). Confirm the APN with the listing.`
    : `Matched APN ${parcel.apn}.`;
  return { parcel, note };
}
