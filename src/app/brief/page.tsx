// Printable handout: the ranked sites on one page, with the first open question for each from the call sheet.
import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { money, perHomeText } from "@/components/Checklist";
import { RESULTS } from "@/lib/results";
import { buildCallSheet } from "@/lib/callsheet";
import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import "../print.css";

export const metadata: Metadata = { title: "FourFold: sites to call this month" };

export default function BatchBrief() {
  const rows = RESULTS.results;
  return (
    <article className="brief-page">
      <p className="no-print"><Link href="/">Back to all sites</Link> · <PrintButton /> · <a href="/results.csv">Download CSV</a></p>
      <h1>FourFold: {rows.length} Santa Ana sites to call this month</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Listings collected by hand on 2026-11-07.{RESULTS.generated_at ? ` Checks run ${RESULTS.generated_at.slice(0, 16).replace("T", " ")} UTC.` : ""}{" "}
        Ranked: LIKELY YES first, then lowest land cost per home, then fewest unknowns.
      </p>
      <div className="table-wrap">
        <table className="brief-table">
          <thead><tr><th>#</th><th>Address</th><th>Verdict</th><th>Homes</th><th>Per home</th><th>Top open question</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const first = buildCallSheet(r).groups[0];
              const q = first?.[1][0];
              return (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.address}<div className="muted">{r.parcel ? `APN ${r.parcel.apn}` : "no parcel match"} · {money(r.asking_price)}</div></td>
                  <td><span className={`status verdict-${r.verdict.replace(" ", "_")}`}>{r.verdict}</span></td>
                  <td>{r.max_homes ?? "UNKNOWN"}</td>
                  <td>{perHomeText(r.land_cost_per_home, r.max_homes)}{r.land_cost_per_home != null && <div className="muted">{r.land_cost_per_home <= BRIEF_LAND_PER_HOME ? "below" : "above"} $360k example</div>}</td>
                  <td>{q ? <>{q.question}<div className="muted">Ask: {first[0]}</div></> : "None from the checklist"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Per home = asking price ÷ max homes: land and building purchase per home, before construction. $360k is the challenge brief&apos;s worked example <span className="label">ASSUMPTION</span>, not a real deal.
        Full checklist with sources for each site: fourfold-splitter.vercel.app/site/[id]/brief.
      </p>
      <p className="disclaimer">Prototype. Not legal or financial advice. Confirm with the city and a professional.</p>
    </article>
  );
}
