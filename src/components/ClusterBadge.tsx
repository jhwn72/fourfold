import Link from "next/link";
import { RESULTS } from "@/lib/results";
import { clusterSites, toClusterSite, fmtMiles, DEFAULT_RADIUS_FT, type ClusterSite } from "@/lib/clusters";

// One line for a site page: which nearby group this listing belongs to, at the default radius
// (ASSUMPTION: 0.5 mi, see src/lib/clusters.ts).
const RESULT = clusterSites(RESULTS.results.map(toClusterSite).filter((s): s is ClusterSite => s !== null), DEFAULT_RADIUS_FT);

export default function ClusterBadge({ id }: { id: string }) {
  if (RESULT.excluded.some((s) => s.id === id)) return null;
  const g = RESULT.groups.find((c) => c.members.some((m) => m.id === id));
  if (!g) return null;
  const radius = fmtMiles(RESULT.radiusFt);
  if (g.members.length < 2) {
    const near = RESULT.nearest[id];
    return (
      <p className="muted">
        No other viable listing within {radius}
        {near ? `; the nearest is ${fmtMiles(near.distFt)} away` : ""}. <Link href="/clusters">Site groups</Link>
      </p>
    );
  }
  return (
    <p className="muted">
      Part of <Link href={`/clusters#group-${g.key}`}>{g.label}</Link>: {g.members.length} sites,{" "}
      <span className="accent">{g.homes} homes</span> within {fmtMiles(g.spreadFt)}
    </p>
  );
}
