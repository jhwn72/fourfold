"use client";
import { useState } from "react";
import Link from "next/link";
import type { Cluster, ClusterResult, ClusterSite } from "@/lib/clusters";
import { fmtMiles, DEFAULT_RADIUS_FT } from "@/lib/clusters";
import s from "./ClusterView.module.css";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const RADIUS_LABEL: Record<number, string> = { 1320: "0.25 mi", 2640: "0.5 mi", 5280: "1 mi" };
const chip = (v: string) => <span className={`status verdict-${v.replace(" ", "_")}`}>{v}</span>;

function MiniMap({ members, radiusFt }: { members: ClusterSite[]; radiusFt: number }) {
  const W = 260, H = 170, pad = 34;
  const xs = members.map((m) => m.x), ys = members.map((m) => m.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  // Fit the larger of the members' extent or the radius, so a tight group does not look spread out.
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), radiusFt / 2);
  const k = Math.min(W - 2 * pad, H - 2 * pad) / span;
  const px = (x: number) => W / 2 + (x - cx) * k;
  const py = (y: number) => H / 2 - (y - cy) * k; // north up: State Plane y grows north
  const barFt = [528, 1320, 2640, 5280].reverse().find((f) => f * k <= W * 0.4) ?? 264;
  return (
    <svg className={s.map} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Relative positions of ${members.length} sites, north up`}>
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="8" fill="none" stroke="var(--line)" />
      {members.map((m) => (
        <g key={m.id}>
          <circle cx={px(m.x)} cy={py(m.y)} r="4.5" fill={m.verdict === "LIKELY YES" ? "var(--pass)" : "var(--possible)"} />
          <text x={px(m.x) + 8} y={py(m.y) + 4} fontSize="10" fill="var(--muted)">{m.address.replace(/ (St|Dr|Ct|Ave|Cir)$/, "")}</text>
        </g>
      ))}
      <text x={W - 16} y="20" fontSize="10" fill="var(--faint)" textAnchor="middle">N</text>
      <path d={`M${W - 16} 24 l-4 9 h8 z`} fill="var(--faint)" />
      <line x1="12" x2={12 + barFt * k} y1={H - 14} y2={H - 14} stroke="var(--muted)" />
      <line x1="12" x2="12" y1={H - 18} y2={H - 10} stroke="var(--muted)" />
      <line x1={12 + barFt * k} x2={12 + barFt * k} y1={H - 18} y2={H - 10} stroke="var(--muted)" />
      <text x="12" y={H - 22} fontSize="9.5" fill="var(--faint)">{fmtMiles(barFt)}</text>
    </svg>
  );
}

function GroupCard({ g, radiusFt, nearest }: { g: Cluster; radiusFt: number; nearest: ClusterResult["nearest"] }) {
  const single = g.members.length === 1;
  const zones = [...new Set(g.members.map((m) => m.zone ?? "UNKNOWN"))].join(", ");
  return (
    <article id={`group-${g.key}`} className={`card ${s.card}`}>
      <div className={s.top}>
        <div>
          <span className="eyebrow">{g.label}{single ? " · single site" : ""}</span>
          <h3 className={s.h}>
            {single ? "1 site" : `${g.members.length} sites, all within ${fmtMiles(g.spreadFt)}`}
          </h3>
          {g.cities.length > 1 && (
            <p className={s.warn}>Spans {g.cities.length} cities ({g.cities.join(", ")}): two planning desks, not one.</p>
          )}
        </div>
      </div>
      <div className={single ? undefined : s.body}>
        <div>
          <div className="stats">
            <div><div className="k">Max homes</div><div className="v accent">{g.homes}{g.homesUnknown ? ` + ${g.homesUnknown} unknown` : ""}</div></div>
            <div><div className="k">Total asking</div><div className="v">{usd(g.totalAsking)}{g.priceUnknown ? ` + ${g.priceUnknown} unknown` : ""}</div></div>
            <div><div className="k">Asking per home</div><div className="v">{g.avgPerHome != null ? usd(g.avgPerHome) : "UNKNOWN"}</div></div>
          </div>
          <ul className={s.members}>
            {g.members.map((m) => (
              <li key={m.id}>
                {chip(m.verdict)} <Link href={`/site/${m.id}`}>{m.address}</Link>
                <span className="faint"> · {m.homes ?? "?"} homes · {m.price != null ? usd(m.price) : "price UNKNOWN"} · {m.zone ?? "zone UNKNOWN"}</span>
              </li>
            ))}
          </ul>
          <p className="muted">
            Zoning: {g.zone ? `all ${g.zone}` : `mixed (${zones}), so more than one set of rules applies`}.
            {single && nearest[g.members[0].id] && <> Nearest other viable listing: {fmtMiles(nearest[g.members[0].id]!.distFt)}.</>}
          </p>
          {g.nearbyCandidates != null && (
            <p className="muted">
              <span className="accent">{g.nearbyCandidates.toLocaleString("en-US")}</span> first-screen candidate lots within{" "}
              {fmtMiles(radiusFt)} of this {single ? "site" : "group"}&apos;s center (off market as far as we know; may include the listed lots).{" "}
              <Link href="/city">See the whole city</Link>
            </p>
          )}
        </div>
        {!single && <MiniMap members={g.members} radiusFt={radiusFt} />}
      </div>
    </article>
  );
}

export default function ClusterView({ results }: { results: ClusterResult[] }) {
  const [radius, setRadius] = useState(DEFAULT_RADIUS_FT);
  const r = results.find((x) => x.radiusFt === radius) ?? results[0];
  const real = r.groups.filter((g) => g.members.length > 1);
  const singles = r.groups.filter((g) => g.members.length === 1);
  return (
    <div>
      <div className={s.controls}>
        <span className="eyebrow">Group radius</span>
        <div className="seg" role="group" aria-label="Group radius">
          {results.map((x) => (
            <button key={x.radiusFt} className={x.radiusFt === radius ? "on" : ""} aria-pressed={x.radiusFt === radius} onClick={() => setRadius(x.radiusFt)}>
              {RADIUS_LABEL[x.radiusFt] ?? fmtMiles(x.radiusFt)}
            </button>
          ))}
        </div>
        <span className="label">ASSUMPTION</span>
        <span className="muted">0.5 mi default: a walkable, one-crew distance. A team judgment, not a rule.</span>
      </div>

      <p className="muted">
        Only listings marked LIKELY YES or UNKNOWN are grouped. Every site in a group is within {fmtMiles(r.radiusFt)} of
        every other. Ranked by more homes, then lower asking per home, then tighter spread, then fewer UNKNOWN sites.
      </p>

      {real.length === 0 && (
        <p className="card">No two viable listings are within {fmtMiles(r.radiusFt)} of each other. Each one would be its own project.</p>
      )}
      {real.map((g) => <GroupCard key={g.key} g={g} radiusFt={r.radiusFt} nearest={r.nearest} />)}

      {singles.length > 0 && (
        <>
          <h2>On their own<span className="second">No other viable listing within {fmtMiles(r.radiusFt)}.</span></h2>
          {singles.map((g) => <GroupCard key={g.key} g={g} radiusFt={r.radiusFt} nearest={r.nearest} />)}
        </>
      )}

      {r.excluded.length > 0 && (
        <details className={s.excluded}>
          <summary>{r.excluded.length} listings left out (verdict NO)</summary>
          <ul className={s.members}>
            {r.excluded.map((m) => (
              <li key={m.id}>{chip(m.verdict)} <Link href={`/site/${m.id}`}>{m.address}</Link></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
