"use client";
// Window contents for a selected group: a checklist matrix, a merged call sheet and a combined fund-the-gap.
import { useMemo, useState } from "react";
import { computeGap, parseMoney, type CostLine } from "@/lib/fund";
import { groupAgentEmail, summarizeGroup } from "@/lib/groupSummary";
import type { CheckResult, SiteResult } from "@/lib/types";
import s from "./GroupCard.module.css";
import { Star, AssumeNote } from "@/components/Assume";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const short = (m: SiteResult) => m.address.split(",")[0];

function cell(c: CheckResult | undefined): [string, string] {
  if (!c) return ["UNKNOWN", "Not run"];
  if (c.possible_fail) return ["POSSIBLE", "Possible"];
  return [c.status, c.status === "PASS" ? "Pass" : c.status === "FAIL" ? "Fail" : "Unknown"];
}

/** Rows = SB 9 tests (verdict checks), columns = members. Hover a cell for what was found and the source. */
export function GroupChecklist({ members }: { members: SiteResult[] }) {
  const tests: { id: string; test: string; rule: string }[] = [];
  for (const m of members) for (const c of m.checks) if (c.affects_verdict && !tests.some((t) => t.id === c.id)) tests.push({ id: c.id, test: c.test, rule: c.rule });
  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>Each SB 9 test across the group. Hover a result for what was found; click it to open the source.</p>
      <div className="table-wrap">
        <table className={s.matrix}>
          <thead><tr><th>Test</th>{members.map((m) => <th key={m.id} title={m.address}>{short(m)}</th>)}</tr></thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td style={{ minWidth: 180 }}>{t.test.replace(/ \((bonus|site risk)[^)]*\)/, "")}<div className="faint" style={{ fontSize: 11 }}>{t.rule}</div></td>
                {members.map((m) => {
                  const c = m.checks.find((x) => x.id === t.id);
                  const [cls, word] = cell(c);
                  const chip = <span className={`status ${cls}`}>{word}</span>;
                  return (
                    <td key={m.id}>
                      {c?.source_url ? (
                        <a href={c.source_url} target="_blank" rel="noreferrer" title={`${c.value}${c.next_step ? `\nNext: ${c.next_step}` : ""}\nSource: ${c.source_name}, checked ${c.checked_at.slice(0, 10)}`}>{chip}</a>
                      ) : chip}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td><strong>Verdict</strong></td>
              {members.map((m) => <td key={m.id}><span className={`status verdict-${m.verdict.replace(" ", "_")}`}>{m.verdict}</span></td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: 11.5 }}>Site notes that do not change the verdict are in each site&apos;s own checklist.</p>
    </div>
  );
}

/** Open questions merged across members, by who to call. Drafts only; nothing is sent. */
export function GroupCallSheet({ members }: { members: SiteResult[] }) {
  const sum = useMemo(() => summarizeGroup(members, ""), [members]);
  const email = useMemo(() => groupAgentEmail(members, sum), [members, sum]);
  const [copied, setCopied] = useState(false);
  const addr = (id: string) => { const m = members.find((x) => x.id === id); return m ? short(m) : id; };
  if (!sum.contacts.length) return <p className="muted">No open questions across this group.</p>;
  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>Every open question across the group, as one set of calls. Contacts that clear the most questions come first. Drafts only; nothing is sent.</p>
      {sum.contacts.map((c) => (
        <div key={c.who}>
          <h4 className={s.who}>{c.who} <span className="faint" style={{ fontSize: 12, fontWeight: 400 }}>clears {c.clears} open item{c.clears === 1 ? "" : "s"}</span></h4>
          <ol style={{ marginTop: 0 }}>
            {c.questions.map((q) => (
              <li key={q.checkId + q.question} style={{ marginBottom: 6 }}>
                {q.question} <span className="muted">({q.why})</span>
                <span className={s.applies}>For: {q.memberIds.map(addr).join(", ")}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {email && (
        <details open>
          <summary>Draft email to the listing agent{members.length > 1 ? "s" : ""}</summary>
          <pre style={{ whiteSpace: "pre-wrap", padding: 10, fontSize: 13 }}>{email}</pre>
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(email); setCopied(true); } catch {} }}>{copied ? "Copied" : "Copy draft"}</button>
        </details>
      )}
    </div>
  );
}

// ASSUMPTION: the brief's worked example, per home (docs/background.md, "Worked example: one home's bill",
// checked Nov 6, 2026). Same mock numbers FundGap.tsx offers; never filled in unless the user clicks.
const EX = { time: 85_000, fees: 50_000, family: 285_000, subsidy: 100_000, rent: 55_000 };

function Money({ id, label, value, onChange, perHome, homes }: { id: string; label: string; value: string; onChange: (v: string) => void; perHome?: number; homes: number }) {
  return (
    <div style={{ margin: "8px 0" }}>
      <label htmlFor={id} style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input id={id} type="text" inputMode="numeric" placeholder="blank" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: "1 1 160px", maxWidth: 220 }} />
        {perHome != null && (
          <button type="button" onClick={() => onChange(String(perHome * homes))}
            style={{ fontSize: 12, padding: "3px 8px", cursor: "pointer", border: "1px solid var(--line)", background: "var(--possible-bg)", color: "var(--possible)", borderRadius: 4 }}>
            Use example: brief, {fmt(perHome)} per home x {homes} = {fmt(perHome * homes)}<Star />
          </button>
        )}
      </div>
    </div>
  );
}

/** Combined fund the gap for the whole group: real asking prices, everything else typed by the user. */
export function GroupFund({ members }: { members: SiteResult[] }) {
  const sum = useMemo(() => summarizeGroup(members, ""), [members]);
  const [build, setBuild] = useState("");
  const [time, setTime] = useState("");
  const [fees, setFees] = useState("");
  const [budget, setBudget] = useState("");
  const [sale, setSale] = useState("");
  const [subsidy, setSubsidy] = useState("");
  const [rent, setRent] = useState("");
  const homes = sum.homesUnknown ? 0 : sum.homes;
  if (!homes) return <p className="muted">Home count is UNKNOWN for at least one site, so a combined gap cannot be computed. Open each site&apos;s own Fund the gap.</p>;

  const land = sum.priceUnknown ? null : sum.totalAsking;
  const lines: CostLine[] = [
    { key: "land", label: "Land and building purchase (all sites)", amount: land },
    { key: "build", label: "New construction", amount: parseMoney(build) },
    { key: "time", label: "Time costs", amount: parseMoney(time) },
    { key: "fees", label: "Fees, design, legal, sales", amount: parseMoney(fees) },
  ];
  const r = computeGap(lines, [parseMoney(budget), parseMoney(sale), parseMoney(subsidy), parseMoney(rent)]);

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        What the family can afford to pay + public subsidies + fundraising − the cost to create the home = $0, across {members.length} sites and {homes} homes.
        Source: Claude Impact Lab challenge brief, sample numbers (checked Nov 6, 2026).
      </p>
      <h4 style={{ marginBottom: 4 }}>Land and building purchase</h4>
      <table>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.address}</td>
              <td>{m.max_homes ?? "UNKNOWN"} homes</td>
              <td><strong>{m.asking_price != null ? fmt(m.asking_price) : "UNKNOWN"}</strong> <span className="muted">asking, {m.listing_source_url ? <a href={m.listing_source_url} target="_blank" rel="noreferrer">listing</a> : "listing"}{m.date_collected ? `, ${m.date_collected}` : ""}</span></td>
            </tr>
          ))}
          <tr><td><strong>Combined</strong></td><td><strong>{homes} homes</strong></td><td><strong>{land != null ? fmt(land) : "UNKNOWN"}</strong>{sum.perHome != null && <span className="muted"> ({fmt(sum.perHome)} per home)</span>}</td></tr>
        </tbody>
      </table>
      <p className="faint" style={{ fontSize: 11.5 }}>Asking price is not the sale price.</p>

      <h4 style={{ marginBottom: 4 }}>Other costs</h4>
      <Money id="gf-build" label="New construction cost, all sites (enter a builder's estimate; the sample budget has no new-build example)" value={build} onChange={setBuild} homes={homes} />
      <Money id="gf-time" label="Time costs while waiting (loan interest, taxes, insurance)" value={time} onChange={setTime} perHome={EX.time} homes={homes} />
      <Money id="gf-fees" label="Fees, design, legal, sales" value={fees} onChange={setFees} perHome={EX.fees} homes={homes} />

      <h4 style={{ marginBottom: 4 }}>Funding</h4>
      <Money id="gf-budget" label="Your budget (cash on hand)" value={budget} onChange={setBudget} homes={homes} />
      <Money id="gf-sale" label="Expected home sale proceeds, what families pay (optional)" value={sale} onChange={setSale} perHome={EX.family} homes={homes} />
      <Money id="gf-subsidy" label="Public subsidies (optional)" value={subsidy} onChange={setSubsidy} perHome={EX.subsidy} homes={homes} />
      <Money id="gf-rent" label="Rent earned while waiting (optional)" value={rent} onChange={setRent} perHome={EX.rent} homes={homes} />

      <h4 style={{ marginBottom: 4 }}>Result</h4>
      <table>
        <tbody>
          <tr><td>Total cost</td><td><strong>{r.totalCost != null ? fmt(r.totalCost) : "UNKNOWN"}</strong></td></tr>
          <tr><td>Total funding</td><td><strong>{fmt(r.totalFunding)}</strong></td></tr>
          <tr><td>Gap (cost − funding)</td><td><strong>
            {r.gap == null ? (land == null ? "UNKNOWN: an asking price is missing" : parseMoney(build) == null ? "UNKNOWN until you enter a construction estimate" : "UNKNOWN until every cost line is filled")
              : r.covered ? `Covered, with ${fmt(r.spare)} to spare` : `${fmt(r.gap)} (${fmt(r.gap / homes)} per home)`}
          </strong></td></tr>
        </tbody>
      </table>
      <p className="muted">Prototype. Every number you type is yours; examples are illustrative sample numbers<Star />, not a quote. Not financial or lending advice; check with a professional before deciding.</p>
    </div>
  );
}
