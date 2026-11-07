import type { SiteResult } from "@/lib/types";
import { money } from "./Checklist";

// Why a nonprofit wins this house. HCD fact sheet (April 2026) p.2: an applicant for an urban lot split must sign an
// affidavit to live in one unit for 3 years, "unless the applicant is a community land trust or nonprofit organization."
export default function InvestorCard({ r }: { r: SiteResult }) {
  if (r.max_homes !== 4) return null;
  const keep = r.keep_house === "fits_a" || r.keep_house === "fits_b";
  return (
    <div className="card" style={{ background: "#f7fbf7" }}>
      <h3 style={{ marginTop: 0 }}>Why a nonprofit wins this house</h3>
      <table>
        <thead><tr><th></th><th>Investor who won&apos;t live there</th><th>Nonprofit or land trust</th></tr></thead>
        <tbody>
          <tr><td>Can split the lot under SB 9?</td><td>Only with a 3-year live-in promise</td><td>Yes, exempt from the promise</td></tr>
          <tr><td>Homes on this lot</td><td>Up to 2, no split</td><td><strong>Up to 4</strong>{keep ? " (keep the house, build 3)" : ""}</td></tr>
          <tr>
            <td>Purchase cost per home</td>
            <td>{r.asking_price != null ? <>{money(Math.round(r.asking_price / 2))} <span className="muted">({money(r.asking_price)} ÷ 2)</span></> : "UNKNOWN"}</td>
            <td><strong>{r.asking_price != null ? money(r.land_cost_per_home ?? Math.round(r.asking_price / 4)) : "UNKNOWN"}</strong>{r.asking_price != null && <span className="muted"> ({money(r.asking_price)} ÷ 4)</span>}</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">Source: <a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD SB 9 fact sheet, April 2026, p.2</a>. Purchase cost is the listing asking price, not the sale price, before construction. ADUs under ADU law are a separate path not counted here.</p>
    </div>
  );
}
