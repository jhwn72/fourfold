// Whole-city SB 9 screen for Santa Ana. Downloads each layer once (paged, cached in .cache/) and does
// all geometry locally, so it costs roughly 65-70 requests total instead of one per parcel.
// Usage: npm run citywide            (Santa Ana, writes data/citywide.json)
//        npm run citywide anaheim    (writes data/citywide-anaheim.json)
//        npm run citywide fullerton  (writes data/citywide-fullerton.json)
// Anaheim and Fullerton: zoning codes from src/lib/cities.ts (ASSUMPTION where judged). No city historic layer is
// checked there, so historic stays UNKNOWN for every candidate. Fullerton R-1-7.2P "Preservation" lots are coded 2
// (possible historic) instead of candidate.
//
// This is a first screen, not a verdict. Every overlay test uses the parcel's centroid, not its full outline.
// Rules mirror src/lib/checks/*.ts: zoning R1/RE (RE is an ASSUMPTION), equal split into two lots of at least
// 1,200 sq ft with neither under 40%, not in a FEMA special flood hazard area (SFHA_TF='T'), not in a very high
// fire hazard severity zone, not on the city historic list. Inside a historic district = possible fail.
// Owner and mailing fields are never requested or stored.
import { promises as fs } from "fs";
import path from "path";
import type { ArcFeature } from "../src/lib/arcgis";
import { centroid, equalSplit, largestRing, polygonArea } from "../src/lib/geometry";
import { CHECKED, SRC } from "../src/lib/sources";
import { ANAHEIM_SF, FULLERTON_PRESERVATION, FULLERTON_SF, dashApn } from "../src/lib/cities";

type Pt = number[];
const BULK = { timeoutMs: 30000, retries: 1 };
const SINGLE_FAMILY = new Set(["R1", "RE"]); // RE treated as single-family: ASSUMPTION (same as zoning.ts)
const MIN_LOT_SQFT = 1200;
const MIN_SHARE = 0.4;
let requests = 0;
// arcgis.ts reads FOURFOLD_CACHE when it is first imported, and static imports are hoisted above any
// statement, so set the flag here and load the module dynamically in main().
process.env.FOURFOLD_CACHE = "1";
let arcgisQuery: typeof import("../src/lib/arcgis").arcgisQuery;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAll(url: string, params: Record<string, string | number | boolean>, pageSize: number) {
  const out: ArcFeature[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const res = await arcgisQuery(url, { where: "1=1", outSR: 2230, orderByFields: "OBJECTID", resultOffset: offset, resultRecordCount: pageSize, ...params }, BULK);
    requests++;
    out.push(...res.features);
    process.stdout.write(`\r  ${url.split("/services/")[1]}: ${out.length}`);
    const more = res.exceededTransferLimit === true || res.features.length === pageSize;
    if (!more || !res.features.length) break;
    await sleep(200);
  }
  process.stdout.write("\n");
  return out;
}

type Poly = { rings: Pt[][]; bbox: [number, number, number, number]; attrs: Record<string, unknown> };
function toPolys(features: ArcFeature[]): Poly[] {
  return features
    .filter((f) => f.geometry?.rings?.length)
    .map((f) => {
      const rings = f.geometry!.rings!;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const r of rings) for (const [x, y] of r) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
      return { rings, bbox: [x0, y0, x1, y1] as [number, number, number, number], attrs: f.attributes };
    });
}

/** Even-odd point-in-polygon over all rings (holes handled by parity). */
function pointInRings(p: Pt, rings: Pt[][]): boolean {
  let inside = false;
  const [x, y] = p;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
function findPoly(p: Pt, polys: Poly[]): Poly | null {
  for (const g of polys) {
    const b = g.bbox;
    if (p[0] < b[0] || p[0] > b[2] || p[1] < b[1] || p[1] > b[3]) continue;
    if (pointInRings(p, g.rings)) return g;
  }
  return null;
}

const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");

// Class codes in points[]: keep in sync with src/components/CityMap.tsx
const CODE = { no: 0, candidate: 1, in_district: 2 } as const;
// shared_polygon: two or more APNs carry the identical polygon (same centroid and area), which in this layer is
// typically condominium or mobile-home units on one common lot. Not a single house lot, so not an SB 9 candidate.
const REASONS = ["not_sf_zone", "shared_polygon", "too_small", "flood", "fire", "historic"] as const;

async function main() {
  ({ arcgisQuery } = await import("../src/lib/arcgis"));
  const arg = (process.argv[2] ?? "").toLowerCase();
  if (arg === "anaheim" || arg === "fullerton") return otherCity(arg);
  const t0 = Date.now();
  console.log("Downloading layers (cached in .cache/)...");
  const parcelsRaw = await fetchAll(SRC.saParcels.url, { outFields: "OBJECTID,AssessmentNo,SiteAddress", returnGeometry: true }, 1000);
  const parcels = parcelsRaw.filter((f) => f.geometry?.rings?.length);

  // City envelope from the parcel extent.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of parcels) for (const r of f.geometry!.rings!) for (const [x, y] of r) {
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  const envelope = {
    geometry: JSON.stringify({ xmin: x0, ymin: y0, xmax: x1, ymax: y1, spatialReference: { wkid: 2230 } }),
    geometryType: "esriGeometryEnvelope",
    inSR: 2230,
    spatialRel: "esriSpatialRelIntersects",
  };

  const zoning = toPolys(await fetchAll(SRC.saZoning.url, { outFields: "OBJECTID,ZONECLASS", returnGeometry: true }, 1000));
  const flood = toPolys(await fetchAll(SRC.ocFlood.url, { ...envelope, where: "SFHA_TF='T'", outFields: "OBJECTID,FLD_ZONE,SFHA_TF", returnGeometry: true }, 500));
  const fire = toPolys(await fetchAll(SRC.ocFire.url, { ...envelope, where: "HAZ_CLASS='Very High'", outFields: "OBJECTID,HAZ_CLASS", returnGeometry: true }, 500));
  const histProps = await fetchAll(SRC.saHistoricProps.url, { outFields: "OBJECTID,APN,CATEGORY", returnGeometry: false }, 1000);
  const districts = toPolys(await fetchAll(SRC.saHistoricDistricts.url, { outFields: "OBJECTID,DISTRICTNAME", returnGeometry: true }, 100));
  const historicApns = new Set(histProps.map((f) => digits(f.attributes.APN)).filter(Boolean));

  console.log(`Classifying ${parcels.length} parcels...`);
  const counts = { total: parcels.length, sf_zone: 0, splittable: 0, candidates: 0, in_district: 0, by_reason: Object.fromEntries(REASONS.map((r) => [r, 0])) as Record<string, number> };
  const cents: [number, number, number][] = [];
  const candidates: { apn: string; address: string; area_sqft: number; zone: string; x: number; y: number }[] = [];

  const geomKey = (f: ArcFeature) => {
    const outer = largestRing(f.geometry!.rings!);
    const [cx, cy] = centroid(outer);
    return `${Math.round(cx)},${Math.round(cy)},${Math.round(polygonArea(f.geometry!.rings!))}`;
  };
  const keyCount = new Map<string, number>();
  for (const f of parcels) { const k = geomKey(f); keyCount.set(k, (keyCount.get(k) ?? 0) + 1); }

  for (const f of parcels) {
    const rings = f.geometry!.rings!;
    const outer = largestRing(rings);
    const c = centroid(outer);
    const zonePoly = findPoly(c, zoning);
    const zone = zonePoly ? String(zonePoly.attrs.ZONECLASS ?? "") : "";
    const area = polygonArea(rings);
    let reason: string | null = null;
    const sf = SINGLE_FAMILY.has(zone);
    let split = false;
    if (sf) {
      counts.sf_zone++;
      if (area >= 2 * MIN_LOT_SQFT) {
        const s = equalSplit(outer);
        const small = Math.min(s.lot_a_sqft, s.lot_b_sqft);
        split = s.lot_a_sqft >= MIN_LOT_SQFT && s.lot_b_sqft >= MIN_LOT_SQFT && small / area >= MIN_SHARE;
      }
      if (split) counts.splittable++;
    }
    if (!sf) reason = "not_sf_zone";
    else if ((keyCount.get(geomKey(f)) ?? 0) > 1) reason = "shared_polygon";
    else if (!split) reason = "too_small";
    else if (findPoly(c, flood)) reason = "flood";
    else if (findPoly(c, fire)) reason = "fire";
    else if (historicApns.has(digits(f.attributes.AssessmentNo))) reason = "historic";

    let code: number = CODE.no;
    if (reason) counts.by_reason[reason]++;
    else if (findPoly(c, districts)) { code = CODE.in_district; counts.in_district++; }
    else {
      code = CODE.candidate; counts.candidates++;
      candidates.push({ apn: String(f.attributes.AssessmentNo ?? ""), address: String(f.attributes.SiteAddress ?? "").trim(), area_sqft: Math.round(area), zone, x: Math.round(c[0]), y: Math.round(c[1]) });
    }
    cents.push([c[0], c[1], code]);
  }

  const bx0 = Math.floor(Math.min(...cents.map((p) => p[0]))), by0 = Math.floor(Math.min(...cents.map((p) => p[1])));
  const bx1 = Math.ceil(Math.max(...cents.map((p) => p[0]))), by1 = Math.ceil(Math.max(...cents.map((p) => p[1])));
  candidates.sort((a, b) => (a.address ? 0 : 1) - (b.address ? 0 : 1) || a.address.localeCompare(b.address));

  const out = {
    generated_at: new Date().toISOString(),
    note: "First screen using parcel centroids, not a verdict. x,y in points are State Plane CA VI (EPSG 2230), in units of 10 US feet, relative to bbox min (bbox is in feet). Codes: 0 no, 1 candidate, 2 in historic district. splittable counts single-family parcels that pass the split test, including shared polygons. candidates[].x,y are the parcel centroid in EPSG 2230 feet.",
    sources: [SRC.saParcels, SRC.saZoning, SRC.ocFlood, SRC.ocFire, SRC.saHistoricProps, SRC.saHistoricDistricts].map((s) => ({ name: s.name, url: s.url, checked: CHECKED })),
    counts,
    bbox: [bx0, by0, bx1, by1],
    points: cents.map(([x, y, k]) => [Math.round((x - bx0) / 10), Math.round((y - by0) / 10), k]),
    candidates,
  };
  const file = path.join(process.cwd(), "data", "citywide.json");
  await fs.writeFile(file, JSON.stringify(out));
  const size = (await fs.stat(file)).size;
  console.log(JSON.stringify(counts, null, 2));
  console.log(`layers: zoning ${zoning.length}, flood SFHA ${flood.length}, fire VH ${fire.length}, historic props ${histProps.length} (${historicApns.size} APNs), districts ${districts.length}`);
  console.log(`requests made (cached pages count too): ${requests}; wrote ${file} (${(size / 1024).toFixed(0)} KB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}


type CityParcel = { apn: string; address: string; rings: Pt[][] };

async function otherCity(arg: "anaheim" | "fullerton") {
  const t0 = Date.now();
  const city = arg === "anaheim" ? "Anaheim" : "Fullerton";
  console.log(`Downloading ${city} layers (cached in .cache/)...`);
  let parcels: CityParcel[];
  let zoning: Poly[];
  let zoneOf: (p: Poly | null) => { cls: string; label: string };
  let sfSet: Set<string>;
  if (arg === "anaheim") {
    // Owner fields are never requested.
    const raw = await fetchAll(SRC.anParcels.url, { outFields: "OBJECTID,APN,HSENO,DIR,STR,SFX", returnGeometry: true }, 2000);
    parcels = raw.filter((f) => f.geometry?.rings?.length).map((f) => {
      const a = f.attributes;
      return { apn: a.APN ? dashApn(String(a.APN)) : "", address: [a.HSENO, a.DIR, a.STR, a.SFX].map((v) => String(v ?? "").trim()).filter(Boolean).join(" "), rings: f.geometry!.rings! };
    });
    zoning = toPolys(await fetchAll(SRC.anZoning.url, { outFields: "OBJECTID,ZONING", returnGeometry: true }, 2000));
    zoneOf = (p) => { const z = p ? String(p.attrs.ZONING ?? "").trim() : ""; return { cls: z, label: z }; };
    sfSet = ANAHEIM_SF;
  } else {
    // This layer also has owner mailing and value fields; they are never requested.
    const raw = await fetchAll(SRC.fuParcels.url, { outFields: "OBJECTID,AssessmentNo,SiteAddress", returnGeometry: true }, 2000);
    parcels = raw.filter((f) => f.geometry?.rings?.length).map((f) => ({ apn: String(f.attributes.AssessmentNo ?? ""), address: String(f.attributes.SiteAddress ?? "").trim(), rings: f.geometry!.rings! }));
    zoning = toPolys(await fetchAll(SRC.fuZoning.url, { outFields: "OBJECTID,ZONE_ABR1,ZONE_ABR2", returnGeometry: true }, 2000));
    zoneOf = (p) => p ? { cls: String(p.attrs.ZONE_ABR1 ?? "").trim(), label: String(p.attrs.ZONE_ABR2 ?? "").trim() } : { cls: "", label: "" };
    sfSet = FULLERTON_SF;
  }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of parcels) for (const r of f.rings) for (const [x, y] of r) {
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  const envelope = {
    geometry: JSON.stringify({ xmin: x0, ymin: y0, xmax: x1, ymax: y1, spatialReference: { wkid: 2230 } }),
    geometryType: "esriGeometryEnvelope", inSR: 2230, spatialRel: "esriSpatialRelIntersects",
  };
  const flood = toPolys(await fetchAll(SRC.ocFlood.url, { ...envelope, where: "SFHA_TF='T'", outFields: "OBJECTID,FLD_ZONE,SFHA_TF", returnGeometry: true }, 500));
  const fire = toPolys(await fetchAll(SRC.ocFire.url, { ...envelope, where: "HAZ_CLASS='Very High'", outFields: "OBJECTID,HAZ_CLASS", returnGeometry: true }, 500));

  console.log(`Classifying ${parcels.length} parcels...`);
  const reasons = ["not_sf_zone", "shared_polygon", "too_small", "flood", "fire"];
  const counts = { total: parcels.length, sf_zone: 0, splittable: 0, candidates: 0, in_district: 0, by_reason: Object.fromEntries(reasons.map((r) => [r, 0])) as Record<string, number> };
  const cents: [number, number, number][] = [];
  const candidates: { apn: string; address: string; area_sqft: number; zone: string; x: number; y: number }[] = [];
  const geomKey = (rings: Pt[][]) => { const [cx, cy] = centroid(largestRing(rings)); return `${Math.round(cx)},${Math.round(cy)},${Math.round(polygonArea(rings))}`; };
  const keyCount = new Map<string, number>();
  for (const f of parcels) { const k = geomKey(f.rings); keyCount.set(k, (keyCount.get(k) ?? 0) + 1); }

  for (const f of parcels) {
    const outer = largestRing(f.rings);
    const c = centroid(outer);
    const z = zoneOf(findPoly(c, zoning));
    const area = polygonArea(f.rings);
    const sf = sfSet.has(z.cls);
    let split = false;
    if (sf) {
      counts.sf_zone++;
      if (area >= 2 * MIN_LOT_SQFT) {
        const s = equalSplit(outer);
        const small = Math.min(s.lot_a_sqft, s.lot_b_sqft);
        split = s.lot_a_sqft >= MIN_LOT_SQFT && s.lot_b_sqft >= MIN_LOT_SQFT && small / area >= MIN_SHARE;
      }
      if (split) counts.splittable++;
    }
    let reason: string | null = null;
    if (!sf) reason = "not_sf_zone";
    else if ((keyCount.get(geomKey(f.rings)) ?? 0) > 1) reason = "shared_polygon";
    else if (!split) reason = "too_small";
    else if (findPoly(c, flood)) reason = "flood";
    else if (findPoly(c, fire)) reason = "fire";
    let code: number = CODE.no;
    if (reason) counts.by_reason[reason]++;
    else if (FULLERTON_PRESERVATION.has(z.cls) && arg === "fullerton") { code = CODE.in_district; counts.in_district++; }
    else {
      code = CODE.candidate; counts.candidates++;
      candidates.push({ apn: f.apn, address: f.address, area_sqft: Math.round(area), zone: z.label, x: Math.round(c[0]), y: Math.round(c[1]) });
    }
    cents.push([c[0], c[1], code]);
  }

  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const p of cents) { if (p[0] < bx0) bx0 = p[0]; if (p[1] < by0) by0 = p[1]; if (p[0] > bx1) bx1 = p[0]; if (p[1] > by1) by1 = p[1]; }
  bx0 = Math.floor(bx0); by0 = Math.floor(by0); bx1 = Math.ceil(bx1); by1 = Math.ceil(by1);
  candidates.sort((a, b) => (a.address ? 0 : 1) - (b.address ? 0 : 1) || a.address.localeCompare(b.address));
  const src = arg === "anaheim" ? [SRC.anParcels, SRC.anZoning] : [SRC.fuParcels, SRC.fuZoning];
  const out = {
    generated_at: new Date().toISOString(),
    city,
    note: `First screen using parcel centroids, not a verdict. Historic status is UNKNOWN for every lot: no city historic layer checked for ${city}. Single-family codes: ${[...sfSet].join(", ")} (ASSUMPTION where judged, see src/lib/cities.ts).${arg === "fullerton" ? " Code 2 here means a Fullerton R-1-7.2P preservation-zone lot (possible historic), not a mapped historic district." : ""} x,y in points are State Plane CA VI (EPSG 2230), in units of 10 US feet, relative to bbox min (bbox is in feet). Codes: 0 no, 1 candidate, 2 possible historic.`,
    sources: [...src, SRC.ocFlood, SRC.ocFire].map((s) => ({ name: s.name, url: s.url, checked: CHECKED })),
    counts,
    bbox: [bx0, by0, bx1, by1],
    points: cents.map(([x, y, k]) => [Math.round((x - bx0) / 10), Math.round((y - by0) / 10), k]),
    candidates,
  };
  const file = path.join(process.cwd(), "data", `citywide-${arg}.json`);
  await fs.writeFile(file, JSON.stringify(out));
  const size = (await fs.stat(file)).size;
  console.log(JSON.stringify(counts, null, 2));
  console.log(`layers: zoning ${zoning.length}, flood SFHA ${flood.length}, fire VH ${fire.length}`);
  console.log(`requests made (cached pages count too): ${requests}; wrote ${file} (${(size / 1024).toFixed(0)} KB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => { console.error(e); process.exit(1); });
