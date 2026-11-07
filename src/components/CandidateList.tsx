"use client";
// Filterable list of candidate parcels. Rows are [address, apn, area_sqft, zone].
import Link from "next/link";
import { useMemo, useState } from "react";

const LIMIT = 200;

export default function CandidateList({ rows }: { rows: [string, string, number, string][] }) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const needle = q.trim().toUpperCase();
    return needle ? rows.filter((r) => r[0].toUpperCase().includes(needle) || r[1].includes(needle)) : rows;
  }, [q, rows]);
  return (
    <div>
      <p><label>Filter by street or APN<br />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. LINWOOD or 400-242" /></label></p>
      <p className="muted">{matches.length.toLocaleString()} match{matches.length === 1 ? "" : "es"}{matches.length > LIMIT ? `, showing the first ${LIMIT}` : ""}.</p>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
