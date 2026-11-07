"use client";
// Home as a dashboard (reference: white card panel on the left, full-height dot map on the right).
import Link from "next/link";
import { useCallback, useState } from "react";
import DotMap, { type MapListing } from "./viz/DotMap";
import d from "./HomeDashboard.module.css";

export type DashRow = {
  id: string; n: number; address: string; verdict: string; homes: number | null;
  price: number | null; perHome: number | null; reason: string; open: number;
};
export type DashStat = { k: string; v: string; of?: number; total?: number; href: string };
export type DashGroup = { label: string; key: string; sites: number; homes: number; spread: string } | null;

const money = (n: number | null) => (n == null ? "UNKNOWN" : "$" + n.toLocaleString("en-US"));
const vClass = (v: string) => `status verdict-${v.replace(" ", "_")}`;

export default function HomeDashboard({ rows, map, stats, group, checkedAt }: { rows: DashRow[]; map: MapListing[]; stats: DashStat[]; group: DashGroup; checkedAt: string }) {
  const [sel, setSel] = useState<string | null>(null);
  const onSelect = useCallback((id: string) => setSel((s) => (s === id ? null : id)), []);
  const s = rows.find((r) => r.id === sel) ?? null;

  return (
    <div className={d.dash}>
      <aside className={d.panel}>
        <div className={d.head}>
          <h1 className={d.title}>FourFold<span className="second">One house. Four homes.</span></h1>
          <div className={d.chips}>
            <span className="chiptag">Santa Ana · {rows.length} listings</span>
            <span className="chiptag">Collected 2026-11-07</span>
          </div>
          <p className={d.lede}>
            Investors can&apos;t split a lot under SB 9 unless they live there 3 years. Nonprofits are exempt (
            <a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD, p.2</a>).
          </p>
        </div>

        {s && (
          <div className="card">
            <div className={d.cardHead}><span className="eyebrow">Selected · №{s.n}</span><button type="button" className={d.x} onClick={() => setSel(null)} aria-label="Clear selection">×</button></div>
            <div className={d.selAddr}>{s.address}</div>
            <div style={{ margin: "6px 0 10px" }}><span className={vClass(s.verdict)}>{s.verdict}</span></div>
            <p className="muted" style={{ margin: "0 0 10px" }}>{s.reason}</p>
            <div className={d.miniStats}>
              <div><div className="eyebrow">Homes</div><div className={d.num}>{s.homes ?? "UNKNOWN"}</div></div>
              <div><div className="eyebrow">Asking</div><div className={d.num}>{money(s.price)}</div></div>
              <div><div className="eyebrow">Per home</div><div className={d.num}>{s.homes === 0 ? "n/a" : money(s.perHome)}</div></div>
            </div>
            <Link href={`/site/${s.id}`} className="btn-primary" style={{ display: "inline-block", marginTop: 12, padding: "8px 14px", borderRadius: 3, textDecoration: "none" }}>Open site →</Link>
          </div>
        )}

        <div className="card">
          <div className={d.cardHead}><span className="eyebrow">Ranked sites</span><Link href="/#list" className="eyebrow">Table ↓</Link></div>
          <ol className={d.list}>
            {rows.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => onSelect(r.id)} className={`${d.row} ${sel === r.id ? d.rowOn : ""}`}>
                  <span className={d.n}>№{r.n}</span>
                  <span className={d.addr}>{r.address}</span>
                  <span className={vClass(r.verdict)}>{r.verdict === "LIKELY YES" ? "YES" : r.verdict}</span>
                  <span className={d.per}>{r.homes === 0 ? "n/a" : money(r.perHome)}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="faint" style={{ fontSize: 11.5, margin: "8px 0 0" }}>Per home = asking ÷ homes, before construction. Checks run {checkedAt}.</p>
        </div>

        <div className="card">
          <div className={d.cardHead}><span className="eyebrow">Santa Ana screen</span><Link href="/city" className="eyebrow">Map ↗</Link></div>
          <div className={d.statGrid}>
            {stats.map((st) => (
              <Link key={st.k} href={st.href} className={d.stat}>
                <div className="eyebrow">{st.k}</div>
                <div className={d.num}>{st.v}</div>
                {st.of != null && st.total ? <div className="statbar"><i style={{ width: `${Math.max(2, (st.of / st.total) * 100)}%` }} /></div> : null}
              </Link>
            ))}
          </div>
        </div>

        {group && (
          <div className="card">
            <div className={d.cardHead}><span className="eyebrow">Best site group</span><Link href="/clusters" className="eyebrow">All ↗</Link></div>
            <div className={d.selAddr}>{group.label}: {group.sites} sites, {group.homes} homes</div>
            <p className="muted" style={{ margin: "4px 0 0" }}>All within {group.spread}. One city desk, one crew.</p>
          </div>
        )}

        <div className={d.footLinks}>
          <Link href="/check">Check an address →</Link>
          <Link href="/org">Your org →</Link>
          <Link href="/method">How it works →</Link>
        </div>
      </aside>

      <section className={d.map} aria-label="Map">
        <DotMap listings={map} selected={sel} onSelect={onSelect} />
        <div className={d.mapLabel}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>Santa Ana · every parcel · dot size = lots per cell</span>
        </div>
        <div className={d.mapHint}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>{sel ? "Click the tag again to zoom out" : "Click a № tag"}</span>
        </div>
      </section>
    </div>
  );
}
