"use client";
// Ranked listings table with filters. Filters are kept in the URL query string so a view can be shared.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { money, perHomeText } from "@/components/Checklist";
import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import type { SiteResult, Verdict } from "@/lib/types";

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

  const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2, fontSize: 14 };
  const check: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, fontSize: 14 };

  return (
    <div>
      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", alignItems: "flex-end" }}>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
          <legend style={{ fontSize: 14, padding: 0, marginBottom: 2 }}>Verdict</legend>
          {VERDICTS.map((v) => (
            <label key={v} style={check}>
              <input type="checkbox" checked={f.verdicts.includes(v)} onChange={() => toggleVerdict(v)} /> {v}
            </label>
          ))}
        </fieldset>
        <label style={field}>Max asking price ($)
          <input type="number" min={0} step={10000} value={f.maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} placeholder="any" style={{ width: 140 }} />
        </label>
        <label style={field}>Max land cost per home ($)
          <input type="number" min={0} step={10000} value={f.maxPerHome} onChange={(e) => update({ maxPerHome: e.target.value })} placeholder="any" style={{ width: 140 }} />
        </label>
        <label style={field}>Address
          <input type="text" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="e.g. Main" style={{ width: 180 }} />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
          <label style={check}><input type="checkbox" checked={f.keepHouse} onChange={(e) => update({ keepHouse: e.target.checked })} /> Keeps the existing house</label>
          <label style={check}><input type="checkbox" checked={f.noParking} onChange={(e) => update({ noParking: e.target.checked })} /> No parking required</label>
          <label style={check}><input type="checkbox" checked={f.noTenant} onChange={(e) => update({ noTenant: e.target.checked })} /> No tenant flag</label>
        </div>
        <button type="button" onClick={() => setF(DEFAULTS)}>Reset</button>
      </div>
      <p className="muted">Showing {shown.length} of {results.length}. Rank numbers are the original ranking.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Address</th><th>Verdict</th><th>Max homes</th><th>Asking price</th><th>Per home</th><th>Keep house</th><th>Parking</th><th>Unknowns</th><th>Why</th></tr>
          </thead>
          <tbody>
            {shown.map(({ r, rank }) => (
              <tr key={r.id}>
                <td>{rank}</td>
                <td><Link href={`/site/${r.id}`}>{r.address}</Link><div className="muted">{r.parcel ? `APN ${r.parcel.apn}` : "no parcel match"}</div></td>
                <td><span className={`status verdict-${r.verdict.replace(" ", "_")}`}>{r.verdict}</span></td>
                <td>{r.max_homes ?? "UNKNOWN"}</td>
                <td>{money(r.asking_price)}</td>
                <td>{perHomeText(r.land_cost_per_home, r.max_homes)}{r.land_cost_per_home != null && <div className="muted">{r.land_cost_per_home <= BRIEF_LAND_PER_HOME ? "below" : "above"} $360k example</div>}</td>
                <td>{keepHouseText(r)}</td>
                <td>{parkingText(r)}</td>
                <td>{r.unknown_count}</td>
                <td className="muted">{r.verdict_reason}</td>
              </tr>
            ))}
            {!results.length && <tr><td colSpan={10}>No results yet. Run <code>npm run precompute</code>.</td></tr>}
            {!!results.length && !shown.length && <tr><td colSpan={10}>No listings match these filters. <button type="button" onClick={() => setF(DEFAULTS)}>Reset</button></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
