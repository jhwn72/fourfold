"use client";
import { useEffect, useState } from "react";
import type { SiteResult } from "@/lib/types";
import Checklist from "./Checklist";
import CallSheet from "./CallSheet";
import CostCompare from "./CostCompare";
import LotSvg from "./LotSvg";

const lbl: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };

export default function LiveCheck({ heading = true }: { heading?: boolean }) {
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill from /?address=... (links from the Whole city page). Does not run the check.
  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("address");
    if (a) setAddress(a);
  }, []);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, asking_price: price.replace(/[$,]/g, ""), description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" id="live" style={{ padding: 22 }}>
      {heading && <h2 style={{ marginTop: 0 }}>Check a Santa Ana address live</h2>}
      <form onSubmit={run} style={{ display: "grid", gap: 14, maxWidth: 640 }}>
        <label style={lbl}><span className="eyebrow">Address</span>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address in Santa Ana" required style={{ maxWidth: "100%" }} /></label>
        <label style={lbl}><span className="eyebrow">Asking price (optional)</span>
          <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 850000" style={{ maxWidth: 240 }} /></label>
        <label style={lbl}><span className="eyebrow">Listing text (optional; Claude looks for tenant or vacancy clues)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ width: "100%" }} /></label>
        <div><button type="submit" disabled={busy}>{busy ? "Checking public data..." : "Check"}</button></div>
      </form>
      {error && <p className="FAIL" style={{ padding: "10px 12px", borderRadius: "var(--radius-control)", marginTop: 14 }}>Error: {error}</p>}
      {result && (
        <>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start", marginTop: 12 }}>
            {result.parcel && <div style={{ flex: "1 1 280px" }}><LotSvg parcel={result.parcel} split={result.split} homes={result.max_homes} buildings={result.buildings} keep={result.keep_house} /></div>}
            <div style={{ flex: "1 1 320px" }}><CostCompare price={result.asking_price} homes={result.max_homes} perHome={result.land_cost_per_home} /></div>
          </div>
          <Checklist result={result} />
          <CallSheet result={result} />
        </>
      )}
    </div>
  );
}
