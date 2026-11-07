"use client";
// Ranked listings table with filters. Filters are kept in the URL query string so a view can be shared.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { money, perHomeText } from "@/components/Checklist";
import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import type { SiteResult, Verdict } from "@/lib/types";
import st from "./SiteTable.module.css";

const VERDICTS: Verdict[] = ["LIKELY YES", "UNKNOWN", "NO"];

type Filters = {
  verdicts: Verdict[];
  maxPrice: string;
  maxPerHome: string;
  keepHouse: boolean;
  noParking: boolean;
  noTenant: boolean;
  q: string;
};

const DEFAULTS: Filters = { verdicts: VERDICTS, maxPrice: "", maxPerHome: "", keepHouse: false, noParking: false, noTenant: false, q: "" };

function keepHouseText(r: SiteResult): "yes" | "no" | "unknown" {
  if (r.keep_house === "fits_a" || r.keep_house === "fits_b") return "yes";
  if (r.keep_house === "straddles" || r.keep_house === "none") return "no";
  return "unknown";
}

function parkingText(r: SiteResult): "none needed" | "may be required" | "unknown" {
  const c = r.checks.find((x) => x.id === "parking");
  if (c?.status === "PASS") return "none needed";
  if (c?.status === "FAIL") return "may be required";
  return "unknown";
}

function tenantFlag(r: SiteResult): boolean {
  const c = r.checks.find((x) => x.id === "tenant");
  return !!c && (c.possible_fail === true || c.status === "FAIL");
}

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  const v = p.get("verdict");
  const verdicts = v === null ? VERDICTS : VERDICTS.filter((x) => v.split(",").includes(x));
  return {
    verdicts,
    maxPrice: p.get("maxPrice") ?? "",
    maxPerHome: p.get("maxPerHome") ?? "",
    keepHouse: p.get("keepHouse") === "1",
    noParking: p.get("noParking") === "1",
    noTenant: p.get("noTenant") === "1",
    q: p.get("q") ?? "",
  };
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams(window.location.search);
  const set = (k: string, val: string | null) => (val ? p.set(k, val) : p.delete(k));
  set("verdict", f.verdicts.length === VERDICTS.length ? null : f.verdicts.join(","));
  set("maxPrice", f.maxPrice || null);
  set("maxPerHome", f.maxPerHome || null);
  set("keepHouse", f.keepHouse ? "1" : null);
  set("noParking", f.noParking ? "1" : null);
  set("noTenant", f.noTenant ? "1" : null);
  set("q", f.q || null);
  const qs = p.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
}

export default function SiteTable({ results }: { results: SiteResult[] }) {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setF(readUrl());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeUrl(f);
  }, [f, loaded]);

  const update = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));

  const ranked = useMemo(() => results.map((r, i) => ({ r, rank: i + 1 })), [results]);

  const shown = useMemo(() => {
    const maxPrice = f.maxPrice === "" ? null : Number(f.maxPrice);
    const maxPerHome = f.maxPerHome === "" ? null : Number(f.maxPerHome);
    const needle = f.q.trim().toUpperCase();
    return ranked.filter(({ r }) => {
      if (!f.verdicts.includes(r.verdict)) return false;
      if (maxPrice != null && !Number.isNaN(maxPrice) && (r.asking_price == null || r.asking_price > maxPrice)) return false;
      if (maxPerHome != null && !Number.isNaN(maxPerHome) && (r.land_cost_per_home == null || r.land_cost_per_home > maxPerHome)) return false;
      if (f.keepHouse && keepHouseText(r) !== "yes") return false;
      if (f.noParking && parkingText(r) !== "none needed") return false;
      if (f.noTenant && tenantFlag(r)) return false;
      if (needle && !r.address.toUpperCase().includes(needle)) return false;
      return true;
    });
  }, [ranked, f]);

  const toggleVerdict = (v: Verdict) =>
    update({ verdicts: f.verdicts.includes(v) ? f.verdicts.filter((x) => x !== v) : VERDICTS.filter((x) => x === v || f.verdicts.includes(x)) });

  const activeCount =
    (f.verdicts.length !== VERDICTS.length ? 1 : 0) + (f.maxPrice ? 1 : 0) + (f.maxPerHome ? 1 : 0) + (f.q.trim() ? 1 : 0) +
    (f.keepHouse ? 1 : 0) + (f.noParking ? 1 : 0) + (f.noTenant ? 1 : 0);
  const [open, setOpen] = useState(false);
  const exportRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => {
      const d = exportRef.current;
      if (!d?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !d.contains(e.target as Node)) d.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", close); };
  }, []);
  useEffect(() => { if (loaded && activeCount > 0) setOpen(true); }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (r: SiteResult) => <span className={`status verdict-${r.verdict.replace(" ", "_")}`}>{r.verdict}</span>;
  const vsExample = (r: SiteResult) =>
    r.land_cost_per_home != null ? `${r.land_cost_per_home <= BRIEF_LAND_PER_HOME ? "below" : "above"} $360k example` : null;
  const empty = !!results.length && !shown.length;

  return (
    <div>
      <div className={st.toolbar}>
        <span className={`eyebrow ${st.count}`}>Showing {shown.length} of {results.length}</span>
        <button type="button" className={st.tbtn} aria-expanded={open} aria-controls="site-filters" onClick={() => setOpen((o) => !o)}>
          Filter{activeCount > 0 && <span className={st.badge}>{activeCount}</span>}
        </button>
        <details className={st.export} ref={exportRef}>
          <summary className={st.tbtn}>Export ▾</summary>
          <div className={st.menu}>
            <Link href="/brief">Call list (PDF)<span>print or save as PDF</span></Link>
            <a href="/results.csv" download>Ranked list CSV<span>/results.csv</span></a>
            <a href="/city.csv" download>Citywide lots CSV<span>/city.csv</span></a>
          </div>
        </details>
      </div>

      {open && (
        <div id="site-filters" className={st.panel}>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
            <legend className="eyebrow" style={{ padding: 0, marginBottom: 6 }}>Verdict</legend>
            {VERDICTS.map((v) => (
              <label key={v} className={st.check}>
                <input type="checkbox" checked={f.verdicts.includes(v)} onChange={() => toggleVerdict(v)} /> {v}
              </label>
            ))}
          </fieldset>
          <label className={st.field}><span className="eyebrow">Max asking price ($)</span>
            <input type="number" min={0} step={10000} value={f.maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} placeholder="any" style={{ width: 140 }} />
          </label>
          <label className={st.field}><span className="eyebrow">Max cost per home ($)</span>
            <input type="number" min={0} step={10000} value={f.maxPerHome} onChange={(e) => update({ maxPerHome: e.target.value })} placeholder="any" style={{ width: 140 }} />
          </label>
          <label className={st.field}><span className="eyebrow">Address</span>
            <input type="text" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="e.g. Main" style={{ width: 180 }} />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
            <label className={st.check}><input type="checkbox" checked={f.keepHouse} onChange={(e) => update({ keepHouse: e.target.checked })} /> Keeps the existing house</label>
            <label className={st.check}><input type="checkbox" checked={f.noParking} onChange={(e) => update({ noParking: e.target.checked })} /> No parking required</label>
            <label className={st.check}><input type="checkbox" checked={f.noTenant} onChange={(e) => update({ noTenant: e.target.checked })} /> No tenant flag</label>
          </div>
          <button type="button" onClick={() => setF(DEFAULTS)}>Reset</button>
        </div>
      )}

      <div className={`table-wrap ${st.tableWrap}`}>
        <table>
          <thead>
            <tr><th>#</th><th>Address</th><th>Verdict</th><th>Homes</th><th>Asking</th><th>Per home</th><th>Keeps house</th><th>Why</th></tr>
          </thead>
          <tbody>
            {shown.map(({ r, rank }) => (
              <tr key={r.id}>
                <td className={st.rank}>{rank}</td>
                <td><Link href={`/site/${r.id}`} className={st.addr}>{r.address}</Link><div className={st.apn}>{r.parcel ? `APN ${r.parcel.apn}` : "no parcel match"}</div></td>
                <td>{chip(r)}</td>
                <td className="num">{r.max_homes ?? "UNKNOWN"}</td>
                <td className="num">{money(r.asking_price)}</td>
                <td className="num">{perHomeText(r.land_cost_per_home, r.max_homes)}{vsExample(r) && <div className="muted">{vsExample(r)}</div>}</td>
                <td>{keepHouseText(r)}</td>
                <td className="muted">{r.verdict_reason}</td>
              </tr>
            ))}
            {!results.length && <tr><td colSpan={8}>No results yet. Run <code>npm run precompute</code>.</td></tr>}
            {empty && <tr><td colSpan={8}>No listings match these filters. <button type="button" onClick={() => setF(DEFAULTS)}>Reset</button></td></tr>}
          </tbody>
        </table>
      </div>

      <div className={st.cards}>
        {shown.map(({ r, rank }) => (
          <Link key={r.id} href={`/site/${r.id}`} className={st.card}>
            <div className={st.cardTop}>
              <span className={st.rank}>{rank}</span>
              <span className={st.cardAddr}>{r.address}</span>
              {chip(r)}
            </div>
            <div className={st.apn} style={{ marginTop: 2 }}>{r.parcel ? `APN ${r.parcel.apn}` : "no parcel match"}</div>
            <div className={st.cardStats}>
              <div><div className="eyebrow">Homes</div><div className="v">{r.max_homes ?? "UNKNOWN"}</div></div>
              <div><div className="eyebrow">Per home</div><div className="v">{perHomeText(r.land_cost_per_home, r.max_homes)}</div></div>
              <div><div className="eyebrow">Keeps house</div><div className="v">{keepHouseText(r)}</div></div>
            </div>
            <div className={st.why}>{r.verdict_reason}</div>
          </Link>
        ))}
        {empty && <p className="muted">No listings match these filters. <button type="button" onClick={() => setF(DEFAULTS)}>Reset</button></p>}
      </div>
    </div>
  );
}
