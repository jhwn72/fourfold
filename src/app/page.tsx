import Landing from "@/components/landing/Landing";
import type { TileListing } from "@/components/landing/tiles";
import { RESULTS } from "@/lib/results";
// Server component: reads the small data the landing page needs and passes a slim copy to the browser.
import cityMeta from "../../public/city-points.json";

export default function Page() {
  const rows = RESULTS.results;
  const listings: TileListing[] = rows
    .filter((r) => r.parcel && r.parcel.rings[0])
    .map((r) => ({
      n: rows.indexOf(r) + 1,
      address: r.address,
      verdict: r.verdict,
      homes: r.max_homes ?? 0,
      ring: r.parcel!.rings[0] as number[][],
      line: r.split && (r.max_homes ?? 0) >= 4 ? (r.split.line as number[][]) : null,
      lots: r.split && (r.max_homes ?? 0) >= 4 ? [r.split.lot_a, r.split.lot_b] : null,
      buildings: (r.buildings ?? []) as number[][][],
    }));
  const stats = {
    listings: rows.length,
    parcels: cityMeta.counts.total,
    date: (RESULTS.generated_at ?? cityMeta.generated_at).slice(0, 10),
  };
  return <Landing listings={listings} bbox={cityMeta.bbox} stats={stats} />;
}
