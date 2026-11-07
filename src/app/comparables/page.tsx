import { COMPARABLES, cityName, statusText, permitToCompletion } from "@/components/Comparables";
import s from "./comparables.module.css";

export const metadata = { title: "SB 9 comparables | FourFold" };

export default function ComparablesPage() {
  const { projects, source, context, field_notes, counts_by_city_year } = COMPARABLES;
  const years = [...new Set(projects.map((p) => p.year))].sort();
  const timing = permitToCompletion(projects);
  const jurisdictions = Object.keys(counts_by_city_year).length;
  const U = <span className={s.unknown}>UNKNOWN</span>;

  return (
    <main className="container">
      <header className={s.head}>
        <span className="eyebrow">Orange County · HCD Annual Progress Reports · {years[0]} to {years[years.length - 1]}</span>
        <h1>Recent SB 9 projects in Orange County<span className="second">As cities reported them to the state.</span></h1>
        <p className={s.lede}>
          Projects that Orange County cities labeled as SB 9 in their Housing Element Annual Progress Reports to HCD.
          Santa Ana is UNKNOWN: the city reports every year but labels no project as SB 9.
        </p>
      </header>

      <div className={`stats ${s.strip}`}>
        <div><div className="k">Labeled SB 9 projects</div><div className="v">{projects.length}</div></div>
        <div><div className="k">Jurisdictions</div><div className="v">{jurisdictions}</div></div>
        <div><div className="k">Santa Ana</div><div className={`v ${s.unknownV}`}>UNKNOWN</div><div className={s.sub}>none labeled SB 9</div></div>
        <div>
          <div className="k">Median permit to completion</div>
          {timing
            ? <><div className="v">{timing.medianMonths} mo</div><div className={s.sub}>n = {timing.n} with both dates</div></>
            : <div className={`v ${s.unknownV}`}>UNKNOWN</div>}
        </div>
      </div>

      <section className={s.section}>
        <h2>Counts by city and year</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Jurisdiction</th>{years.map((y) => <th key={y} className={s.right}>{y}</th>)}<th className={s.right}>Total</th></tr>
            </thead>
            <tbody>
              {Object.entries(counts_by_city_year).map(([city, ys]) => (
                <tr key={city}>
                  <td>{cityName(city)}</td>
                  {years.map((y) => <td key={y} className={`${s.mono} ${s.right}`}>{ys[y] ?? 0}</td>)}
                  <td className={`${s.mono} ${s.right}`}>{Object.values(ys).reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
              <tr><td>Santa Ana</td>{years.map((y) => <td key={y} className={s.right}>{U}</td>)}<td className={s.right}>{U}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.section}>
        <h2>All projects</h2>
        <details className={s.details}>
          <summary>Show all {projects.length}</summary>
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
                    <td className={s.mono}>{p.apn || U}</td>
                    <td className={s.mono}>{p.years_reported.join(", ")}</td>
                    <td className={s.mono}>{p.units ?? U}</td>
                    <td>{p.unit_type || U}</td>
                    <td>{p.tenure || U}</td>
                    <td className={s.mono}>{p.dates.application_submitted ?? ""}</td>
                    <td className={s.mono}>{p.dates.entitled ?? ""}</td>
                    <td className={s.mono}>{p.dates.permitted ?? ""}</td>
                    <td className={s.mono}>{p.dates.completed ?? ""}</td>
                    <td>{statusText(p)}</td>
                    <td>{p.lot_split ? "Yes (stated)" : U}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className={s.section}>
        <h2>How to read this</h2>
        <ul className={s.notes}>{field_notes.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className={s.notes} style={{ paddingLeft: 0 }}>
          Context: {context.finding}{" "}
          <a href={context.url} target="_blank" rel="noreferrer">{context.name}</a>, checked {context.checked}.
        </p>
        <p className={s.source}>
          Source: <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>, checked {source.checked}. Data generated{" "}
          {COMPARABLES.generated_at.slice(0, 10)}. Rebuild with <code>npm run comparables</code>. Prototype only, not legal advice.
        </p>
      </section>
    </main>
  );
}
