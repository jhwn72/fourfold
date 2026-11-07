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

// Any other Orange County city: OC countywide Parcels layer (point-in-polygon at the Census geocoder point,
// then a site address text match). Owner and mailing fields are never requested. If the county server is
// down, fall back to SCAG's 2024 regional parcel polygons (assessor APN, no site address).
export async function findCountyParcel(geo: { lon: number; lat: number; street: string; city: string }): Promise<{ parcel: Parcel | null; note: string; source: { name: string; url: string }; approximate: boolean }> {
  const pt = JSON.stringify({ x: geo.lon, y: geo.lat, spatialReference: { wkid: 4326 } });
  const spatial = { geometry: pt, geometryType: "esriGeometryPoint", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outSR: 2230, returnGeometry: true };
  const norm = normalizeAddress(geo.street);
  const num = norm.split(" ")[0];
  let ocError: string | null = null;
  try {
    const fields = { outFields: "ASSESSMENT_NO,SITE_ADDRESS" };
    let res = await arcgisQuery(SRC.ocParcels.url, { ...spatial, ...fields });
    // The geocoder point is interpolated along the street, so it can land just off the lot. Widen to 30 m and
    // keep only parcels whose site address has the same house number.
    if (!res.features.length) {
      res = await arcgisQuery(SRC.ocParcels.url, { ...spatial, ...fields, distance: 30, units: "esriSRUnit_Meter" });
      res.features = res.features.filter((f) => String(f.attributes.SITE_ADDRESS ?? "").trim().split(" ")[0] === num);
    }
    if (!res.features.length && /^\d+$/.test(num)) {
      const name = norm.split(" ").slice(1).filter((w) => !KNOWN_SFX.has(w)).slice(0, 2).join(" ");
      if (name) res = await arcgisQuery(SRC.ocParcels.url, { where: `SITE_ADDRESS LIKE '${esc(num)} %${esc(name)}%${esc(geo.city.toUpperCase())}%'`, ...fields, outSR: 2230, returnGeometry: true });
    }
    const hits = pickLargest(res.features);
    if (hits.length) {
      const f = hits[0];
      const rings = f.geometry!.rings!;
      const apn = String(f.attributes.ASSESSMENT_NO ?? "UNKNOWN");
      return {
        parcel: { apn, site_address: String(f.attributes.SITE_ADDRESS ?? norm).trim(), rings, area_sqft: polygonArea(rings), assessor_area_sqft: null, source_url: SRC.ocParcels.url },
        note: multiNote(hits.length, apn), source: SRC.ocParcels, approximate: false,
      };
    }
  } catch (e) {
    ocError = e instanceof Error ? e.message : String(e);
  }
  // Fallback: SCAG regional parcel polygons. Exact point first; otherwise the nearest parcel within 30 m.
  const scagFields = { outFields: "APN24,CITY" };
  let res = await arcgisQuery(SRC.scagZoning.url, { ...spatial, ...scagFields });
  let approximate = false;
  if (!res.features.length) {
    res = await arcgisQuery(SRC.scagZoning.url, { ...spatial, ...scagFields, distance: 30, units: "esriSRUnit_Meter" });
    approximate = true;
  }
  const withGeom = res.features.filter((f) => f.geometry?.rings?.length);
  const why = ocError ? `County parcel layer failed (${ocError}); used SCAG 2024 regional parcels instead.` : "No county parcel matched; used SCAG 2024 regional parcels instead.";
  if (!withGeom.length) return { parcel: null, note: `${why} No parcel found at the geocoded point.`, source: SRC.scagZoning, approximate };
  let f = withGeom[0];
  if (approximate && withGeom.length > 1) {
    // Nearest parcel edge to the geocoded point. Re-query the candidates in lon/lat to measure distance.
    const ll = await arcgisQuery(SRC.scagZoning.url, { ...spatial, ...scagFields, outSR: 4326, distance: 30, units: "esriSRUnit_Meter" });
    const k = Math.cos((geo.lat * Math.PI) / 180);
    const dist = (rings: number[][][]) => {
      let best = Infinity;
      for (const r of rings) for (let i = 0; i + 1 < r.length; i++) {
        const [x1, y1] = [(r[i][0] - geo.lon) * k, r[i][1] - geo.lat];
        const [x2, y2] = [(r[i + 1][0] - geo.lon) * k, r[i + 1][1] - geo.lat];
        const dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy;
        const t = len ? Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / len)) : 0;
        best = Math.min(best, Math.hypot(x1 + t * dx, y1 + t * dy));
      }
      return best;
    };
    const nearest = ll.features.filter((g) => g.geometry?.rings?.length).sort((a, b) => dist(a.geometry!.rings!) - dist(b.geometry!.rings!))[0];
    const match = nearest && withGeom.find((g) => g.attributes.APN24 === nearest.attributes.APN24);
    if (match) f = match;
  }
  const rings = f.geometry!.rings!;
  const apn = f.attributes.APN24 ? dashApn(String(f.attributes.APN24)) : "UNKNOWN";
  const note = approximate
    ? `${why} The geocoded point fell outside any lot; APN ${apn} is a guess from ${withGeom.length} nearby parcels (ASSUMPTION). Confirm the APN on the county parcel map.`
    : `${why} Matched APN ${apn} at the geocoded point.`;
  return { parcel: { apn, site_address: geo.street, rings, area_sqft: polygonArea(rings), assessor_area_sqft: null, source_url: SRC.scagZoning.url }, note, source: SRC.scagZoning, approximate };
}
