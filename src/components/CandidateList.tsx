"use client";
// Filterable, sortable list of candidate parcels. Rows are [address, apn, area_sqft, zone].
import Link from "next/link";
import { useMemo, useState } from "react";
import s from "./CandidateList.module.css";

const LIMIT = 200;
type Row = [string, string, number, string];
type Sort = "lot" | "address";
type Zone = "all" | "R1" | "RE";

export default function CandidateList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [minLot, setMinLot] = useState("");
  const [maxLot, setMaxLot] = useState("");
  const [zone, setZone] = useState<Zone>("all");
  const [hasAddress, setHasAddress] = useState(false);
  const [sort, setSort] = useState<Sort>("lot");
  const matches = useMemo(() => {
    const needle = q.trim().toUpperCase();
    const lo = minLot === "" ? null : Number(minLot);
    const hi = maxLot === "" ? null : Number(maxLot);
    const out = rows.filter((r) => {
      if (needle && !(r[0].toUpperCase().includes(needle) || r[1].includes(needle))) return false;
      if (lo != null && !Number.isNaN(lo) && r[2] < lo) return false;
      if (hi != null && !Number.isNaN(hi) && r[2] > hi) return false;
      if (zone !== "all" && r[3] !== zone) return false;
      if (hasAddress && !r[0]) return false;
      return true;
    });
    if (sort === "lot") out.sort((a, b) => b[2] - a[2]);
    // Address A-Z; rows without an address go last.
    else out.sort((a, b) => (!a[0] ? 1 : 0) - (!b[0] ? 1 : 0) || a[0].localeCompare(b[0], "en-US", { numeric: true }));
    return out;
  }, [q, minLot, maxLot, zone, hasAddress, sort, rows]);
  const filtered = !!(q.trim() || minLot || maxLot || zone !== "all" || hasAddress);
  const reset = () => { setQ(""); setMinLot(""); setMaxLot(""); setZone("all"); setHasAddress(false); };
  return (
    <div>
      <div className={s.bar}>
        <label className={s.field}><span>Street or APN</span>
          <input className={s.search} type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. LINWOOD or 400-242" />
        </label>
        <label className={s.field}><span>Min lot sq ft</span>
          <input className={s.num} type="number" min={0} step={500} value={minLot} onChange={(e) => setMinLot(e.target.value)} placeholder="any" />
        </label>
        <label className={s.field}><span>Max lot sq ft</span>
          <input className={s.num} type="number" min={0} step={500} value={maxLot} onChange={(e) => setMaxLot(e.target.value)} placeholder="any" />
        </label>
        <div className={s.field}><span>Zone</span>
          <div className={s.chips}>
            {(["all", "R1", "RE"] as Zone[]).map((z) => (
              <button key={z} type="button" className={`chip${zone === z ? " on" : ""}`} aria-pressed={zone === z} onClick={() => setZone(z)}>
                {z === "all" ? "All" : z}
              </button>
            ))}
            <button type="button" className={`chip${hasAddress ? " on" : ""}`} aria-pressed={hasAddress} onClick={() => setHasAddress(!hasAddress)}>
              Has address
            </button>
          </div>
        </div>
        <div className={s.field}><span>Sort</span>
          <div className="seg">
            <button type="button" className={sort === "lot" ? "on" : ""} aria-pressed={sort === "lot"} onClick={() => setSort("lot")}>Lot size</button>
            <button type="button" className={sort === "address" ? "on" : ""} aria-pressed={sort === "address"} onClick={() => setSort("address")}>Address A-Z</button>
          </div>
        </div>
        {filtered && <button type="button" className={s.reset} onClick={reset}>Reset</button>}
      </div>
      <p className={s.count}>
        {matches.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} lot{rows.length === 1 ? "" : "s"}{filtered ? " match" : ""}
        {matches.length > LIMIT ? ` · showing the first ${LIMIT}` : ""}
      </p>
      <div className="table-wrap">
        <table className={s.table}>
          <thead><tr><th>Address</th><th>APN</th><th className={s.right}>Lot sq ft</th><th>Zone</th><th></th></tr></thead>
          <tbody>
            {matches.slice(0, LIMIT).map((r, i) => (
              <tr key={r[1] + i}>
                <td>{r[0] || <span className={s.none}>No site address in city data</span>}</td>
                <td className={s.apn}>{r[1]}</td>
                <td className={s.area}>{r[2].toLocaleString("en-US")}</td>
                <td>{r[3]}{r[3] === "RE" && <> <span className="label">ASSUMPTION</span></>}</td>
                <td>{r[0] ? <Link className={s.go} href={`/check?address=${encodeURIComponent(r[0])}`}>Check live →</Link> : null}</td>
              </tr>
            ))}
            {!matches.length && (
              <tr><td colSpan={5}>No lots match these filters. <button type="button" className={s.reset} onClick={reset}>Reset</button></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
