"use client";

import { useState } from "react";
import type { SiteResult } from "@/lib/types";
import { computeGap, donationImpact, parseMoney, type CostLine } from "@/lib/fund";

// ASSUMPTION: the brief's worked example, per home (docs/background.md, "Worked example: one home's bill",
// checked Nov 6, 2026; same numbers in lanes/3-fund-it/data/synthetic-example-deal.json). Mock numbers, not a real deal.
const EX_TIME = 85_000;
const EX_FEES = 50_000;
const EX_FAMILY = 285_000;
const EX_SUBSIDY = 100_000;
const EX_RENT = 55_000;

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

function MoneyInput({ id, label, value, onChange, chip }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  chip?: { text: string; fill?: number };
}) {
  return (
    <div style={{ margin: "10px 0" }}>
      <label htmlFor={id} style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input id={id} type="text" inputMode="numeric" placeholder="blank" value={value}
          onChange={(e) => onChange(e.target.value)} style={{ flex: "1 1 160px", maxWidth: 220 }} />
        {chip && (chip.fill != null ? (
          <button type="button" onClick={() => onChange(String(chip.fill))}
            style={{ fontSize: 12, padding: "3px 8px", cursor: "pointer", border: "1px solid #e0c98a", background: "#fff9e8", borderRadius: 4 }}>
            <span className="label">ASSUMPTION</span> use example: {chip.text}
          </button>
        ) : (
          <span className="muted" style={{ flex: "1 1 220px" }}>{chip.text}</span>
        ))}
      </div>
    </div>
  );
}

export default function FundGap({ r }: { r: SiteResult }) {
  const homes = r.max_homes ?? 0;
  const [build, setBuild] = useState("");
  const [time, setTime] = useState("");
  const [fees, setFees] = useState("");
  const [budget, setBudget] = useState("");
  const [sale, setSale] = useState("");
  const [subsidy, setSubsidy] = useState("");
  const [rent, setRent] = useState("");
  const [donation, setDonation] = useState("25000");

  if (!homes || homes <= 0) return null;

  const keep = r.keep_house === "fits_a" || r.keep_house === "fits_b";
  const added = keep ? homes - 1 : homes;

  const lines: CostLine[] = [
    { key: "land", label: "Land and building purchase", amount: r.asking_price },
    { key: "build", label: "New construction", amount: parseMoney(build) },
    { key: "time", label: "Time costs", amount: parseMoney(time) },
    { key: "fees", label: "Fees, design, legal, sales", amount: parseMoney(fees) },
  ];
  const result = computeGap(lines, [parseMoney(budget), parseMoney(sale), parseMoney(subsidy), parseMoney(rent)]);
  const don = parseMoney(donation) ?? 0;
  const impact = donationImpact(result, don, homes);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Fund the gap: whole project, {homes} homes</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        What the family can afford to pay + public subsidies + fundraising − the cost to create the home = $0.
        Source: Claude Impact Lab challenge brief, as quoted in docs/background.md (checked Nov 6, 2026).
      </p>

      <h4 style={{ marginBottom: 4 }}>Cost to create</h4>
      <div style={{ margin: "10px 0" }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Land and building purchase</div>
        <div>
          <strong>{r.asking_price != null ? fmt(r.asking_price) : "UNKNOWN"}</strong>{" "}
          <span className="muted">
            asking price from the{" "}
            {r.listing_source_url ? <a href={r.listing_source_url} target="_blank" rel="noreferrer">listing</a> : "listing"}
            {r.date_collected ? `, collected ${r.date_collected}` : ""}. Asking price is not the sale price.
          </span>
        </div>
      </div>
      <MoneyInput id="fg-build" label={`New construction cost (for the ${added} home${added === 1 ? "" : "s"} being added)`} value={build} onChange={setBuild}
        chip={{ text: "No example: the brief's $40k \"construction and repairs\" is for repairing one existing home, not building new homes. Enter a builder's estimate." }} />
      <MoneyInput id="fg-time" label="Time costs while waiting (loan interest, taxes, insurance)" value={time} onChange={setTime}
        chip={{ text: `brief example, $85k per home for time costs x ${homes} = ${fmt(EX_TIME * homes)}`, fill: EX_TIME * homes }} />
      <MoneyInput id="fg-fees" label="Fees, design, legal, sales" value={fees} onChange={setFees}
        chip={{ text: `brief example, $50k per home x ${homes} = ${fmt(EX_FEES * homes)}`, fill: EX_FEES * homes }} />

      <h4 style={{ marginBottom: 4 }}>Funding</h4>
      <MoneyInput id="fg-budget" label="Your budget (cash on hand)" value={budget} onChange={setBudget} />
      <MoneyInput id="fg-sale" label="Expected home sale proceeds, what families pay (optional)" value={sale} onChange={setSale}
        chip={{ text: `brief example, $285k per home x ${homes} = ${fmt(EX_FAMILY * homes)}`, fill: EX_FAMILY * homes }} />
      <MoneyInput id="fg-subsidy" label="Public subsidies (optional)" value={subsidy} onChange={setSubsidy}
        chip={{ text: `brief example, $100k per home x ${homes} = ${fmt(EX_SUBSIDY * homes)}`, fill: EX_SUBSIDY * homes }} />
      <MoneyInput id="fg-rent" label="Rent earned while waiting (optional)" value={rent} onChange={setRent}
        chip={{ text: `brief example, $55k per home x ${homes} = ${fmt(EX_RENT * homes)}`, fill: EX_RENT * homes }} />

      <h4 style={{ marginBottom: 4 }}>Result</h4>
      <table>
        <tbody>
          <tr><td>Total cost</td><td><strong>{result.totalCost != null ? fmt(result.totalCost) : "UNKNOWN"}</strong></td></tr>
          <tr><td>Total funding</td><td><strong>{fmt(result.totalFunding)}</strong></td></tr>
          <tr><td>Gap (cost − funding)</td><td><strong>
            {result.gap == null
              ? (r.asking_price == null ? "UNKNOWN: no asking price" : parseMoney(build) == null ? "UNKNOWN until you enter a construction estimate" : "UNKNOWN until every cost line is filled")
              : result.covered ? `Covered, with ${fmt(result.spare)} to spare` : fmt(result.gap)}
          </strong></td></tr>
        </tbody>
      </table>

      {result.gap != null && !result.covered && (
        <div style={{ marginTop: 10 }}>
          <div className="muted">Funding fills costs in order: land, then construction, time, fees. Still unfunded:</div>
          {result.lines.map((l) => {
            const amt = l.amount ?? 0;
            const pct = amt > 0 ? (l.funded / amt) * 100 : 100;
            return (
              <div key={l.key} style={{ margin: "6px 0", fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span>{l.label}</span>
                  <span>{(l.uncovered ?? 0) > 0 ? `${fmt(l.uncovered ?? 0)} unfunded of ${fmt(amt)}` : "funded"}</span>
                </div>
                <div style={{ height: 8, background: "#fbe4e4", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#7cc48a" }} />
                </div>
              </div>
            );
          })}

          <h4 style={{ marginBottom: 4 }}>Donor view</h4>
          <label htmlFor="fg-don" style={{ fontWeight: 600, fontSize: 14 }}>A donation of $</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input id="fg-don" type="text" inputMode="numeric" value={donation} onChange={(e) => setDonation(e.target.value)} style={{ flex: "1 1 120px", maxWidth: 160 }} />
            <input type="range" aria-label="Donation amount" min={0} max={Math.max(Math.ceil(result.gap / 5000) * 5000, 5000)} step={5000}
              value={Math.min(don, Math.max(Math.ceil(result.gap / 5000) * 5000, 5000))} onChange={(e) => setDonation(e.target.value)} style={{ flex: "1 1 200px" }} />
          </div>
          {impact ? (
            <p>
              covers <strong>{impact.sharePct.toFixed(impact.sharePct < 1 ? 2 : 0)}%</strong> of the remaining gap: it {impact.words}.
              {impact.gapPerHome != null && <> Remaining gap per home: <strong>{fmt(impact.gapPerHome)}</strong> ({fmt(result.gap)} ÷ {homes} homes); this donation is {fmt(impact.donationPerHome ?? 0)} per home.</>}
            </p>
          ) : <p className="muted">Enter a donation amount.</p>}
        </div>
      )}

      <p className="muted">
        Prototype. Every number you type is yours; examples are the brief&apos;s mock numbers (ASSUMPTION), not a quote.
        Not financial or lending advice; check with a professional before deciding.
      </p>
    </div>
  );
}
