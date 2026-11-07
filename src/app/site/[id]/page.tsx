import Link from "next/link";
import { notFound } from "next/navigation";
import Checklist from "@/components/Checklist";
import CallSheet from "@/components/CallSheet";
import Comparables from "@/components/Comparables";
import FundGap from "@/components/FundGap";
import InvestorCard from "@/components/InvestorCard";
import AnimatedNumber from "@/components/site/AnimatedNumber";
import NextCallCard from "@/components/site/NextCallCard";
import SectionNav from "@/components/site/SectionNav";
import LotViewer from "@/components/viz/LotViewer";
import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import { RESULTS, getSite } from "@/lib/results";

export function generateStaticParams() {
  return RESULTS.results.map((r) => ({ id: r.id }));
}

const money = (n: number | null | undefined) => (n == null ? "UNKNOWN" : "$" + n.toLocaleString("en-US"));

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getSite(id);
  if (!r) notFound();
  const rank = RESULTS.results.findIndex((x) => x.id === r.id) + 1;
  const ev = r.listing_evidence;
  const firstFail = r.checks.find((c) => c.affects_verdict && c.status === "FAIL");
  const possible = r.checks.find((c) => c.affects_verdict && c.possible_fail);
  const open = r.checks.filter((c) => c.affects_verdict && c.status === "UNKNOWN").length;
  const four = r.max_homes === 4;
  const investor = r.asking_price ? Math.round(r.asking_price / 2) : null;
  const diff = r.land_cost_per_home != null ? BRIEF_LAND_PER_HOME - r.land_cost_per_home : null;
  const tenantQuote = ev.flags.find((f) => f.flag === "tenant_occupied" && f.present)?.quote;

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="eyebrow"><Link href="/" style={{ color: "inherit" }}>← All sites</Link> · Rank {rank} of {RESULTS.results.length}</span>
        <Link href={`/site/${r.id}/brief`} className="chip" style={{ textDecoration: "none" }}>Briefing PDF</Link>
      </div>

      <h1 style={{ marginBottom: 6 }}>
        {r.address}
        <span className="second">{r.city}, CA{r.parcel ? ` · APN ${r.parcel.apn}` : ""}</span>
      </h1>
      <p className="eyebrow" style={{ margin: "0 0 14px" }}>
        {r.parcel ? `Lot ${Math.round(r.parcel.area_sqft).toLocaleString()} sq ft (city polygon)` : "No parcel match"}
        {r.listed_lot_sqft ? ` · listing says ${r.listed_lot_sqft.toLocaleString()} sq ft` : ""}
        {r.listing_source_url && <> · <a href={r.listing_source_url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Listing</a> collected {r.date_collected}</>}
      </p>

      <p style={{ fontSize: 18, fontWeight: 300, margin: "0 0 18px", maxWidth: 920 }}>
        <span className={`status verdict-${r.verdict.replace(" ", "_")}`} style={{ marginRight: 10, verticalAlign: "middle" }}>{r.verdict}</span>
        {r.verdict_reason}
        {firstFail && <> <a href={firstFail.source_url} target="_blank" rel="noreferrer" className="muted">Source: {firstFail.source_name.split(",")[0]}</a></>}
        {!firstFail && possible?.id === "tenant" && tenantQuote && <span className="muted"> Listing says &ldquo;{tenantQuote}&rdquo; Confirm with the agent.</span>}
      </p>

      <div className="stats" style={{ marginBottom: 18 }}>
        <div><div className="k">Max homes</div><div className="v accent">{r.max_homes ?? "UNKNOWN"}</div></div>
        <div><div className="k">Asking price</div><div className="v">{money(r.asking_price)}</div></div>
        <div>
          <div className="k">Per home, nonprofit</div>
          <div className="v accent">{r.max_homes === 0 ? "n/a" : r.asking_price && r.land_cost_per_home ? <AnimatedNumber from={r.asking_price} to={r.land_cost_per_home} /> : "UNKNOWN"}</div>
          {diff != null && <div className="muted" style={{ fontSize: 11.5 }}>{money(Math.abs(diff))} {diff >= 0 ? "below" : "above"} the $360k example <span className="label">ASSUMPTION</span></div>}
        </div>
        {four && <div><div className="k">Per home, investor</div><div className="v">{money(investor)}</div><div className="muted" style={{ fontSize: 11.5 }}>no split unless they live there 3 years</div></div>}
        <div><div className="k">Open questions</div><div className="v">{open}</div><div className="muted" style={{ fontSize: 11.5 }}><a href="#call-sheet">who to call</a></div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "stretch" }}>
        <div style={{ minWidth: 0 }}>
          {r.parcel ? <LotViewer parcel={r.parcel} split={r.split} buildings={r.buildings} homes={r.max_homes} keep={r.keep_house} height={380} /> : <div className="card">No parcel polygon.</div>}
        </div>
        <div style={{ minWidth: 0 }}><NextCallCard r={r} /></div>
      </div>

      <SectionNav hide={four ? (r.max_homes ? [] : ["fund"]) : r.max_homes ? ["why-nonprofit"] : ["why-nonprofit", "fund"]} />

      <h2 id="checklist" style={{ scrollMarginTop: 120 }}>SB 9 checklist</h2>
      <Checklist result={r} showSummary={false} />
      <details className="card">
        <summary>What Claude read in the listing{tenantQuote ? ": tenant flagged" : ""}</summary>
        <p className="muted">{ev.note}{ev.model ? ` Model: ${ev.model}.` : ""} Claude can flag a possible problem; it cannot make a test pass.</p>
        {ev.flags.length ? (
          <ul>
            {ev.flags.map((f) => (
              <li key={f.flag}>{f.flag.replace("_", " ")}: <strong>{f.present ? "yes" : "not stated"}</strong>{f.quote ? <> · &ldquo;{f.quote}&rdquo;{r.description_type === "summary" ? " (quoted from the collector's summary)" : ""}</> : null}</li>
            ))}
          </ul>
        ) : null}
        {r.description && <p className="muted">Listing text as collected{r.description_type === "summary" ? " (team member's summary, not verbatim listing text)" : ""}: {r.description}</p>}
      </details>

      {four && <div id="why-nonprofit" style={{ scrollMarginTop: 120 }}><InvestorCard r={r} /></div>}
      <div id="call-sheet" style={{ scrollMarginTop: 120 }}><CallSheet result={r} /></div>
      {r.max_homes ? (
        <details id="fund" className="card" style={{ scrollMarginTop: 120 }}>
          <summary>Fund the gap: enter your budget and costs to see what is still needed and what a donation covers</summary>
          <FundGap r={r} />
        </details>
      ) : null}
      <div id="nearby" style={{ scrollMarginTop: 120 }}><Comparables address={r.address} /></div>
      <p id="sources" className="muted" style={{ scrollMarginTop: 120 }}>
        Rules from the <a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD SB 9 fact sheet (April 2026)</a> and the{" "}
        <a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf" target="_blank" rel="noreferrer">HCD SB 9 Fact Sheet (Sept 2024)</a>, read 2026-11-07. Results computed {r.computed_at.slice(0, 16).replace("T", " ")} UTC.
      </p>
    </section>
  );
}
