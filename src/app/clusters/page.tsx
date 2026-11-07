import cw from "../../../data/citywide.json";
import { RESULTS } from "@/lib/results";
import { candidatePointsFeet, clusterSites, toClusterSite, RADIUS_OPTIONS_FT, type ClusterSite } from "@/lib/clusters";
import ClusterView from "@/components/ClusterView";
import s from "./clusters.module.css";

export const metadata = { title: "Site groups | FourFold" };

type Citywide = { generated_at: string; bbox: number[]; points: number[][]; sources: { name: string; url: string; checked: string }[] };
const CITY = cw as unknown as Citywide;

export default function ClustersPage() {
  const sites = RESULTS.results.map(toClusterSite).filter((x): x is ClusterSite => x !== null);
  const noGeometry = RESULTS.results.filter((r) => !r.parcel?.rings?.length).map((r) => r.address);
  // Candidate counts are computed here so the ~25k citywide points never reach the browser.
  const pts = candidatePointsFeet(CITY.bbox, CITY.points);
  const results = RADIUS_OPTIONS_FT.map((r) => clusterSites(sites, r, pts));
  const collected = [...new Set(RESULTS.results.map((r) => r.date_collected))].sort().join(", ");
  return (
    <section>
      <header className={s.head}>
        <span className="eyebrow">{RESULTS.city} · {RESULTS.results.length} listings · collected {collected}</span>
        <h1>Site groups<span className="second">Buy close together. One city, one crew, one neighborhood.</span></h1>
        <p className={s.lede}>
          Building one house in each of ten places means ten acquisitions, ten plan checks and ten contractor
          mobilizations. Sites near each other can share one purchase push, one city planning desk, one crew and one
          community conversation. These groups put the listings that might work under SB 9 next to their neighbors.
        </p>
      </header>
      <ClusterView results={results} />
      {noGeometry.length > 0 && (
        <p className="muted">Not grouped, no parcel outline on file: {noGeometry.join(", ")}.</p>
      )}
      <p className="muted">
        Distances are between parcel centers in State Plane CA zone VI feet (parcel outlines from the city assessor
        layer in data/results.json). Nearby candidate lots come from the citywide first screen (
        {CITY.sources[0]?.name}, checked {CITY.sources[0]?.checked}; screen run {CITY.generated_at.slice(0, 10)}), and are
        a first screen, not verdicts. Asking price is the listing price, not a sale price. Prototype only, not legal,
        financial or lending advice; check decisions with a professional.
      </p>
    </section>
  );
}
