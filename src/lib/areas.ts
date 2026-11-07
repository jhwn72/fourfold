// Areas to build in: dense pockets of first-screen SB 9 candidate lots, with what's for sale in each.
// A nonprofit can work one area as one push: one acquisitions effort, one city desk, one crew.
// Pure functions, no I/O. Coordinates are State Plane CA zone VI, US survey feet (wkid 2230).

/** Same 0.25 mile grid as data/offmarket-groups.json (cell = floor(x / 1320), center = (i + 0.5) * 1320). */
export const AREA_CELL_FT = 1320;
/**
 * ASSUMPTION: a quarter-mile cell is "dense" when it holds at least 160 first-screen candidate lots. Chosen so
 * each of Santa Ana, Anaheim and Fullerton yields about 3 to 6 areas of two or more touching cells. A team
 * judgment, not a rule from any source.
 */
export const DENSE_LOTS_PER_CELL = 160;
/** ASSUMPTION: an area needs at least 2 touching dense cells; at most 6 areas are kept per city. */
export const MIN_AREA_CELLS = 2;
export const MAX_AREAS_PER_CITY = 6;
/** Listings and targets within this distance of an area's dense cells are attached to it (0.25 mi). */
export const AREA_ATTACH_FT = 1320;
/** ASSUMPTION: SB 9 upper bound of 4 homes per lot (lot split plus two units on each), before any site is confirmed. */
export const HOMES_PER_LOT_MAX = 4;

export type AreaPoint = { id: string; x: number; y: number };

export type Area = {
  id: string; // "santa-ana-1"
  city: string;
  rank: number; // 1-based within the city
  label: string; // "Area 1 · Santa Ana"
  cells: [number, number][];
  lots: number; // first-screen candidate lots inside the area's dense cells
  upToHomes: number; // lots x HOMES_PER_LOT_MAX, an upper bound
  forSale: string[]; // listing ids
  leads: string[]; // lead ids
  targets: string[]; // off-market target APNs
  center: [number, number];
  bbox: [number, number, number, number]; // minX, minY, maxX, maxY of the dense cells
  spanFt: number; // larger side of the bbox
};

const key = (i: number, j: number) => `${i},${j}`;

/** Distance from a point to an axis-aligned cell (0 when inside). */
function distToCell(p: { x: number; y: number }, [i, j]: [number, number], cell: number): number {
  const x0 = i * cell, y0 = j * cell, x1 = x0 + cell, y1 = y0 + cell;
  const dx = Math.max(x0 - p.x, 0, p.x - x1), dy = Math.max(y0 - p.y, 0, p.y - y1);
  return Math.hypot(dx, dy);
}

/** Count candidate lots per 0.25 mi cell. */
export function cellCounts(points: { x: number; y: number }[], cell = AREA_CELL_FT): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of points) { const k = key(Math.floor(p.x / cell), Math.floor(p.y / cell)); m.set(k, (m.get(k) ?? 0) + 1); }
  return m;
}

/** Merge edge- or corner-adjacent dense cells into connected components. */
export function denseComponents(counts: Map<string, number>, threshold = DENSE_LOTS_PER_CELL): [number, number][][] {
  const dense = new Set([...counts].filter(([, n]) => n >= threshold).map(([k]) => k));
  const seen = new Set<string>();
  const comps: [number, number][][] = [];
  for (const k of [...dense].sort()) {
    if (seen.has(k)) continue;
    seen.add(k);
    const stack = [k], comp: [number, number][] = [];
    while (stack.length) {
      const c = stack.pop()!;
      const [i, j] = c.split(",").map(Number);
      comp.push([i, j]);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const n = key(i + dx, j + dy);
        if (dense.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
      }
    }
    comps.push(comp);
  }
  return comps;
}

/** Areas for one city. `candidates` are that city's first-screen candidate centroids in feet. */
export function cityAreas(city: string, candidates: { x: number; y: number }[], forSale: AreaPoint[], leads: AreaPoint[], targets: AreaPoint[], opts: { threshold?: number; cell?: number } = {}): Area[] {
  const cell = opts.cell ?? AREA_CELL_FT;
  const counts = cellCounts(candidates, cell);
  const comps = denseComponents(counts, opts.threshold ?? DENSE_LOTS_PER_CELL).filter((c) => c.length >= MIN_AREA_CELLS);
  const near = (cells: [number, number][], pts: AreaPoint[]) => pts.filter((p) => cells.some((c) => distToCell(p, c, cell) <= AREA_ATTACH_FT)).map((p) => p.id);
  const slug = city.toLowerCase().replace(/\s+/g, "-");
  const raw = comps.map((cells) => {
    const lots = cells.reduce((s, [i, j]) => s + (counts.get(key(i, j)) ?? 0), 0);
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    const bbox: [number, number, number, number] = [Math.min(...xs) * cell, Math.min(...ys) * cell, (Math.max(...xs) + 1) * cell, (Math.max(...ys) + 1) * cell];
    return {
      city, cells, lots, upToHomes: lots * HOMES_PER_LOT_MAX,
      forSale: near(cells, forSale), leads: near(cells, leads), targets: near(cells, targets),
      center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] as [number, number],
      bbox, spanFt: Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]),
    };
  });
  raw.sort(compareAreas);
  return raw.slice(0, MAX_AREAS_PER_CITY).map((a, i) => ({ ...a, id: `${slug}-${i + 1}`, rank: i + 1, label: `Area ${i + 1} · ${city}` }));
}

/** Rank: more first-screen lots, then more for sale, then more leads. */
export function compareAreas(a: Pick<Area, "lots" | "forSale" | "leads">, b: Pick<Area, "lots" | "forSale" | "leads">): number {
  return b.lots - a.lots || b.forSale.length - a.forSale.length || b.leads.length - a.leads.length;
}

/** "about 0.5 mi across", rounded to the nearest quarter mile. */
export function areaSize(spanFt: number): string {
  const q = Math.max(0.25, Math.round((spanFt / 5280) * 4) / 4);
  return `about ${q} mi across`;
}
