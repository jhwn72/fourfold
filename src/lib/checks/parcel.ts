// Address -> parcel polygon, from the City of Santa Ana Assessor Parcels layer.
import { arcgisQuery } from "../arcgis";
import { polygonArea } from "../geometry";
import { SRC } from "../sources";
import type { Parcel } from "../types";
import { dashApn, type City } from "../cities";

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

export async function findParcel(address: string, city: City = "Santa Ana"): Promise<{ parcel: Parcel | null; note: string }> {
  if (city === "Anaheim") return findAnaheim(address);
  if (city === "Fullerton") return findFullerton(address);
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

const esc = (s: string) => s.replace(/'/g, "''");
const KNOWN_SFX = new Set(Object.values(SUFFIX));

function pickLargest(features: { attributes: Record<string, unknown>; geometry?: { rings?: number[][][] } }[]) {
  const withGeom = features.filter((f) => f.geometry?.rings?.length);
  withGeom.sort((a, b) => polygonArea(b.geometry!.rings!) - polygonArea(a.geometry!.rings!));
  return withGeom;
}

function multiNote(n: number, apn: string) {
  return n > 1
    ? `${n} parcel records match this address; using the largest (APN ${apn}). Confirm the APN with the listing.`
    : `Matched APN ${apn}.`;
}

// City of Anaheim PropertyInfo Parcels: address split into HSENO, DIR, STR, SFX. Owner fields are never requested.
async function findAnaheim(address: string): Promise<{ parcel: Parcel | null; note: string }> {
  const norm = normalizeAddress(address);
  const parts = norm.split(" ");
  const num = parts[0];
  let rest = parts.slice(1);
  if (!/^\d+$/.test(num) || !rest.length) return { parcel: null, note: `Could not read a house number in "${norm}".` };
  const dir = ["N", "S", "E", "W"].includes(rest[0]) && rest.length > 1 ? rest[0] : null;
  if (dir) rest = rest.slice(1);
  const sfx = rest.length > 1 && KNOWN_SFX.has(rest[rest.length - 1]) ? rest[rest.length - 1] : null;
  const name = (sfx ? rest.slice(0, -1) : rest).join(" ");
  const fields = { outFields: "APN,HSENO,DIR,STR,SFX,UNITNO,LOTAREA", returnGeometry: true, outSR: 2230 };
  const url = SRC.anParcels.url;
  let where = `HSENO='${esc(num)}' AND STR='${esc(name)}'` + (dir ? ` AND DIR='${dir}'` : "") + (sfx ? ` AND SFX='${sfx}'` : "");
  let res = await arcgisQuery(url, { where, ...fields });
  if (!res.features.length) {
    where = `HSENO='${esc(num)}' AND STR LIKE '${esc(name.split(" ")[0])}%'`;
    res = await arcgisQuery(url, { where, ...fields });
  }
  const hits = pickLargest(res.features);
  if (!hits.length) return { parcel: null, note: `No Anaheim parcel found for "${norm}".` };
  const f = hits[0];
  const a = f.attributes;
  const rings = f.geometry!.rings!;
  const site = [a.HSENO, a.DIR, a.STR, a.SFX].map((v) => String(v ?? "").trim()).filter(Boolean).join(" ");
  const lotArea = Number(String(a.LOTAREA ?? "").trim());
  const apn = a.APN ? dashApn(String(a.APN)) : "UNKNOWN";
  const parcel: Parcel = {
    apn,
    site_address: site || norm,
    rings,
    area_sqft: polygonArea(rings),
    assessor_area_sqft: Number.isFinite(lotArea) && lotArea > 0 ? lotArea : null,
    source_url: url,
  };
  return { parcel, note: multiNote(hits.length, apn) };
}

// Fullerton Citywide Parcels (ArcGIS Online, published under a Fullerton GIS account). This layer also carries
// owner mailing and value fields; they are never requested or stored.
async function findFullerton(address: string): Promise<{ parcel: Parcel | null; note: string }> {
  const norm = normalizeAddress(address);
  const url = SRC.fuParcels.url;
  const fields = { outFields: "AssessmentNo,SiteAddress,Shape__Area", returnGeometry: true, outSR: 2230 };
  let res = await arcgisQuery(url, { where: `SiteAddress='${esc(norm)}'`, ...fields });
  if (!res.features.length) {
    const parts = norm.split(" ");
    const num = parts[0];
    const words = parts.slice(1).filter((w) => !KNOWN_SFX.has(w));
    const name = words.slice(0, 2).join(" ");
    if (/^\d+$/.test(num) && name) res = await arcgisQuery(url, { where: `SiteAddress LIKE '${esc(num)} %${esc(name)}%'`, ...fields });
  }
  const hits = pickLargest(res.features);
  if (!hits.length) return { parcel: null, note: `No Fullerton parcel found for "${norm}".` };
  const f = hits[0];
  const rings = f.geometry!.rings!;
  const apn = String(f.attributes.AssessmentNo ?? "UNKNOWN");
  const parcel: Parcel = {
    apn,
    site_address: String(f.attributes.SiteAddress ?? norm).trim(),
    rings,
    area_sqft: polygonArea(rings),
    assessor_area_sqft: null, // Shape__Area is the GIS polygon area, not an assessor figure
    source_url: url,
  };
  return { parcel, note: multiNote(hits.length, apn) };
}
