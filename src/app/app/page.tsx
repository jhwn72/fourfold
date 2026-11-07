import FourFoldApp, { type AppGroup } from "@/components/app/FourFoldApp";
import { candidatePointsFeet, clusterSites, DEFAULT_RADIUS_FT, fmtMiles, toClusterSite, type ClusterSite } from "@/lib/clusters";
import { RESULTS } from "@/lib/results";
// Server component: read at build time, not shipped whole to the browser.
import citywide from "../../../data/citywide.json";
import comparables from "../../../data/comparables.json";
import citywideAnaheim from "../../../data/citywide-anaheim.json";
import citywideFullerton from "../../../data/citywide-fullerton.json";
import leadsData from "../../../data/leads-results.json";
import proactive from "../../../data/proactive-targets.json";
import offGroups from "../../../data/offmarket-groups.json";
import type { SiteResult } from "@/lib/types";
import type { OffTarget, OffCluster, AppArea } from "@/components/app/FourFoldApp";
import { areaSize, cityAreas, DENSE_LOTS_PER_CELL, type AreaPoint } from "@/lib/areas";

export default function Home() {
  const rows = RESULTS.results;
  const listings = rows.map((r, i) => ({
    id: r.id, n: i + 1, verdict: r.verdict, ring: r.parcel ? r.parcel.rings[0] : null,
    split: r.split ? { lot_a: r.split.lot_a, lot_b: r.split.lot_b, line: r.split.line } : null,
    buildings: r.buildings ?? [], homes: r.max_homes,
  }));
  const leads = leadsData.results as unknown as SiteResult[];
  // Areas: dense pockets of first-screen lots per city, with the for-sale listings, leads and off-market targets in each.
  const CITY_FILES = { "Santa Ana": citywide, Anaheim: citywideAnaheim, Fullerton: citywideFullerton } as const;
  const sitePts = (rs: SiteResult[], cty: string): AreaPoint[] => rs.map(toClusterSite).filter((x): x is ClusterSite => x !== null && x.city === cty).map((x) => ({ id: x.id, x: x.x, y: x.y }));
  const proCities = proactive.cities as Record<string, { targets: { apn: string; centroid_ft: number[] }[] }>;
  const areas: AppArea[] = (Object.keys(CITY_FILES) as (keyof typeof CITY_FILES)[]).flatMap((cty) => {
    const cw = CITY_FILES[cty];
    const tpts: AreaPoint[] = (proCities[cty]?.targets ?? []).map((t) => ({ id: t.apn, x: t.centroid_ft[0], y: t.centroid_ft[1] }));
    return cityAreas(cty, cw.candidates as { x: number; y: number }[], sitePts(rows, cty), sitePts(leads, cty), tpts).map((ar) => ({
      id: ar.id, city: ar.city, rank: ar.rank, label: ar.label, lots: ar.lots, upToHomes: ar.upToHomes,
      forSale: ar.forSale, leads: ar.leads, targets: ar.targets, cx: ar.center[0], cy: ar.center[1], spanFt: ar.spanFt, size: areaSize(ar.spanFt), cellCount: ar.cells.length, threshold: DENSE_LOTS_PER_CELL,
    }));
  });
  const inArea = new Set(areas.flatMap((ar) => [...ar.forSale, ...ar.leads]));
  // Listing groups: viable for-sale listings and leads within 0.5 mi of each other, clustered per city.
  // Only 2+ member groups that fall outside every area; letters run across cities (Santa Ana first).
  let gi = 0;
  const groups: AppGroup[] = (Object.keys(CITY_FILES) as (keyof typeof CITY_FILES)[]).flatMap((cty) => {
    const cw = CITY_FILES[cty];
    const pts = candidatePointsFeet(cw.bbox, cw.points as number[][]);
    const sites = [...rows, ...leads].map(toClusterSite).filter((x): x is ClusterSite => x !== null && x.city === cty);
    return clusterSites(sites, DEFAULT_RADIUS_FT, pts).groups
      .filter((g) => g.members.length > 1 && !g.members.some((m) => inArea.has(m.id)))
      .map((g) => {
        const L = String.fromCharCode(65 + gi++);
        const xs = g.members.map((m) => m.x), ys = g.members.map((m) => m.y);
        return {
          key: L.toLowerCase(), label: `Group ${L}`, city: cty, ids: g.members.map((m) => m.id), homes: g.homes, spread: fmtMiles(g.spreadFt),
          avgPerHome: g.avgPerHome == null ? null : Math.round(g.avgPerHome), nearby: g.nearbyCandidates,
          cx: g.center[0], cy: g.center[1], spanFt: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)),
        };
      });
  });
  const c = citywide.counts;
  type Counts = { total: number; sf_zone: number; splittable: number; candidates: number; in_district: number; by_reason: Record<string, number> };
  const toCity = (k: Counts) => ({
    total: k.total, sf: k.sf_zone, splittable: k.splittable, candidates: k.candidates, inDistrict: k.in_district,
    reasons: Object.entries(k.by_reason) as [string, number][],
  });
  const city = toCity(c);
  const cities = { "Santa Ana": city, Anaheim: toCity(citywideAnaheim.counts), Fullerton: toCity(citywideFullerton.counts) };
  // Off-market targets and clusters: not for sale, owners not contacted. Only the fields the app shows.
  const targets: OffTarget[] = Object.values(proactive.cities).flatMap((cty) => cty.targets.map((t) => ({
    apn: t.apn, address: t.site_address, city: t.city, lotSqft: t.lot_sqft, zone: t.zone, cluster: t.cluster_id, reasons: t.reasons, centroid: t.centroid_ft as [number, number],
  })));
  const clusters: OffCluster[] = Object.values(offGroups.cities).flatMap((cty) => cty.groups.slice(0, 3).map((g) => ({
    id: g.id, city: g.city, count: g.count, median: g.median_area_sqft, center: g.center_ft as [number, number],
  })));
  // Slim the results passed to the browser: drop the raw listing description fields we don't show.
  return <FourFoldApp results={rows} listings={listings} groups={groups} areas={areas} city={city} cities={cities} leads={leads} targets={targets} clusters={clusters} ocProjects={comparables.projects.length} />;
}
