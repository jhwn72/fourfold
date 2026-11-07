import data from "../../../data/citywide.json";
import CityMap from "@/components/CityMap";
import CandidateList from "@/components/CandidateList";

type Citywide = {
  generated_at: string;
  sources: { name: string; url: string; checked: string }[];
  counts: { total: number; sf_zone: number; splittable: number; candidates: number; in_district: number; by_reason: Record<string, number> };
  bbox: [number, number, number, number];
  points: number[][];
  candidates: { apn: string; address: string; area_sqft: number; zone: string }[];
};
const CITY = data as unknown as Citywide;

export const metadata = { title: "Whole city | FourFold" };

const n = (x: number) => x.toLocaleString("en-US");

const REASON_TEXT: Record<string, string> = {
  not_sf_zone: "not in a single-family zone (R1 or RE)",
  shared_polygon: "share one lot outline with other APNs (typically condo or mobile-home units on a common lot)",
  too_small: "too small to split into two 1,200 sq ft lots",
  flood: "centroid in a FEMA special flood hazard area",
  fire: "centroid in a very high fire hazard severity zone",
  historic: "on the Santa Ana historic properties list",
};

export default function CityPage() {
  const c = CITY.counts;
  const [x0, y0, x1, y1] = CITY.bbox;
  const w = Math.ceil((x1 - x0) / 10), h = Math.ceil((y1 - y0) / 10);
  const rows = CITY.candidates.map((r) => [r.address, r.apn, r.area_sqft, r.zone] as [string, string, number, string]);
  return (
    <section>
      <h1>Every lot in Santa Ana</h1>
      <p>
        {n(c.sf_zone)} of {n(c.total)} Santa Ana parcels are zoned single-family; {n(c.splittable)} are big enough to split into two
        lots of at least 1,200 sq ft. <strong>{n(c.candidates)}</strong> pass flood, fire and the city historic list on a first screen,
        and {n(c.in_district)} more would pass but sit inside a historic district (possible fail).
      </p>
      <p className="muted">
        Same rules as the per-address check, run once over the whole city from public GIS layers. Screened {CITY.generated_at.slice(0, 16).replace("T", " ")} UTC.
        Any city with parcel, zoning and hazard layers can be screened the same way.
      </p>
      <div className="card">
        <CityMap points={CITY.points} width={w} height={h} />
      </div>
      <div className="card">
        <h2>Why parcels drop out</h2>
        <ul>
          {Object.entries(c.by_reason).map(([k, v]) => (
            <li key={k}>{n(v)} {REASON_TEXT[k] ?? k}{k === "fire" && v === 0 ? " (the county fire hazard layer has no zones inside the city)" : ""}</li>
          ))}
          <li>{n(c.in_district)} inside a city historic district: possible fail, excluded if the house is a contributing structure</li>
        </ul>
        <p className="muted">Each parcel is counted once, under the first test it fails, in the order listed.</p>
      </div>
      <div className="card">
        <h2>Candidate lots</h2>
        <p className="muted">Not listings: most of these homes are not for sale. Listing prices are not included. Use &quot;Check live&quot; to run the full per-address check.</p>
        <CandidateList rows={rows} />
      </div>
      <div className="card">
        <h2>How this screen works</h2>
        <ul>
          <li>A first screen, not a verdict. Zoning, flood, fire and historic district are tested at each parcel&apos;s centroid, not its full outline, so lots on a boundary can be misread. The live check tests the whole parcel.</li>
          <li>Lot size comes from the parcel polygon (State Plane feet). Pass = an equal straight split gives two lots of at least 1,200 sq ft, neither under 40% (40% is <span className="label">UNVERIFIED</span> against statute text).</li>
          <li>Single-family zones are R1 and RE. RE is treated as single-family: <span className="label">ASSUMPTION</span>, confirm in the zoning code.</li>
          <li>Parcels whose outline exactly matches another APN&apos;s are dropped as shared lots (usually condo or mobile-home units). This is a pattern in the data, not a recorded fact about each parcel.</li>
          <li>Flood uses the county copy of FEMA zones only; the live check also asks FEMA. The fire layer may predate CAL FIRE&apos;s 2025 maps.</li>
          <li>Still UNKNOWN for every lot: tenants in the last 3 years, rent restriction or Ellis Act, a prior SB 9 split, earthquake fault zones, wetlands and other environmental limits, and the State historic inventory.</li>
          <li>No owner or mailing information is downloaded or stored.</li>
        </ul>
        <p className="muted">Sources:</p>
        <ul className="muted">
          {CITY.sources.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a>, checked {s.checked}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
