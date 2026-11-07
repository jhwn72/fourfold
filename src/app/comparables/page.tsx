import { COMPARABLES, cityName, statusText, permitToCompletion } from "@/components/Comparables";

export const metadata = { title: "SB 9 comparables | FourFold" };

export default function ComparablesPage() {
  const { projects, source, context, field_notes, counts_by_city_year } = COMPARABLES;
  const years = [...new Set(projects.map((p) => p.year))].sort();
  const timing = permitToCompletion(projects);

  return (
    <main className="container">
      <h1>Recent SB 9 projects in Orange County</h1>
      <p>
        {projects.length} projects that Orange County cities labeled as SB 9 in their Housing Element Annual Progress Reports to
        HCD. Santa Ana: UNKNOWN (the city reports every year but labels no project as SB 9).
        {timing && ` Median building permit to completion: ${timing.medianMonths} months (${timing.n} projects with both dates).`}
      </p>

      <h2>Counts by city and year</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Jurisdiction</th>{years.map((y) => <th key={y}>{y}</th>)}<th>Total</th></tr>
          </thead>
          <tbody>
            {Object.entries(counts_by_city_year).map(([city, ys]) => (
              <tr key={city}>
                <td>{cityName(city)}</td>
                {years.map((y) => <td key={y}>{ys[y] ?? 0}</td>)}
                <td>{Object.values(ys).reduce((a, b) => a + b, 0)}</td>
              </tr>
            ))}
            <tr><td>Santa Ana</td>{years.map((y) => <td key={y}>UNKNOWN</td>)}<td>UNKNOWN</td></tr>
          </tbody>
        </table>
      </div>

      <h2>All projects</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Jurisdiction</th><th>Address</th><th>APN</th><th>Year</th><th>Units</th><th>Type</th><th>Tenure</th>
              <th>Applied</th><th>Approved</th><th>Permit</th><th>Completed</th><th>Status</th><th>Lot split</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={`${p.jurisdiction}-${p.apn}-${p.address}`}>
                <td>{cityName(p.jurisdiction)}</td>
                <td>{p.address}</td>
                <td>{p.apn || "UNKNOWN"}</td>
                <td>{p.years_reported.join(", ")}</td>
                <td>{p.units ?? "UNKNOWN"}</td>
                <td>{p.unit_type || "UNKNOWN"}</td>
                <td>{p.tenure || "UNKNOWN"}</td>
                <td>{p.dates.application_submitted ?? ""}</td>
                <td>{p.dates.entitled ?? ""}</td>
                <td>{p.dates.permitted ?? ""}</td>
                <td>{p.dates.completed ?? ""}</td>
                <td>{statusText(p)}</td>
                <td>{p.lot_split ? "Yes (stated)" : "UNKNOWN"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>How to read this</h2>
      <ul>{field_notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <p>
        Context: {context.finding}{" "}
        <a href={context.url} target="_blank" rel="noreferrer">{context.name}</a>, checked {context.checked}.
      </p>
      <p className="muted">
        Source: <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>, checked {source.checked}. Data generated{" "}
        {COMPARABLES.generated_at.slice(0, 10)}. Rebuild with <code>npm run comparables</code>. Prototype only, not legal advice.
      </p>
    </main>
  );
}
