// Group viable listings that sit close together, so a small nonprofit can run one acquisitions push,
// one city process, one contractor mobilization and one neighborhood conversation.
// Pure functions, no I/O. Coordinates are State Plane CA zone VI, US survey feet (wkid 2230).
import type { SiteResult, Verdict } from "./types";
import { centroid, largestRing } from "./geometry";

export const FT_PER_MILE = 5280;
/**
 * ASSUMPTION: 0.5 mile (2,640 ft) is a walkable, one-crew radius: a site superintendent can move between
 * sites on foot and one contractor can stage for all of them. A team judgment, not a rule from any source.
 */
export const DEFAULT_RADIUS_FT = 2640;
export const RADIUS_OPTIONS_FT = [1320, 2640, 5280] as const;

export type ClusterSite = {
  id: string;
  address: string;
  city: string;
  verdict: Verdict;
  homes: number | null; // max_homes from results.json
  price: number | null; // asking price from the listing, not a sale price
  zone: string | null; // zoning code from the zoning check, e.g. "R1"
  x: number;
  y: number;
};

export type Cluster = {
  key: string; // "a", "b", ...
  label: string; // "Group A"
  members: ClusterSite[];
  homes: number; // sum of known max homes
  homesUnknown: number; // members with no max_homes
  totalAsking: number; // sum of known asking prices
  priceUnknown: number; // members with no asking price
  avgPerHome: number | null; // totalAsking / homes, only when every price and home count is known
  spreadFt: number; // max pairwise centroid distance
  cities: string[];
  zone: string | null; // shared zoning code, null when members differ or any is unknown
  unknownCount: number; // members with verdict UNKNOWN
  center: [number, number];
  nearbyCandidates: number | null; // code-1 citywide points within radius of center; null if not supplied
};

export type ClusterResult = {
  radiusFt: number;
  groups: Cluster[]; // ranked; real groups (2+ sites) before singletons
  excluded: ClusterSite[]; // verdict NO
  nearest: Record<string, { id: string; distFt: number } | null>; // per viable listing
};

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
export const feetToMiles = (ft: number) => ft / FT_PER_MILE;

/** Zoning code from the zoning check value, e.g. "R1 (Single-Family Residence)" -> "R1". */
export function zoneCode(value: string | undefined): string | null {
  const m = value?.trim().match(/^([A-Z0-9-]+)/);
  return m ? m[1] : null;
}

/** Reduce a SiteResult to what clustering needs. Null when there is no parcel geometry. */
export function toClusterSite(r: SiteResult): ClusterSite | null {
  if (!r.parcel?.rings?.length) return null;
  const [x, y] = centroid(largestRing(r.parcel.rings));
  return {
    id: r.id, address: r.address, city: r.city, verdict: r.verdict,
    homes: r.max_homes, price: r.asking_price,
    zone: zoneCode(r.checks.find((c) => c.id === "zoning")?.value), x, y,
  };
}

function diameter(sites: ClusterSite[]): number {
  let d = 0;
  for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) d = Math.max(d, dist(sites[i], sites[j]));
  return d;
}

/**
 * Complete-linkage grouping: repeatedly merge the two closest groups as long as every pair of sites in the
 * merged group is within radiusFt. So "all within the radius" holds for every group (no chaining).
 */
export function groupSites(sites: ClusterSite[], radiusFt: number): ClusterSite[][] {
  let groups = sites.map((s) => [s]);
  for (;;) {
    let best: [number, number, number] | null = null;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const d = diameter([...groups[i], ...groups[j]]);
        if (d <= radiusFt && (!best || d < best[2])) best = [i, j, d];
      }
    }
    if (!best) return groups;
    const [i, j] = best;
    groups = [...groups.filter((_, k) => k !== i && k !== j), [...groups[i], ...groups[j]]];
  }
}

export function countWithin(points: [number, number][], cx: number, cy: number, radiusFt: number): number {
  const r2 = radiusFt * radiusFt;
  let n = 0;
  for (const [x, y] of points) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r2) n++; }
  return n;
}

function summarize(members: ClusterSite[], radiusFt: number, points: [number, number][] | null): Omit<Cluster, "key" | "label"> {
  const homesKnown = members.filter((m) => m.homes != null);
  const priceKnown = members.filter((m) => m.price != null);
  const homes = homesKnown.reduce((s, m) => s + (m.homes ?? 0), 0);
  const totalAsking = priceKnown.reduce((s, m) => s + (m.price ?? 0), 0);
  const allKnown = homesKnown.length === members.length && priceKnown.length === members.length;
  const zones = new Set(members.map((m) => m.zone));
  const center: [number, number] = [
    members.reduce((s, m) => s + m.x, 0) / members.length,
    members.reduce((s, m) => s + m.y, 0) / members.length,
  ];
  const zone = zones.size === 1 ? [...zones][0] : null;
  return {
    members: [...members].sort((a, b) => a.address.localeCompare(b.address)),
    homes, homesUnknown: members.length - homesKnown.length,
    totalAsking, priceUnknown: members.length - priceKnown.length,
    avgPerHome: allKnown && homes > 0 ? totalAsking / homes : null,
    spreadFt: diameter(members),
    cities: [...new Set(members.map((m) => m.city))].sort(),
    zone,
    unknownCount: members.filter((m) => m.verdict === "UNKNOWN").length,
    center,
    nearbyCandidates: points ? countWithin(points, center[0], center[1], radiusFt) : null,
  };
}

/**
 * Rank: real groups (2+ sites) before singletons; then fewer distinct cities (mixing cities means two
 * planning desks); then more homes; lower average asking per home; tighter spread; fewer UNKNOWN members.
 */
export function compareClusters(a: Omit<Cluster, "key" | "label">, b: Omit<Cluster, "key" | "label">): number {
  const real = (c: typeof a) => (c.members.length > 1 ? 0 : 1);
  return (
    real(a) - real(b) ||
    a.cities.length - b.cities.length ||
    b.homes - a.homes ||
    (a.avgPerHome ?? Infinity) - (b.avgPerHome ?? Infinity) ||
    a.spreadFt - b.spreadFt ||
    a.unknownCount - b.unknownCount
  );
}

const letter = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(65 + Math.floor(i / 26) - 1)}${String.fromCharCode(65 + (i % 26))}`);

/**
 * Cluster the listings. Only LIKELY YES and UNKNOWN are members; NO sites come back in `excluded`.
 * `points` are citywide first-screen candidate centroids (code 1) in feet, or null to skip that count.
 */
export function clusterSites(all: ClusterSite[], radiusFt = DEFAULT_RADIUS_FT, points: [number, number][] | null = null): ClusterResult {
  const viable = all.filter((s) => s.verdict === "LIKELY YES" || s.verdict === "UNKNOWN");
  const excluded = all.filter((s) => s.verdict === "NO");
  const groups = groupSites(viable, radiusFt)
    .map((g) => summarize(g, radiusFt, points))
    .sort(compareClusters)
    .map((c, i) => ({ ...c, key: letter(i).toLowerCase(), label: c.members.length > 1 ? `Group ${letter(i)}` : "On its own" }));
  const nearest: ClusterResult["nearest"] = {};
  for (const s of viable) {
    let best: { id: string; distFt: number } | null = null;
    for (const o of viable) if (o.id !== s.id) { const d = dist(s, o); if (!best || d < best.distFt) best = { id: o.id, distFt: d }; }
    nearest[s.id] = best;
  }
  return { radiusFt, groups, excluded, nearest };
}

/** Citywide points [x, y, code] in 10 ft units from bbox min -> code-1 points in feet. */
export function candidatePointsFeet(bbox: number[], points: number[][]): [number, number][] {
  return points.filter((p) => p[2] === 1).map((p) => [bbox[0] + p[0] * 10, bbox[1] + p[1] * 10]);
}

export const fmtMiles = (ft: number) => {
  const mi = feetToMiles(ft);
  return mi < 0.1 ? `${Math.round(ft).toLocaleString("en-US")} ft` : `${mi.toFixed(mi < 1 ? 2 : 1)} mi`;
};
