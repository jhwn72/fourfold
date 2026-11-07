"use client";
import { useEffect, useState } from "react";
import type { SiteResult } from "@/lib/types";
import Checklist from "./Checklist";
import CallSheet from "./CallSheet";
import CostCompare from "./CostCompare";
import LotSvg from "./LotSvg";

export default function LiveCheck() {
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
    <div className="card" id="live">
      <h2>Check a Santa Ana address live</h2>
      <form onSubmit={run}>
        <p><label>Address<br /><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address in Santa Ana" required /></label></p>
        <p><label>Asking price (optional)<br /><input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 850000" /></label></p>
        <p><label>Listing description (optional, read by Claude for tenant/vacant flags)<br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ width: "100%", maxWidth: 640 }} /></label></p>
        <button type="submit" disabled={busy}>{busy ? "Checking public data..." : "Check"}</button>
      </form>
      {error && <p className="FAIL" style={{ padding: 8 }}>Error: {error}</p>}
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
