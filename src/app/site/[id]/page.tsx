import Link from "next/link";
import { notFound } from "next/navigation";
import Checklist from "@/components/Checklist";
import CostCompare from "@/components/CostCompare";
import LotSvg from "@/components/LotSvg";
import { RESULTS, getSite } from "@/lib/results";

export function generateStaticParams() {
  return RESULTS.results.map((r) => ({ id: r.id }));
}

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getSite(id);
  if (!r) notFound();
  const ev = r.listing_evidence;
  return (
    <section>
      <p><Link href="/">← All sites</Link></p>
      <h1 style={{ marginBottom: 4 }}>{r.address}, {r.city}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {r.parcel ? `APN ${r.parcel.apn} · lot ${Math.round(r.parcel.area_sqft).toLocaleString()} sq ft from the city parcel polygon` : "No parcel match"}
        {r.listed_lot_sqft ? ` · listing says ${r.listed_lot_sqft.toLocaleString()} sq ft` : ""}
        {r.listing_source_url && <> · <a href={r.listing_source_url} target="_blank" rel="noreferrer">listing</a> (collected {r.date_collected})</>}
      </p>
      <p style={{ fontSize: 17 }}>
        <span className={`status verdict-${r.verdict.replace(" ", "_")}`} style={{ fontSize: 15 }}>{r.verdict}</span>{" "}
        {r.verdict_reason} <span className="muted">Max homes: {r.max_homes ?? "UNKNOWN"}.</span>
      </p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 300px" }}>
          {r.parcel ? <LotSvg parcel={r.parcel} split={r.split} homes={r.max_homes} /> : <p>No parcel polygon.</p>}
        </div>
        <div style={{ flex: "1 1 340px" }}>
          <CostCompare price={r.asking_price} homes={r.max_homes} perHome={r.land_cost_per_home} />
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Listing evidence (read by Claude)</h3>
            <p className="muted">{ev.note}{ev.model ? ` Model: ${ev.model}.` : ""} Claude can flag a possible problem; it cannot make a test pass.</p>
            {ev.flags.length ? (
              <ul>
                {ev.flags.map((f) => (
                  <li key={f.flag}>{f.flag.replace("_", " ")}: <strong>{f.present ? "yes" : "not stated"}</strong>{f.quote ? <> · &ldquo;{f.quote}&rdquo;{r.description_type === "summary" ? " (quoted from the collector's summary)" : ""}</> : null}</li>
                ))}
              </ul>
            ) : null}
            {r.description && <p className="muted">Listing text as collected{r.description_type === "summary" ? " (team member's summary, not verbatim listing text)" : ""}: {r.description}</p>}
          </div>
        </div>
      </div>
      <h2>SB 9 checklist</h2>
      <Checklist result={r} />
      <p className="muted">
        Rules from the <a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD SB 9 fact sheet (April 2026)</a> and the{" "}
        <a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf" target="_blank" rel="noreferrer">HCD SB 9 Fact Sheet (Sept 2024)</a>, read 2026-11-07. Results computed {r.computed_at.slice(0, 16).replace("T", " ")} UTC.
      </p>
    </section>
  );
}
