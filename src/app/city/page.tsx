import Hint from "@/components/Hint";
import data from "../../../data/citywide.json";
import CityHero from "@/components/viz/CityHero";
import CandidateList from "@/components/CandidateList";
import s from "./city.module.css";
import { Star, AssumeNote } from "@/components/Assume";

// The server reads counts, sources and candidates only. The parcel points are drawn by CityHero from
// public/city-points.bin, so the 57,926-point array is not embedded in this page.
type Citywide = {
  generated_at: string;
  sources: { name: string; url: string; checked: string }[];
  counts: { total: number; sf_zone: number; splittable: number; candidates: number; in_district: number; by_reason: Record<string, number> };
  candidates: { apn: string; address: string; area_sqft: number; zone: string }[];
};
const CITY = data as unknown as Citywide;

export const metadata = { title: "Whole city | FourFold" };

const n = (x: number) => x.toLocaleString("en-US");

const REASON_TEXT: Record<string, string> = {
  not_sf_zone: "not in a single-family zone (R1 or RE)",
  shared_polygon: "share one lot with other parcels (usually condos or mobile homes)",
  too_small: "too small to split into two 1,200 sq ft lots",
  flood: "center point in a FEMA high-risk flood zone",
  fire: "center point in a very high fire hazard zone",
  historic: "on the Santa Ana historic properties list",
};

export default function CityPage() {
  const c = CITY.counts;
  const rows = CITY.candidates.map((r) => [r.address, r.apn, r.area_sqft, r.zone] as [string, string, number, string]);
  const screened = CITY.generated_at.slice(0, 16).replace("T", " ");
  return (
    <section>
      <header className={s.head}>
        <span className="eyebrow">Santa Ana · citywide first screen · {screened} UTC</span>
        <h1>{n(CITY.counts.candidates)} Santa Ana lots pass the first screen<span className="second">Checked at parcel centers <Hint /></span></h1>
        <p className={s.lede}>
          Same rules as the address check, run once over the whole city from public map layers. Any city with parcel,
          zoning and hazard layers can be screened the same way.
        </p>
      </header>

      <div className={`stats ${s.funnel}`}>
        <div><div className="k">Parcels</div><div className="v">{n(c.total)}</div></div>
        <div><div className="k">Single-family</div><div className="v">{n(c.sf_zone)}</div></div>
        <div><div className="k">Big enough to split</div><div className="v">{n(c.splittable)}</div></div>
        <div><div className="k">Pass flood, fire, city historic list</div><div className="v accent">{n(c.candidates)}</div></div>
        <div><div className="k">+ In historic district (possible fail)</div><div className={`v ${s.unknownV}`}>+{n(c.in_district)}</div></div>
      </div>

      <CityHero height={560} />

      <div className={s.section}>
        <h2>Why parcels drop out</h2>
        <span className="eyebrow">Each parcel is counted once, under the first test it fails, in this order</span>
        <ul className={s.reasons}>
          {Object.entries(c.by_reason).map(([k, v]) => (
            <li key={k}>
              <span className={s.n}>{n(v)}</span>
              <span>{REASON_TEXT[k] ?? k}{k === "fire" && v === 0 ? " (the county fire hazard layer has no zones inside the city)" : ""}</span>
            </li>
          ))}
          <li>
            <span className={s.n}>{n(c.in_district)}</span>
            <span>inside a city historic district: possible fail, excluded if the house is a contributing structure</span>
          </li>
        </ul>
      </div>

      <div className={s.section}>
        <h2>Candidate lots</h2>
        <span className="eyebrow">Not listings · most of these homes are not for sale · no prices</span>
        <p className="muted" style={{ marginTop: 0 }}>Use &quot;Check live&quot; to run the full per-address check on any lot.</p>
        <CandidateList rows={rows} />
      </div>

      <div className={s.section}>
        <h2>How this screen works</h2>
        <ul className={s.notes}>
          <li>A first screen, not a verdict. Zoning, flood, fire and historic district are tested at each parcel&apos;s centroid, not its full outline, so lots on a boundary can be misread. The live check tests the whole parcel.</li>
          <li>Lot size comes from the parcel polygon (State Plane feet). Pass = an equal straight split gives two lots of at least 1,200 sq ft, neither under 40% (40% is <span className="label">UNVERIFIED</span> against statute text).</li>
          <li>Single-family zones are R1 and RE. RE is treated as single-family<Star />, confirm in the zoning code.</li>
          <li><AssumeNote style={{ margin: 0 }} /></li>
          <li>Parcels whose outline exactly matches another APN&apos;s are dropped as shared lots (usually condo or mobile-home units). This is a pattern in the data, not a recorded fact about each parcel.</li>
          <li>Flood uses the county copy of FEMA zones only; the live check also asks FEMA. The fire layer may predate CAL FIRE&apos;s 2025 maps.</li>
          <li>Still UNKNOWN for every lot: tenants in the last 3 years, rent restriction or Ellis Act, a prior SB 9 split, earthquake fault zones, wetlands and other environmental limits, and the State historic inventory.</li>
          <li>No owner or mailing information is downloaded or stored.</li>
        </ul>
        <span className="eyebrow" style={{ display: "block", marginTop: 16 }}>Sources</span>
        <ul className={s.sources}>
          {CITY.sources.map((src) => (
            <li key={src.url}><a href={src.url} target="_blank" rel="noreferrer">{src.name}</a>, checked {src.checked}</li>
          ))}
        </ul>
      </div>

      <div className={s.links}>
        <a href="/city.csv">Export citywide lots (CSV) ↓</a>
        <a href="/comparables">Labeled SB 9 projects in Orange County →</a>
      </div>
    </section>
  );
}
