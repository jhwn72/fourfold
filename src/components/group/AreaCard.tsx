"use client";
// The expanded area card: same layout and density as GroupCard and the selected-site card.
// Every number comes from data files via src/lib/areas.ts (built in src/app/app/page.tsx).
import type { SiteResult } from "@/lib/types";
import a from "../app/FourFoldApp.module.css";
import s from "./GroupCard.module.css";
import { Star } from "@/components/Assume";
import Tick from "../app/Tick";
import Hint from "@/components/Hint";
import type { AppArea, OffTarget } from "../app/FourFoldApp";

export type AreaWindow = "area-letters" | "area-checklist";

const money = (n: number | null | undefined) => (n == null ? "UNKNOWN" : "$" + Math.round(n).toLocaleString("en-US"));
const vClass = (v: string) => `status verdict-${v.replace(" ", "_")}`;
const vWord = (v: string) => (v === "LIKELY YES" ? "Yes" : v === "UNKNOWN" ? "Check" : "No");
const fmt = (n: number) => n.toLocaleString("en-US");
const titleCase = (x: string) => x.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

export default function AreaCard({ area, forSale, leads, targets, onBack, onSelectSite, onSelectTarget, onOpen }: {
  area: AppArea; forSale: SiteResult[]; leads: SiteResult[]; targets: OffTarget[];
  onBack: () => void; onSelectSite: (id: string) => void; onSelectTarget: (apn: string) => void; onOpen: (w: AreaWindow) => void;
}) {
  const rest = [
    forSale.length ? `${forSale.length} for sale now` : "",
    leads.length ? `${leads.length} unverified lead${leads.length === 1 ? "" : "s"}` : "",
    targets.length ? `${targets.length} off-market target${targets.length === 1 ? "" : "s"}` : "",
    `one city (${area.city}), one planning desk`,
  ].filter(Boolean).join(", ");
  return (
    <div className={a.site}>
      <button type="button" className={a.back} onClick={onBack}>← Back to areas</button>
      <div className="eyebrow">{area.label} · {area.size}</div>
      <h1 className={a.siteTitle} style={{ fontSize: 22 }}>{fmt(area.lots)} lots that pass the first screen</h1>
      <p className={a.reason}><span className={a.chip}>First screen</span> Public data, every lot still to check <Hint /></p>

      <div className={a.nums}>
        <div><div className="eyebrow">Lots</div><div className={`${a.big} accent`}><Tick value={area.lots} /></div></div>
        <div><div className="eyebrow">Up to</div><div className={`${a.big} accent`}><Tick value={area.upToHomes} /> homes<Star /></div></div>
        <div><div className="eyebrow">For sale</div><div className={a.big}><Tick value={forSale.length} /></div></div>
        <div><div className="eyebrow">Leads</div><div className={a.big}><Tick value={leads.length} /></div></div>
        <div><div className="eyebrow">Targets</div><div className={a.big}><Tick value={targets.length} /></div></div>
      </div>
      <p className="faint" style={{ fontSize: 11, margin: "6px 0 0" }}>Up to = lots × 4, an upper bound before any site is confirmed.</p>

      <p className={s.why}>Why this area: {fmt(area.lots)} first-screen lots in {area.cellCount} touching quarter-mile cells, each with at least {area.threshold} lots<Star />, {rest}.</p>

      <div className="card" style={{ padding: "8px 6px", margin: "0 0 10px" }}>
        <div className={`${s.mhead} eyebrow`}><span>For sale</span><span /><span>Homes</span><span>Per home</span></div>
        {forSale.length ? (
          <ol className={s.members}>
            {forSale.map((m) => (
              <li key={m.id}>
                <button type="button" className={s.mrow} onClick={() => onSelectSite(m.id)} title={`Open ${m.address}`}>
                  <span className={s.maddr}>{m.address}</span>
                  <span className={vClass(m.verdict)}>{vWord(m.verdict)}</span>
                  <span className={s.mnum}>{m.max_homes ?? "UNKNOWN"}</span>
                  <span className={s.mnum}>{m.max_homes === 0 ? "n/a" : money(m.land_cost_per_home)}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : <p className="muted" style={{ fontSize: 12.5, margin: "4px 8px 10px" }}>None listed in this area right now.</p>}

        <div className={`${s.mhead} eyebrow`} style={{ gridTemplateColumns: "1fr auto" }}><span>Leads <Hint tip="Unverified listings from web search. Confirm each on the listing page before any call." /></span><span /></div>
        {leads.length ? (
          <ol className={s.members}>
            {leads.map((m) => (
              <li key={m.id}>
                <button type="button" className={s.mrow} style={{ gridTemplateColumns: "1fr auto" }} onClick={() => onSelectSite(m.id)} title={`Open ${m.address}`}>
                  <span className={s.maddr}>{m.address}</span>
                  <span className={a.chip}>Unverified</span>
                </button>
              </li>
            ))}
          </ol>
        ) : <p className="muted" style={{ fontSize: 12.5, margin: "4px 8px 10px" }}>No leads in this area.</p>}

        <div className={`${s.mhead} eyebrow`} style={{ gridTemplateColumns: "1fr auto" }}><span>Off-market targets <Hint tip="Not for sale. Owners not contacted." /></span><span>Lot</span></div>
        {targets.length ? (
          <ol className={s.members}>
            {targets.map((t) => (
              <li key={t.apn}>
                <button type="button" className={s.mrow} style={{ gridTemplateColumns: "1fr auto" }} onClick={() => onSelectTarget(t.apn)} title={`Open ${titleCase(t.address)}`}>
                  <span className={s.maddr}>{titleCase(t.address)}</span>
                  <span className={s.mnum}>{fmt(t.lotSqft)} sq ft</span>
                </button>
              </li>
            ))}
          </ol>
        ) : <p className="muted" style={{ fontSize: 12.5, margin: "4px 8px 10px" }}>No ranked targets in this area yet.</p>}
      </div>

      <div className={a.next}>
        <div className="card" style={{ margin: 0 }}>
          <div className="eyebrow">Next call</div>
          <h3 style={{ margin: "6px 0 10px", fontSize: 20, fontWeight: 300 }}>{area.city} planning desk</h3>
          <ol style={{ paddingLeft: 18, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}>We are looking at SB 9 lot splits across this neighborhood. What does {area.city} need to see for an SB 9 urban lot split, and can several nearby lots be reviewed together?</li>
          </ol>
          <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>A draft question. Nothing is sent.</p>
        </div>
      </div>

      <div className={a.actions}>
        {targets.length > 0 && <button type="button" onClick={() => onOpen("area-letters")}>Offer letters for this area</button>}
        {forSale.length + leads.length > 0 && <button type="button" onClick={() => onOpen("area-checklist")}>Area checklist</button>}
        <button type="button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
