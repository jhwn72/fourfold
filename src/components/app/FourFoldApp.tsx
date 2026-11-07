"use client";
// One screen for the demo: three tabs on the left (Sites, Groups, City), the particle stage on the right,
// and every deeper feature in an expandable window.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SiteResult } from "@/lib/types";
import CallSheet from "../CallSheet";
import Checklist from "../Checklist";
import FundGap from "../FundGap";
import InvestorCard from "../InvestorCard";
import LiveCheck from "../LiveCheck";
import OrgProfile from "../OrgProfile";
import RecommendGate from "../RecommendGate";
import SupportPanel from "../SupportPanel";
import AnimatedNumber from "../site/AnimatedNumber";
import NextCallCard from "../site/NextCallCard";
import type { MapListing } from "../viz/DotMap";
import MapStage from "./MapStage";
import Window from "./Window";
import a from "./FourFoldApp.module.css";

export type AppGroup = { key: string; label: string; ids: string[]; homes: number; spread: string; avgPerHome: number | null; nearby: number | null };
export type AppCity = { total: number; sf: number; splittable: number; candidates: number; inDistrict: number; reasons: [string, number][] };
type Tab = "sites" | "groups" | "city";
type Win = null | "checklist" | "calls" | "fund" | "support" | "check" | "more";

const money = (n: number | null | undefined) => (n == null ? "UNKNOWN" : "$" + n.toLocaleString("en-US"));
const vClass = (v: string) => `status verdict-${v.replace(" ", "_")}`;
const fmt = (n: number) => n.toLocaleString("en-US");

export default function FourFoldApp({ results, listings, groups, city, ocProjects }: { results: SiteResult[]; listings: MapListing[]; groups: AppGroup[]; city: AppCity; ocProjects: number }) {
  const [tab, setTab] = useState<Tab>("sites");
  const [sel, setSel] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [win, setWin] = useState<Win>(null);

  // Deep links: ?site=sa-10, ?tab=groups, ?window=fund
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tab"); if (t === "groups" || t === "city") setTab(t);
    const s = q.get("site"); if (s && results.some((r) => r.id === s)) setSel(s);
    const w = q.get("window"); if (w) setWin(w as Win);
  }, [results]);
  useEffect(() => {
    const q = new URLSearchParams();
    if (tab !== "sites") q.set("tab", tab);
    if (sel) q.set("site", sel);
    window.history.replaceState(null, "", q.toString() ? `/app?${q}` : "/app");
  }, [tab, sel]);

  const site = results.find((r) => r.id === sel) ?? null;
  const rank = (id: string) => results.findIndex((r) => r.id === id) + 1;
  const onSelect = useCallback((id: string) => { setSel((s) => (s === id ? null : id)); setTab("sites"); }, []);
  const close = useCallback(() => setWin(null), []);
  const g = groups.find((x) => x.key === group) ?? null;
  const groupOf = (id: string) => groups.find((x) => x.ids.length > 1 && x.ids.includes(id));

  return (
    <div className={`${a.app} ff-app`}>
      <aside className={a.panel}>
        <div className={a.tabs} role="tablist">
          {(["sites", "groups", "city"] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={`${a.tab} ${tab === t ? a.tabOn : ""}`} onClick={() => { setTab(t); if (t !== "sites") setSel(null); if (t !== "groups") setGroup(null); }}>
              {t === "sites" ? "Sites" : t === "groups" ? "Groups" : "City"}
            </button>
          ))}
        </div>

        {tab === "sites" && !site && (
          <>
            <h1 className={a.title}>One house.<span className="second">Four homes.</span></h1>
            <p className={a.lede}>Investors can&apos;t split a lot under SB 9 unless they live there 3 years. Nonprofits can (<a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD, p.2</a>).</p>
            <div className="card" style={{ marginTop: 16 }}>
              <div className={a.cardHead}><span className="eyebrow">Santa Ana listings, ranked</span><span className="chiptag">2026-11-07</span></div>
              <ol className={a.list}>
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button type="button" className={a.row} onClick={() => onSelect(r.id)}>
                      <span className={a.n}>№{i + 1}</span>
                      <span className={a.addr}>{r.address}</span>
                      <span className={vClass(r.verdict)}>{r.verdict === "LIKELY YES" ? "Yes" : r.verdict === "UNKNOWN" ? "Check" : "No"}</span>
                      <span className={a.per}>{r.max_homes === 0 ? "n/a" : money(r.land_cost_per_home)}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="faint" style={{ fontSize: 11.5, margin: "8px 0 0" }}>Per home = asking ÷ homes, before construction.</p>
            </div>
          </>
        )}

        {tab === "sites" && site && (
          <div className={a.site}>
            <button type="button" className={a.back} onClick={() => setSel(null)}>← All sites</button>
            <div className="eyebrow">№{rank(site.id)} · Parcel {site.parcel?.apn ?? "UNKNOWN"}</div>
            <h1 className={a.siteTitle}>{site.address}</h1>
            <p className={a.reason}><span className={vClass(site.verdict)}>{site.verdict}</span> {site.verdict_reason}</p>
            <div className={a.nums}>
              <div><div className="eyebrow">Homes</div><div className={`${a.big} accent`}>{site.max_homes ?? "UNKNOWN"}</div></div>
              <div><div className="eyebrow">Per home</div><div className={`${a.big} accent`}>{site.max_homes === 0 ? "n/a" : site.asking_price && site.land_cost_per_home ? <AnimatedNumber key={site.id} from={site.asking_price} to={site.land_cost_per_home} /> : "UNKNOWN"}</div></div>
              <div><div className="eyebrow">Asking</div><div className={a.big}>{money(site.asking_price)}</div></div>
              {site.max_homes === 4 && <div><div className="eyebrow">Investor / home</div><div className={a.big}>{money(site.asking_price ? Math.round(site.asking_price / 2) : null)}</div></div>}
            </div>
            <p className="faint" style={{ fontSize: 11, margin: "6px 0 8px" }}>Brief&apos;s example: $360k per home <span className="label">ASSUMPTION</span></p>
            {groupOf(site.id) && <p className="muted" style={{ margin: "0 0 8px", fontSize: 13 }}>Part of {groupOf(site.id)!.label}: {groupOf(site.id)!.ids.length} sites, <span className="accent">{groupOf(site.id)!.homes} homes</span> within {groupOf(site.id)!.spread}.</p>}
            <div className={a.gate}><RecommendGate verdict={site.verdict} city={site.city}><span className="status verdict-LIKELY_YES">Recommended: make the first call</span></RecommendGate></div>
            {/* NextCallCard links to #call-sheet; in the app that opens the Call sheet window instead. */}
            <div className={a.next} onClickCapture={(e) => { const t = (e.target as HTMLElement).closest("a"); if (t && t.getAttribute("href") === "#call-sheet") { e.preventDefault(); setWin("calls"); } }}>
              <NextCallCard r={site} />
            </div>
            <div className={a.actions}>
              <button type="button" onClick={() => setWin("checklist")}>Checklist</button>
              <button type="button" onClick={() => setWin("calls")}>Call sheet</button>
              {site.max_homes ? <button type="button" onClick={() => setWin("fund")}>Fund the gap</button> : null}
              <button type="button" onClick={() => setWin("support")}>Local support</button>
              <a href={`/site/${site.id}/brief`} className={a.linkBtn}>Briefing PDF</a>
            </div>
          </div>
        )}

        {tab === "groups" && (
          <>
            <h1 className={a.title}>Buy close together.<span className="second">One city, one crew.</span></h1>
            <p className={a.lede}>Viable listings within 0.5 mi of each other <span className="label">ASSUMPTION</span>.</p>
            {groups.map((x) => (
              <button key={x.key} type="button" className={`card ${a.groupCard} ${group === x.key ? a.groupOn : ""}`} onClick={() => setGroup(group === x.key ? null : x.key)}>
                <div className={a.cardHead}><span className="eyebrow">{x.label}</span><span className="accent" style={{ fontFamily: "var(--font-mono)" }}>{x.homes} homes</span></div>
                <div style={{ fontSize: 14 }}>{x.ids.map((id) => results.find((r) => r.id === id)?.address).join(" · ")}</div>
                <div className="muted" style={{ marginTop: 4 }}>{x.ids.length > 1 ? `Within ${x.spread}` : "Stands alone"}{x.avgPerHome ? ` · ${money(x.avgPerHome)} per home` : ""}{x.nearby != null ? ` · ${fmt(x.nearby)} candidate lots nearby` : ""}</div>
              </button>
            ))}
            <Link href="/clusters" className={a.more}>Group details, 0.25 / 0.5 / 1 mi →</Link>
          </>
        )}

        {tab === "city" && (
          <>
            <h1 className={a.title}>Every lot in Santa Ana.<span className="second">A first screen, not a verdict.</span></h1>
            <div className="card">
              {[["Parcels", city.total], ["Single-family zone", city.sf], ["Big enough to split", city.splittable], ["Pass flood, fire, historic", city.candidates]].map(([k, v], i) => (
                <div key={k as string} style={{ marginBottom: 10 }}>
                  <div className={a.cardHead} style={{ marginBottom: 2 }}><span className="eyebrow">{k}</span><span className={i === 3 ? "accent" : ""} style={{ fontFamily: "var(--font-mono)" }}>{fmt(v as number)}</span></div>
                  <div className="statbar"><i style={{ width: `${((v as number) / city.total) * 100}%`, background: i === 3 ? "var(--accent)" : undefined }} /></div>
                </div>
              ))}
              <p className="faint" style={{ fontSize: 11.5, margin: "6px 0 0" }}>+{fmt(city.inDistrict)} in a historic district (possible fail). Tenants, rent rules and prior splits not checked here.</p>
            </div>
            <div className={a.footLinks}><Link href="/city">Search all {fmt(city.candidates)} lots →</Link><Link href="/comparables">{ocProjects} OC SB 9 projects →</Link></div>
          </>
        )}

        <div className={a.bottom}>
          <button type="button" onClick={() => setWin("check")}>Check an address</button>
          <button type="button" onClick={() => setWin("more")}>More</button>
        </div>
        <p className={a.disclaimer}>Prototype. Not legal or financial advice. Confirm with the city and a professional.</p>
      </aside>

      <section className={a.stage}>
        <MapStage site={site} listings={listings} onSelect={onSelect} focus={g ? g.ids : null} cityView={tab === "city"} />
      </section>

      {win === "checklist" && site && (
        <Window title={`SB 9 checklist · ${site.address}`} onClose={close}><Checklist result={site} showSummary={false} /></Window>
      )}
      {win === "calls" && site && <Window title={`Call sheet · ${site.address}`} onClose={close}><CallSheet result={site} /></Window>}
      {win === "fund" && site && (
        <Window title={`Fund the gap · ${site.address}`} onClose={close}><InvestorCard r={site} /><FundGap r={site} /></Window>
      )}
      {win === "support" && (
        <Window title="Local support" onClose={close}><SupportPanel city={site?.city ?? "Santa Ana"} /><h3 style={{ marginTop: 20 }}>Your organization</h3><OrgProfile /></Window>
      )}
      {win === "check" && <Window title="Check any Santa Ana address" onClose={close} size="sm"><LiveCheck heading={false} /></Window>}
      {win === "more" && (
        <Window title="More" onClose={close} size="sm">
          <div className={a.moreGrid}>
            <Link href="/learn" className="card">Project outcomes<div className="muted">What FourFold learns from real projects</div></Link>
            <Link href="/comparables" className="card">OC SB 9 projects<div className="muted">{ocProjects} from state housing reports</div></Link>
            <Link href="/method" className="card">How it works<div className="muted">Tests, sources, assumptions, unknowns</div></Link>
            <Link href="/brief" className="card">Call list (PDF)<div className="muted">All 10 sites, printable</div></Link>
            <a href="/results.csv" download className="card">Results (CSV)<div className="muted">Every check and number</div></a>
            <Link href="/org" className="card">Your organization<div className="muted">Profile for the local support check</div></Link>
          </div>
        </Window>
      )}
    </div>
  );
}
