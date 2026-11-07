import FourFoldApp, { type AppGroup } from "@/components/app/FourFoldApp";
import { candidatePointsFeet, clusterSites, DEFAULT_RADIUS_FT, fmtMiles, toClusterSite, type ClusterSite } from "@/lib/clusters";
import { RESULTS } from "@/lib/results";
// Server component: read at build time, not shipped whole to the browser.
import citywide from "../../data/citywide.json";
import comparables from "../../data/comparables.json";

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
    avgPerHome: g.avgPerHome, nearby: g.nearbyCandidates,
  }));
  const c = citywide.counts;
  const city = {
    total: c.total, sf: c.sf_zone, splittable: c.splittable, candidates: c.candidates, inDistrict: c.in_district,
    reasons: Object.entries(c.by_reason) as [string, number][],
  };
  // Slim the results passed to the browser: drop the raw listing description fields we don't show.
  return <FourFoldApp results={rows} listings={listings} groups={groups} city={city} ocProjects={comparables.projects.length} />;
}
