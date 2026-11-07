"use client";
// Filterable list of candidate parcels. Rows are [address, apn, area_sqft, zone].
import Link from "next/link";
import { useMemo, useState } from "react";

const LIMIT = 200;

export default function CandidateList({ rows }: { rows: [string, string, number, string][] }) {
  const [q, setQ] = useState("");
  const [minLot, setMinLot] = useState("");
  const [maxLot, setMaxLot] = useState("");
  const [zone, setZone] = useState<"all" | "R1" | "RE">("all");
  const [hasAddress, setHasAddress] = useState(false);
  const matches = useMemo(() => {
    const needle = q.trim().toUpperCase();
    const lo = minLot === "" ? null : Number(minLot);
    const hi = maxLot === "" ? null : Number(maxLot);
    return rows.filter((r) => {
      if (needle && !(r[0].toUpperCase().includes(needle) || r[1].includes(needle))) return false;
      if (lo != null && !Number.isNaN(lo) && r[2] < lo) return false;
      if (hi != null && !Number.isNaN(hi) && r[2] > hi) return false;
      if (zone !== "all" && r[3] !== zone) return false;
      if (hasAddress && !r[0]) return false;
      return true;
    });
  }, [q, minLot, maxLot, zone, hasAddress, rows]);
  const filtered = !!(q.trim() || minLot || maxLot || zone !== "all" || hasAddress);
  const reset = () => { setQ(""); setMinLot(""); setMaxLot(""); setZone("all"); setHasAddress(false); };
  const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2, fontSize: 14 };
  return (
    <div>
      <p><label>Filter by street or APN<br />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. LINWOOD or 400-242" /></label></p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", alignItems: "flex-end", marginBottom: 12 }}>
        <label style={field}>Min lot sq ft
          <input type="number" min={0} step={500} value={minLot} onChange={(e) => setMinLot(e.target.value)} placeholder="any" style={{ width: 120 }} />
        </label>
        <label style={field}>Max lot sq ft
          <input type="number" min={0} step={500} value={maxLot} onChange={(e) => setMaxLot(e.target.value)} placeholder="any" style={{ width: 120 }} />
        </label>
        <label style={field}>Zone
          <select value={zone} onChange={(e) => setZone(e.target.value as "all" | "R1" | "RE")} style={{ font: "inherit", padding: "6px 10px" }}>
            <option value="all">All</option>
            <option value="R1">R1</option>
            <option value="RE">RE</option>
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
          <input type="checkbox" checked={hasAddress} onChange={(e) => setHasAddress(e.target.checked)} /> Has address
        </label>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <p className="muted">
        {matches.length.toLocaleString()} of {rows.length.toLocaleString()} lot{rows.length === 1 ? "" : "s"}{filtered ? " match" : ""}
        {matches.length > LIMIT ? `, showing the first ${LIMIT}` : ""}.
      </p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Address</th><th>APN</th><th>Lot sq ft</th><th>Zone</th><th></th></tr></thead>
          <tbody>
            {matches.slice(0, LIMIT).map((r, i) => (
              <tr key={r[1] + i}>
                <td>{r[0] || <span className="muted">No site address in city data</span>}</td>
                <td>{r[1]}</td>
                <td>{r[2].toLocaleString()}</td>
                <td>{r[3]}{r[3] === "RE" && <> <span className="label">ASSUMPTION</span></>}</td>
                <td>{r[0] ? <Link href={`/?address=${encodeURIComponent(r[0])}#live`}>Check live</Link> : null}</td>
              </tr>
            ))}
            {!matches.length && <tr><td colSpan={5}>No lots match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
