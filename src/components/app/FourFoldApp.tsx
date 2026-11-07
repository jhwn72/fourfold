"use client";
// One screen for the demo: three tabs on the left (Sites, Groups, City), the particle stage on the right,
// and every deeper feature in an expandable window.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteResult } from "@/lib/types";
import CallSheet from "../CallSheet";
import Checklist from "../Checklist";
import FundGap from "../FundGap";
import InvestorCard from "../InvestorCard";
import LiveCheck from "../LiveCheck";
import OrgProfile from "../OrgProfile";
import RecommendGate from "../RecommendGate";
import SupportPanel from "../SupportPanel";
import { LotNumbers } from "../site/AnimatedNumber";
import NextCallCard from "../site/NextCallCard";
import type { MapListing } from "../viz/DotMap";
import MapStage from "./MapStage";
import Window from "./Window";
import PillNav from "../chrome/PillNav";
import CornerControls, { ThemePill } from "../chrome/CornerControls";
import { FontPanel } from "../FontSwitcher";
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
  // One lot clock shared by the particles and the site card's numbers (performance.now() time the story starts).
  // Starts after the camera's 0.45 s fly so the lot assembles as it fades in. Replay restarts it.
  const [lotStart, setLotStart] = useState<number | null>(null);
  const replay = useCallback(() => setLotStart(performance.now()), []);

  // Deep links: ?site=sa-10, ?tab=groups, ?window=fund
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tab"); if (t === "groups" || t === "city") setTab(t);
    const s = q.get("site"); if (s && results.some((r) => r.id === s)) { setSel(s); setLotStart(performance.now() + 450); }
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
  const onSelect = useCallback((id: string) => { setSel((s) => (s === id ? null : id)); setLotStart(performance.now() + 450); setTab("sites"); }, []);
  const close = useCallback(() => setWin(null), []);
  const g = groups.find((x) => x.key === group) ?? null;
  const groupOf = (id: string) => groups.find((x) => x.ids.length > 1 && x.ids.includes(id));
  // Panel content slides in from the side the tab sits on (Sites, Groups, City, left to right).
  const ORDER: Tab[] = ["sites", "groups", "city"];
  const [dir, setDir] = useState(1);
  const pickTab = (t: Tab) => { if (t !== tab) setDir(ORDER.indexOf(t) > ORDER.indexOf(tab) ? 1 : -1); setTab(t); if (t !== "sites") setSel(null); if (t !== "groups") setGroup(null); };

  // The stage fills the viewport; on desktop the floating panel covers its left side, so the 3D frame
  // centers in the space to the right of the panel.
  const panelRef = useRef<HTMLElement>(null);
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const read = () => setInset(window.innerWidth > 860 ? Math.round(el.offsetLeft + el.offsetWidth + 16) : 0);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener("resize", read);
    return () => { ro.disconnect(); window.removeEventListener("resize", read); };
  }, []);

  return (
    <div className={`${a.app} ff-app`}>
      <PillNav
        tabs
        items={(["sites", "groups", "city"] as Tab[]).map((t) => ({ label: t === "sites" ? "Sites" : t === "groups" ? "Groups" : "City", active: tab === t, onClick: () => pickTab(t) }))}
        ghost={{ label: "Check an address", short: "Check", onClick: () => setWin("check") }}
        solid={{ label: "More", onClick: () => setWin("more") }}
      />
      <CornerControls />
      <aside className={a.panel} ref={panelRef}>
        <div key={tab} className="ff-tabpane" style={{ "--dir": dir } as React.CSSProperties}>
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
            <LotNumbers startAt={lotStart} asking={site.asking_price ?? null} perHome={site.land_cost_per_home ?? null} homes={site.max_homes ?? null} split={Boolean(site.split && site.max_homes && site.max_homes >= 4 && site.parcel)}>{(v) => (
            <div className={a.nums}>
              <div><div className="eyebrow">Homes</div><div className={`${a.big} accent`}>{v.homes}</div></div>
              <div><div className="eyebrow">Per home</div><div className={`${a.big} accent`}>{v.perHome}</div></div>
              <div><div className="eyebrow">Asking</div><div className={a.big}>{money(site.asking_price)}</div></div>
              {site.max_homes === 4 && <div><div className="eyebrow">Investor / home</div><div className={a.big}>{money(site.asking_price ? Math.round(site.asking_price / 2) : null)}</div></div>}
            </div>
            )}</LotNumbers>
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

        </div>
        <p className={a.disclaimer}>Prototype. Not legal or financial advice. Confirm with the city and a professional.</p>
      </aside>

      <section className={a.stage}>
        <MapStage site={site} listings={listings} onSelect={onSelect} focus={g ? g.ids : null} cityView={tab === "city"} inset={inset} lotStart={lotStart} onReplay={replay} />
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
          <div className={a.prefs}>
            <div><div className="eyebrow" style={{ marginBottom: 6 }}>Theme</div><ThemePill /></div>
            <FontPanel style={{ width: 250, boxShadow: "none", margin: 0 }} />
          </div>
        </Window>
      )}
    </div>
  );
}
