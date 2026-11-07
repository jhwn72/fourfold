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
import type { OffTarget, OffCluster } from "@/components/app/FourFoldApp";

export default function Home() {
  const rows = RESULTS.results;
  const listings = rows.map((r, i) => ({
    id: r.id, n: i + 1, verdict: r.verdict, ring: r.parcel ? r.parcel.rings[0] : null,
    split: r.split ? { lot_a: r.split.lot_a, lot_b: r.split.lot_b, line: r.split.line } : null,
    buildings: r.buildings ?? [], homes: r.max_homes,
  }));
  const pts = candidatePointsFeet(citywide.bbox, citywide.points as number[][]);
  const cl = clusterSites(rows.map(toClusterSite).filter((x): x is ClusterSite => x !== null), DEFAULT_RADIUS_FT, pts);
  const groups: AppGroup[] = cl.groups.map((g) => ({
    key: g.key, label: g.label, ids: g.members.map((m) => m.id), homes: g.homes, spread: fmtMiles(g.spreadFt),
    avgPerHome: g.avgPerHome == null ? null : Math.round(g.avgPerHome), nearby: g.nearbyCandidates,
  }));
  const c = citywide.counts;
  type Counts = { total: number; sf_zone: number; splittable: number; candidates: number; in_district: number; by_reason: Record<string, number> };
  const toCity = (k: Counts) => ({
    total: k.total, sf: k.sf_zone, splittable: k.splittable, candidates: k.candidates, inDistrict: k.in_district,
    reasons: Object.entries(k.by_reason) as [string, number][],
  });
  const city = toCity(c);
  const cities = { "Santa Ana": city, Anaheim: toCity(citywideAnaheim.counts), Fullerton: toCity(citywideFullerton.counts) };
  const leads = leadsData.results as unknown as SiteResult[];
  // Off-market targets and clusters: not for sale, owners not contacted. Only the fields the app shows.
  const targets: OffTarget[] = Object.values(proactive.cities).flatMap((cty) => cty.targets.map((t) => ({
    apn: t.apn, address: t.site_address, city: t.city, lotSqft: t.lot_sqft, zone: t.zone, cluster: t.cluster_id, reasons: t.reasons, centroid: t.centroid_ft as [number, number],
  })));
  const clusters: OffCluster[] = Object.values(offGroups.cities).flatMap((cty) => cty.groups.slice(0, 3).map((g) => ({
    id: g.id, city: g.city, count: g.count, median: g.median_area_sqft, center: g.center_ft as [number, number],
  })));
  // Slim the results passed to the browser: drop the raw listing description fields we don't show.
  return <FourFoldApp results={rows} listings={listings} groups={groups} city={city} cities={cities} leads={leads} targets={targets} clusters={clusters} ocProjects={comparables.projects.length} />;
}
