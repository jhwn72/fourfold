// Off-market groups and proactive targets from a whole-city first screen (data/citywide*.json).
// Pure functions: no network, no files. Inputs are candidate lots that passed the first screen
// (single-family zone, splittable into two lots of at least 1,200 sq ft, not in a FEMA SFHA, not very-high fire).
// These lots are NOT for sale. Owners have not been contacted. A first screen, not a verdict.
// No owner names or mailing addresses are ever used here (personal information under the event rules).

export const OFFMARKET_LABEL = "not for sale; owners not contacted; a first screen, not a verdict";
export const CELL_FT = 1320; // 0.25 mile grid cell
export const MIN_SPLIT_LOT_SQFT = 2 * 1200; // HCD SB 9 fact sheet (April 2026) p.1: two lots of at least 1,200 sq ft

export type Candidate = { apn: string; address: string; area_sqft: number; zone: string; x: number; y: number; transit?: boolean };

export type OffmarketGroup = {
  id: string;
  city: string;
  cell: [number, number];
  center_ft: [number, number]; // cell center, EPSG 2230 feet
  center_lonlat: [number, number] | null;
  count: number;
  median_area_sqft: number | null;
  candidates: { apn: string; address: string; area_sqft: number }[];
};

export type ProactiveTarget = {
  rank: number;
  apn: string;
  site_address: string;
  city: string;
  lot_sqft: number;
  zone: string;
  cluster_id: string | null;
  near_transit: boolean | null; // null when transit was not checked
  reasons: string[];
  centroid_ft: [number, number];
  label: string;
};

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};

const cellOf = (c: { x: number; y: number }, size = CELL_FT): [number, number] => [Math.floor(c.x / size), Math.floor(c.y / size)];

/** Bin candidates into 0.25 mi cells and return the densest cells, most candidates first (ties: larger median lot). */
export function offmarketGroups(city: string, cands: Candidate[], top = 10, size = CELL_FT, toLonLat?: (x: number, y: number) => [number, number] | null): OffmarketGroup[] {
  const bins = new Map<string, Candidate[]>();
  for (const c of cands) {
    const k = cellOf(c, size).join(",");
    (bins.get(k) ?? bins.set(k, []).get(k)!).push(c);
  }
  const slug = city.toLowerCase().replace(/\s+/g, "-");
  return [...bins.entries()]
    .map(([k, list]) => {
      const [i, j] = k.split(",").map(Number) as [number, number];
      const center: [number, number] = [(i + 0.5) * size, (j + 0.5) * size];
      return {
        id: `${slug}-${i}-${j}`,
        city,
        cell: [i, j] as [number, number],
        center_ft: center,
        center_lonlat: toLonLat ? toLonLat(center[0], center[1]) : null,
        count: list.length,
        median_area_sqft: median(list.map((c) => c.area_sqft)),
        candidates: [...list].sort((a, b) => b.area_sqft - a.area_sqft).map((c) => ({ apn: c.apn, address: c.address, area_sqft: c.area_sqft })),
      };
    })
    .sort((a, b) => b.count - a.count || (b.median_area_sqft ?? 0) - (a.median_area_sqft ?? 0) || a.id.localeCompare(b.id))
    .slice(0, top);
}

/**
 * Rank proactive targets: candidates inside one of the dense groups (so offers can be grouped), bigger lots first,
 * near high-quality transit as a tiebreak-level bonus. Every reason is a plain public-data fact.
 */
export function rankTargets(city: string, cands: Candidate[], groups: OffmarketGroup[], top = 25, transitChecked = false, size = CELL_FT): ProactiveTarget[] {
  const groupByCell = new Map(groups.map((g) => [g.cell.join(","), g]));
  const pool = cands
    .filter((c) => c.area_sqft >= MIN_SPLIT_LOT_SQFT && c.address)
    .map((c) => ({ c, g: groupByCell.get(cellOf(c, size).join(",")) ?? null }))
    .filter((p) => p.g);
  // Score: lot area in sq ft, plus a 1,000 sq ft equivalent bonus for transit. Simple and explainable.
  const score = (p: (typeof pool)[number]) => p.c.area_sqft + (transitChecked && p.c.transit ? 1000 : 0);
  pool.sort((a, b) => score(b) - score(a) || a.c.apn.localeCompare(b.c.apn));
  return pool.slice(0, top).map((p, i) => {
    const reasons = [
      `Lot ${p.c.area_sqft.toLocaleString()} sq ft, room for two lots of at least 1,200 sq ft`,
      `Single-family zone ${p.c.zone}`,
      "Not in a FEMA high-risk flood zone",
      "Not in a very high fire hazard zone",
      `In a dense group of ${p.g!.count} first-screen lots within a quarter-mile cell, so offers can be grouped`,
    ];
    if (transitChecked && p.c.transit) reasons.push("Inside a Caltrans high-quality transit area (SB 9 parking cannot be required)");
    reasons.push(city === "Santa Ana" ? "Not on the Santa Ana historic list (state inventory not checked)" : `Historic status unknown: no city historic layer checked for ${city}`);
    return {
      rank: i + 1,
      apn: p.c.apn,
      site_address: p.c.address,
      city,
      lot_sqft: p.c.area_sqft,
      zone: p.c.zone,
      cluster_id: p.g!.id,
      near_transit: transitChecked ? Boolean(p.c.transit) : null,
      reasons,
      centroid_ft: [p.c.x, p.c.y],
      label: OFFMARKET_LABEL,
    };
  });
}
