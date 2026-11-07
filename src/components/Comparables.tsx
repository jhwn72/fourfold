// Recent SB 9 projects in Orange County from HCD APR data (data/comparables.json, built by scripts/comparables.ts).
// Server component. Every row is as the city reported it to HCD; nothing here is estimated.
import data from "../../data/comparables.json";

export type ComparableProject = {
  jurisdiction: string;
  year: number;
  years_reported: number[];
  address: string;
  apn: string;
  units: number | null;
  unit_type: string;
  tenure: string;
  income: Record<string, number>;
  dates: { application_submitted?: string; entitled?: string; permitted?: string; completed?: string };
  application_status?: string;
  lot_split: boolean | null;
  sb9_evidence: string[];
  tables: string[];
};
export type ComparablesData = {
  generated_at: string;
  source: { name: string; url: string; checked: string };
  context: { name: string; url: string; checked: string; finding: string };
  field_notes: string[];
  counts_by_city_year: Record<string, Record<string, number>>;
  projects: ComparableProject[];
};
export const COMPARABLES = data as unknown as ComparablesData;

const CITY_NAME: Record<string, string> = { "ORANGE COUNTY": "Unincorporated Orange County" };
export const cityName = (j: string) =>
  CITY_NAME[j] ?? j.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function statusText(p: ComparableProject): string {
  const d = p.dates;
  if (d.completed) return `Completed ${d.completed}`;
  if (d.permitted) return `Permit issued ${d.permitted}`;
  if (d.entitled) return `Approved ${d.entitled}`;
  if (d.application_submitted) return `Applied ${d.application_submitted}${p.application_status ? ` (${p.application_status.toLowerCase()})` : ""}`;
  return "Status UNKNOWN";
}

const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86400000;

/** Median days from building permit to certificate of occupancy, over projects that report both. */
export function permitToCompletion(projects: ComparableProject[]) {
  const xs = projects
    .filter((p) => p.dates.permitted && p.dates.completed)
    .map((p) => days(p.dates.permitted!, p.dates.completed!))
    .filter((x) => x >= 0)
    .sort((a, b) => a - b);
  if (!xs.length) return null;
  const m = xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2;
  return { n: xs.length, medianMonths: Math.round((m / 30.44) * 10) / 10 };
}

export default function Comparables({ address }: { address?: string }) {
  const { projects, source, context } = COMPARABLES;
  const santaAna = projects.filter((p) => p.jurisdiction === "SANTA ANA");
  const top = projects.slice(0, 8);
  const cities = Object.keys(COMPARABLES.counts_by_city_year).length;
  const years = [...new Set(projects.map((p) => p.year))].sort();
  const timing = permitToCompletion(projects);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Recent SB 9 projects nearby (from HCD APR data)</h3>
      <p>
        {santaAna.length
          ? `${santaAna.length} SB 9 projects reported in Santa Ana. `
          : "Santa Ana: UNKNOWN. The city reports to HCD every year but does not label any project as SB 9, so none can be identified. "}
        <strong>{projects.length}</strong> SB 9 projects labeled in {cities} Orange County jurisdictions&apos; reports for{" "}
        {years[0]} to {years[years.length - 1]}.
        {timing && ` Of the ${timing.n} with both a building permit and a completion date, the median time between them was ${timing.medianMonths} months.`}
        {address && " These are nearby examples for comparison, not matches for this address."}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Where</th><th>Address</th><th>Year</th><th>Units</th><th>Status</th></tr>
          </thead>
          <tbody>
            {top.map((p) => (
              <tr key={`${p.jurisdiction}-${p.apn}-${p.address}`}>
                <td>{cityName(p.jurisdiction)}</td>
                <td>{p.address}</td>
                <td>{p.year}</td>
                <td>{p.units ?? "UNKNOWN"}{p.lot_split ? " (lot split)" : ""}</td>
                <td>{statusText(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Found by searching city notes and tracking IDs for &quot;SB 9&quot;; the APR has no SB 9 field, so cities that do not
        label SB 9 work are missing. The data mostly cannot tell lot splits from second units or duplexes. Units are as the city
        reported for that record (usually the one new unit). For context, Terner Center found SB 9 use was modest in its first year
        (13 cities surveyed; San Diego reported 7 applications for new SB 9 units in 2022).{" "}
        <a href="/comparables">See all {projects.length}</a>. Source:{" "}
        <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>, checked {source.checked};{" "}
        <a href={context.url} target="_blank" rel="noreferrer">Terner Center, SB 9 Turns One</a> (2023-01-18), checked {context.checked}.
        Prototype only, not legal advice.
      </p>
    </div>
  );
}
