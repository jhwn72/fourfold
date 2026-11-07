import Link from "next/link";
import LiveCheck from "@/components/LiveCheck";
import { money } from "@/components/Checklist";
import { RESULTS } from "@/lib/results";
import { BRIEF_LAND_PER_HOME } from "@/lib/sb9";

export default function Home() {
  const rows = RESULTS.results;
  return (
    <section>
      <h1>FourFold</h1>
      <p>
        Investors can&apos;t split a lot under SB 9 unless they live there for 3 years. Nonprofits and community land trusts
        are exempt (<a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD SB 9 fact sheet, April 2026, p.2</a>).
        FourFold finds the houses for sale where a nonprofit can turn one home into four.
      </p>
      <h2>Santa Ana: homes for sale, ranked</h2>
      <p className="muted">
        {rows.length} listings collected by hand on 2026-11-07. Ranked: LIKELY YES first, then lowest land cost per home, then fewest unknowns.
        Eligibility is decided by code from city, county, FEMA and CAL FIRE data. Claude only reads the listing text for tenant or vacancy clues.
        {RESULTS.generated_at ? ` Checks run ${RESULTS.generated_at.slice(0, 16).replace("T", " ")} UTC.` : ""}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Address</th><th>Verdict</th><th>Max homes</th><th>Asking price</th><th>Per home</th><th>Unknowns</th><th>Why</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td><Link href={`/site/${r.id}`}>{r.address}</Link><div className="muted">{r.parcel ? `APN ${r.parcel.apn}` : "no parcel match"}</div></td>
                <td><span className={`status verdict-${r.verdict.replace(" ", "_")}`}>{r.verdict}</span></td>
                <td>{r.max_homes ?? "UNKNOWN"}</td>
                <td>{money(r.asking_price)}</td>
                <td>{money(r.land_cost_per_home)}{r.land_cost_per_home != null && <div className="muted">{r.land_cost_per_home <= BRIEF_LAND_PER_HOME ? "below" : "above"} $360k example</div>}</td>
                <td>{r.unknown_count}</td>
                <td className="muted">{r.verdict_reason}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8}>No results yet. Run <code>npm run precompute</code>.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="muted">Per home = asking price ÷ max homes: land and building purchase per home, before construction. $360k is the brief&apos;s worked example <span className="label">ASSUMPTION</span>.</p>
      <LiveCheck />
    </section>
  );
}
