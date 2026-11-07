// Print-optimized one-site briefing. Users save it as a PDF from the browser print dialog.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LotSvg from "@/components/LotSvg";
import PrintButton from "@/components/PrintButton";
import { money, perHomeText } from "@/components/Checklist";
import { RESULTS, getSite } from "@/lib/results";
import { buildCallSheet } from "@/lib/callsheet";
import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import "../../../print.css";
import { Star, AssumeNote } from "@/components/Assume";

export function generateStaticParams() {
  return RESULTS.results.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = getSite(id);
  return { title: r ? `FourFold site briefing: ${r.address}` : "FourFold site briefing" };
}

const statusText = (c: { status: string; affects_verdict: boolean; possible_fail?: boolean }) =>
  c.possible_fail ? "POSSIBLE FAIL" : c.affects_verdict ? c.status : c.status === "PASS" ? "YES" : c.status === "FAIL" ? "NO" : "UNKNOWN";

export default async function SiteBrief({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getSite(id);
  if (!r) notFound();
  const rank = RESULTS.results.findIndex((x) => x.id === r.id) + 1;
  const ev = r.listing_evidence;
  const { groups } = buildCallSheet(r);
  const per = r.land_cost_per_home;
  return (
    <article className="brief-page">
      <p className="no-print"><Link href={`/site/${r.id}`}>Back to site page</Link> · <PrintButton /></p>
      <h1>FourFold site briefing</h1>
      <p style={{ marginTop: 0 }}>
        <strong>{r.address}, {r.city}</strong> · {r.parcel ? `APN ${r.parcel.apn}` : "No parcel match"} · Rank {rank} of {RESULTS.results.length}
        <br />
        <span className="muted">Listing collected {r.date_collected}. Checks computed {r.computed_at.slice(0, 16).replace("T", " ")} UTC.</span>
      </p>
      <p>
        <span className={`status verdict-${r.verdict.replace(" ", "_")}`}>{r.verdict}</span> {r.verdict_reason}
      </p>

      <div className="brief-top">
        <div style={{ flex: "0 1 260px" }}>
          {r.parcel ? <LotSvg parcel={r.parcel} split={r.split} homes={r.max_homes} buildings={r.buildings} keep={r.keep_house} /> : <p>No parcel polygon.</p>}
        </div>
        <div style={{ flex: "1 1 280px" }}>
          <h2 style={{ marginTop: 0 }}>Key numbers</h2>
          <div className="key-numbers">
            <div><div className="muted">Asking price</div><strong>{money(r.asking_price)}</strong></div>
            <div><div className="muted">Max homes under SB 9</div><strong>{r.max_homes ?? "UNKNOWN"}</strong></div>
            <div><div className="muted">Land and building purchase per home, before construction</div><strong>{perHomeText(per, r.max_homes)}</strong></div>
            <div>
              <div className="muted">Brief&apos;s worked example per home<Star /></div>
              <strong>{money(BRIEF_LAND_PER_HOME)}</strong>
              <AssumeNote style={{ marginTop: 4 }} />
              {per != null && <div className="muted">This site is {per <= BRIEF_LAND_PER_HOME ? "below" : "above"} the example by {money(Math.abs(BRIEF_LAND_PER_HOME - per))}.</div>}
            </div>
          </div>
          <p className="muted">
            Lot: {r.parcel ? `${Math.round(r.parcel.area_sqft).toLocaleString()} sq ft from the city parcel polygon` : "UNKNOWN"}
            {r.listed_lot_sqft ? `; listing says ${r.listed_lot_sqft.toLocaleString()} sq ft` : ""}.
            Per home = asking price ÷ max homes. The $360k figure is the challenge brief&apos;s worked example, not a real deal.
          </p>
          <p className="url">Listing: {r.listing_source_url || "none"}</p>
        </div>
      </div>

      <h2>SB 9 checklist</h2>
      <div className="table-wrap">
        <table className="brief-table">
          <thead><tr><th>Test</th><th>Result</th><th>Value and notes</th><th>Source and date checked</th></tr></thead>
          <tbody>
            {r.checks.map((c) => (
              <tr key={c.id}>
                <td>{c.test}<div className="muted">{c.rule}</div></td>
                <td><span className={`status ${c.possible_fail ? "FAIL" : c.status}`}>{statusText(c)}</span></td>
                <td>{c.value}<div className="muted">{c.note}{c.next_step ? ` Next: ${c.next_step}` : ""}</div></td>
                <td>{c.source_name}<div className="muted">{c.checked_at.slice(0, 10)}</div><div className="url">{c.source_url}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="avoid-break">
        <h2>Listing evidence (read by Claude)</h2>
        <p className="muted">{ev.note}{ev.model ? ` Model: ${ev.model}.` : ""} Claude can flag a possible problem; it cannot make a test pass.</p>
        {ev.flags.length ? (
          <ul>
            {ev.flags.map((f) => (
              <li key={f.flag}>{f.flag.replace("_", " ")}: <strong>{f.present ? "yes" : "not stated"}</strong>{f.quote ? <> · &ldquo;{f.quote}&rdquo;{r.description_type === "summary" ? " (quoted from the collector's summary)" : ""}</> : null}</li>
            ))}
          </ul>
        ) : <p>No flags.</p>}
        {r.description && <p className="muted">Listing text as collected{r.description_type === "summary" ? " (team member's summary, not verbatim listing text)" : ""}: {r.description}</p>}
      </div>

      <h2>Questions to ask before an offer</h2>
      {groups.length ? groups.map(([who, items]) => (
        <div key={who} className="avoid-break">
          <strong>{who}</strong>
          <ol>
            {items.map((it, i) => <li key={i}>{it.question} <span className="muted">{it.why}</span></li>)}
          </ol>
        </div>
      )) : <p>No open questions from the checklist.</p>}

      <p className="muted">
        Rules from the HCD SB 9 fact sheet (April 2026), https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf,
        and the HCD SB 9 Fact Sheet (Sept 2024), https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf, read 2026-11-07.
        FourFold drafts questions; it does not contact anyone.
      </p>
      <p className="disclaimer">Prototype. Not legal or financial advice. Confirm with the city and a professional.</p>
    </article>
  );
}
