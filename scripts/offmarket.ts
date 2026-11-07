// Off-market groups and proactive targets per city, from the whole-city first screens.
// Reads data/citywide.json (Santa Ana), data/citywide-anaheim.json, data/citywide-fullerton.json.
// Writes data/offmarket-groups.json and data/proactive-targets.json.
// Transit: the Caltrans HQTA layer is downloaded once per city envelope (paged, cached) and tested locally.
// Not for sale; owners not contacted; a first screen, not a verdict. No owner names or mailing addresses.
// Usage: npx tsx scripts/offmarket.ts
import { existsSync, promises as fs } from "fs";
import { offmarketGroups, rankTargets, OFFMARKET_LABEL, type Candidate } from "../src/lib/offmarket";
import { CHECKED, SRC } from "../src/lib/sources";

process.env.FOURFOLD_CACHE = "1";

// EPSG 2230 (NAD83 / California zone 6, US survey feet) to lon/lat, Lambert conformal conic inverse (GRS80).
function toLonLat(xFt: number, yFt: number): [number, number] {
  const ft = 1200 / 3937, a = 6378137, f = 1 / 298.257222101, e = Math.sqrt(2 * f - f * f);
  const rad = Math.PI / 180;
  const p1 = 33.88333333333333 * rad, p2 = 32.78333333333333 * rad, p0 = 32.16666666666666 * rad, l0 = -116.25 * rad;
  const FE = 2000000, FN = 500000; // meters
  const m = (p: number) => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
  const t = (p: number) => Math.tan(Math.PI / 4 - p / 2) / ((1 - e * Math.sin(p)) / (1 + e * Math.sin(p))) ** (e / 2);
  const n = (Math.log(m(p1)) - Math.log(m(p2))) / (Math.log(t(p1)) - Math.log(t(p2)));
  const F = m(p1) / (n * t(p1) ** n);
  const r0 = a * F * t(p0) ** n;
  const x = xFt * ft - FE, y = r0 - (yFt * ft - FN);
  const r = Math.sign(n) * Math.hypot(x, y);
  const tt = (r / (a * F)) ** (1 / n);
  const th = Math.atan2(x, y);
  let phi = Math.PI / 2 - 2 * Math.atan(tt);
  for (let i = 0; i < 8; i++) phi = Math.PI / 2 - 2 * Math.atan(tt * ((1 - e * Math.sin(phi)) / (1 + e * Math.sin(phi))) ** (e / 2));
  return [+(th / n / rad + l0 / rad).toFixed(6), +(phi / rad).toFixed(6)];
}

type Poly = { rings: number[][][]; bbox: number[] };
function inPolys(x: number, y: number, polys: Poly[]) {
  for (const g of polys) {
    const b = g.bbox;
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
    let inside = false;
    for (const ring of g.rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

async function main() {
  const { arcgisQuery } = await import("../src/lib/arcgis");
  const files: [string, string][] = [["Santa Ana", "data/citywide.json"], ["Anaheim", "data/citywide-anaheim.json"], ["Fullerton", "data/citywide-fullerton.json"]];
  const groupsOut: Record<string, unknown> = {};
  const targetsOut: Record<string, unknown> = {};
  for (const [city, file] of files) {
    if (!existsSync(file)) { console.log(`skip ${city}: ${file} missing`); continue; }
    const d = JSON.parse(await fs.readFile(file, "utf8"));
    const cands: Candidate[] = d.candidates.filter((c: Candidate) => typeof c.x === "number");
    // HQTA polygons inside the city envelope, paged and cached.
    let transitChecked = false;
    const hq: Poly[] = [];
    try {
      const [x0, y0, x1, y1] = d.bbox;
      for (let off = 0; off < 20000; off += 1000) {
        const res = await arcgisQuery(SRC.hqta.url, {
          where: "1=1", outFields: "OBJECTID", returnGeometry: true, outSR: 2230, resultOffset: off, resultRecordCount: 1000, orderByFields: "OBJECTID",
          geometry: JSON.stringify({ xmin: x0, ymin: y0, xmax: x1, ymax: y1, spatialReference: { wkid: 2230 } }),
          geometryType: "esriGeometryEnvelope", inSR: 2230, spatialRel: "esriSpatialRelIntersects",
        }, { timeoutMs: 30000, retries: 1 });
        for (const f of res.features) {
          const rings = f.geometry?.rings;
          if (!rings?.length) continue;
          let a = Infinity, b = Infinity, c = -Infinity, e = -Infinity;
          for (const r of rings) for (const [x, y] of r) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); }
          hq.push({ rings, bbox: [a, b, c, e] });
        }
        if (!(res.exceededTransferLimit === true || res.features.length === 1000)) break;
      }
      for (const c of cands) c.transit = inPolys(c.x, c.y, hq);
      transitChecked = true;
    } catch (e) {
      console.log(`${city}: transit not checked (${e instanceof Error ? e.message : e})`);
    }
    const groups = offmarketGroups(city, cands, 10, undefined, toLonLat);
    const targets = rankTargets(city, cands, groups, 25, transitChecked).map((t) => ({ ...t, centroid_lonlat: toLonLat(t.centroid_ft[0], t.centroid_ft[1]) }));
    const common = { label: OFFMARKET_LABEL, generated_at: new Date().toISOString(), screen_file: file, screen_counts: d.counts, screen_note: d.note };
    groupsOut[city] = { ...common, cell_ft: 1320, groups };
    targetsOut[city] = { ...common, transit_checked: transitChecked, hqta_polygons: hq.length, targets };
    const g = groups[0];
    console.log(`${city}: ${cands.length} candidates; top group ${g?.id} ${g?.count} lots, median ${g?.median_area_sqft} sq ft, center ${g?.center_lonlat}; targets ${targets.length}, transit ${transitChecked} (${hq.length} HQTA polys); #1 ${targets[0]?.site_address} ${targets[0]?.lot_sqft}`);
  }
  const sources = [{ name: "FourFold whole-city first screens (see each screen_file for its sources)", checked: CHECKED }, { name: SRC.hqta.name, url: SRC.hqta.url, checked: CHECKED }];
  const head = { label: OFFMARKET_LABEL, note: "Not for sale; owners not contacted; a first screen, not a verdict. Lots grouped into 0.25 mile grid cells (EPSG 2230 feet, cell center lon/lat converted locally). No owner names or mailing addresses. Each lot still needs the full parcel check before any outreach.", sources };
  await fs.writeFile("data/offmarket-groups.json", JSON.stringify({ ...head, cities: groupsOut }, null, 1));
  await fs.writeFile("data/proactive-targets.json", JSON.stringify({ ...head, ranking: "Lots in one of the 10 densest groups per city, at least 2,400 sq ft, ranked by lot area with a 1,000 sq ft bonus when inside a Caltrans high-quality transit area. Top 25 per city.", cities: targetsOut }, null, 1));
  console.log("wrote data/offmarket-groups.json, data/proactive-targets.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
