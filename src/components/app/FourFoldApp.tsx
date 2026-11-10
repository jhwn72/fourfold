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
import Hint from "../Hint";
import Tick from "./Tick";
import Window from "./Window";
import PillNav from "../chrome/PillNav";
import CornerControls, { ThemePill } from "../chrome/CornerControls";
import { FontPanel } from "../FontSwitcher";
import a from "./FourFoldApp.module.css";
import { shortReason } from "./shortReason";
import { draftOfferLetter } from "@/lib/offerLetter";
import { Star, AssumeNote } from "../Assume";
import GroupCard, { type GroupWindow } from "../group/GroupCard";
import AreaCard, { type AreaWindow } from "../group/AreaCard";
import { GroupCallSheet, GroupChecklist, GroupFund } from "../group/GroupWindows";
import NextSteps, { NextStepsCompact } from "../next/NextSteps";

export type AppGroup = { key: string; label: string; city: string; ids: string[]; homes: number; spread: string; avgPerHome: number | null; nearby: number | null; cx: number; cy: number; spanFt: number };
// An area to build in: a dense pocket of first-screen lots (src/lib/areas.ts), with what's for sale in it.
export type AppArea = { id: string; city: string; rank: number; label: string; lots: number; upToHomes: number; forSale: string[]; leads: string[]; targets: string[]; cx: number; cy: number; spanFt: number; size: string; cellCount: number; threshold: number };
export type AppCity = { total: number; sf: number; splittable: number; candidates: number; inDistrict: number; reasons: [string, number][] };
type Tab = "sites" | "groups" | "city";
export type CityName = "Santa Ana" | "Anaheim" | "Fullerton";
const CITY_NAMES: CityName[] = ["Santa Ana", "Anaheim", "Fullerton"];
// Off-market targets: not for sale, owners not contacted, a first screen (data/proactive-targets.json).
export type OffTarget = { apn: string; address: string; city: string; lotSqft: number; zone: string; cluster: string | null; reasons: string[]; centroid: [number, number] };
export type OffCluster = { id: string; city: string; count: number; median: number | null; center: [number, number] };
type SitesMode = "sale" | "leads" | "off";
const topReason = (t: OffTarget) => t.reasons.find((x) => /transit/i.test(x)) ? "Near high-quality transit" : t.reasons.find((x) => /dense group/i.test(x)) ? "In a dense group of candidate lots" : t.reasons[0] ?? "";
const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
type Win = null | "checklist" | "calls" | "fund" | "support" | "check" | "more" | "next" | "letter" | GroupWindow | AreaWindow;

const money = (n: number | null | undefined) => (n == null ? "UNKNOWN" : "$" + n.toLocaleString("en-US"));
const vClass = (v: string) => `status verdict-${v.replace(" ", "_")}`;
const fmt = (n: number) => n.toLocaleString("en-US");

export default function FourFoldApp({ results, listings, groups, areas, city, cities, leads, targets, clusters, ocProjects }: { results: SiteResult[]; listings: MapListing[]; groups: AppGroup[]; areas: AppArea[]; city: AppCity; cities: Record<CityName, AppCity>; leads: SiteResult[]; targets: OffTarget[]; clusters: OffCluster[]; ocProjects: number }) {
  const [mode, setMode] = useState<SitesMode>("sale");
  const [offSel, setOffSel] = useState<string | null>(null);
  const [cluster, setCluster] = useState<string | null>(null);
  const [areaSel, setAreaSel] = useState<string | null>(null);
  const [areaCity, setAreaCity] = useState<"All" | CityName>("All");
  const [cityKey, setCityKey] = useState<CityName>("Santa Ana");
  const [copied, setCopied] = useState(false);
  void city;
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
    const s = q.get("site"); if (s && (results.some((r) => r.id === s) || leads.some((r) => r.id === s))) { setSel(s); setLotStart(performance.now() + 450); }
    const w = q.get("window"); if (w) setWin(w as Win);
    const aq = q.get("area"); if (aq && areas.some((x) => x.id === aq)) { setTab("groups"); setAreaSel(aq); }
    const gq = q.get("group"); if (gq && groups.some((x) => x.key === gq)) { setTab("groups"); setGroup(gq); }
  }, [results, groups, leads, areas]);
  useEffect(() => {
    const q = new URLSearchParams();
    if (tab !== "sites") q.set("tab", tab);
    if (sel) q.set("site", sel);
    if (group) q.set("group", group);
    if (areaSel) q.set("area", areaSel);
    window.history.replaceState(null, "", q.toString() ? `/app?${q}` : "/app");
  }, [tab, sel, group, areaSel]);

  const site = results.find((r) => r.id === sel) ?? leads.find((r) => r.id === sel) ?? null;
  const isLead = Boolean(site && leads.some((r) => r.id === site.id));
  const rank = (id: string) => results.findIndex((r) => r.id === id) + 1;
  const off = targets.find((t) => t.apn === offSel) ?? null;
  const offCluster = clusters.find((c) => c.id === cluster) ?? null;
  const offTargetCluster = off?.cluster ? clusters.find((c) => c.id === off.cluster) ?? null : null;
  // Which city's particles are on the stage, and where the camera looks for off-market picks.
  const area = tab === "groups" ? areas.find((x) => x.id === areaSel) ?? null : null;
  const g0 = tab === "groups" ? groups.find((x) => x.key === group) ?? null : null;
  const stageCity: CityName = tab === "city" ? cityKey : off ? (off.city as CityName) : area ? (area.city as CityName) : g0 ? (g0.city as CityName) : offCluster ? (offCluster.city as CityName) : "Santa Ana";
  const pointFocus = off ? { cx: off.centroid[0], cy: off.centroid[1], span: 1400 }
    : area ? { cx: area.cx, cy: area.cy, span: Math.max(area.spanFt * 1.6, 4500) }
    : g0 ? { cx: g0.cx, cy: g0.cy, span: g0.spanFt * 2 + 2500 }
    : offCluster ? { cx: offCluster.center[0], cy: offCluster.center[1], span: 4000 } : null;
  const byId = (id: string) => results.find((r) => r.id === id) ?? leads.find((r) => r.id === id);
  const shownAreas = areas.filter((x) => areaCity === "All" || x.city === areaCity).sort((p, q) => q.lots - p.lots || q.forSale.length - p.forSale.length || q.leads.length - p.leads.length);
  const areaSale = area ? area.forSale.map(byId).filter((r): r is SiteResult => !!r) : [];
  const areaLeads = area ? area.leads.map(byId).filter((r): r is SiteResult => !!r) : [];
  const areaTargets = area ? area.targets.map((apn) => targets.find((t) => t.apn === apn)).filter((t): t is OffTarget => !!t) : [];
  const cityData = cities[cityKey];
  const onSelect = useCallback((id: string) => { setSel((s) => (s === id ? null : id)); setLotStart(performance.now() + 450); setTab("sites"); }, []);
  const close = useCallback(() => setWin(null), []);
  const g = groups.find((x) => x.key === group) ?? null;
  const gMembers = g ? g.ids.map((id) => results.find((r) => r.id === id) ?? leads.find((r) => r.id === id)).filter((r): r is SiteResult => !!r) : [];
  const groupOf = (id: string) => groups.find((x) => x.ids.length > 1 && x.ids.includes(id));
  // Panel content slides in from the side the tab sits on (Sites, Groups, City, left to right).
  const ORDER: Tab[] = ["sites", "groups", "city"];
  const [dir, setDir] = useState(1);
  const MODES: SitesMode[] = ["sale", "leads", "off"];
  const [modeDir, setModeDir] = useState(1);
  const pickMode = (m: SitesMode) => { if (m !== mode) setModeDir(MODES.indexOf(m) > MODES.indexOf(mode) ? 1 : -1); setMode(m); };
  const [cityDir, setCityDir] = useState(1);
  const pickCity = (c: CityName) => { if (c !== cityKey) setCityDir(CITY_NAMES.indexOf(c) > CITY_NAMES.indexOf(cityKey) ? 1 : -1); setCityKey(c); };
  const pickTab = (t: Tab) => { if (t !== tab) setDir(ORDER.indexOf(t) > ORDER.indexOf(tab) ? 1 : -1); setTab(t); if (t !== "sites") { setSel(null); setOffSel(null); } if (t !== "groups") { setGroup(null); setCluster(null); setAreaSel(null); } };

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
        {tab === "sites" && !site && !off && (
          <>
            <div className={a.seg} role="group" aria-label="Which sites">
              <button type="button" aria-pressed={mode === "sale"} onClick={() => pickMode("sale")}>For sale ({results.length})</button>
              <button type="button" aria-pressed={mode === "leads"} onClick={() => pickMode("leads")}>Leads ({leads.length})</button>
              <button type="button" aria-pressed={mode === "off"} onClick={() => pickMode("off")}>Off-market ({targets.length})</button>
            </div>
          </>
        )}
        {tab === "sites" && !site && !off && mode === "leads" && (
          <div key="m-leads" className="ff-tabpane" style={{ "--dir": modeDir } as React.CSSProperties}>
            <h1 className={a.title}><Tick value={leads.length} /> leads in Anaheim and Fullerton<span className="second">Confirm before you call</span></h1>
            <p className={a.lede}>Leads in Anaheim and Fullerton from web search. Confirm each on the listing page before any call.</p>
            <div className={`card ${a.section}`}>
              <div className={a.cardHead}><span className="eyebrow">Unverified leads</span></div>
              <ol className={a.list}>
                {leads.map((r) => (
                  <li key={r.id}>
                    <button type="button" className={a.row} style={{ gridTemplateColumns: "1fr auto auto" }} onClick={() => onSelect(r.id)}>
                      <span className={a.addr}>{r.address}<span className={a.rowCity}>{r.city}</span></span>
                      <span className={a.chip}>Unverified</span>
                      <span className={a.per}>Confirm price</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
        {tab === "sites" && !site && !off && mode === "off" && (
          <div key="m-off" className="ff-tabpane" style={{ "--dir": modeDir } as React.CSSProperties}>
            <h1 className={a.title}><Tick value={targets.length} /> lots to make offers on<span className="second">Off-market, owners not contacted</span></h1>
            <p className={a.lede}>Ranked by lot size, in dense pockets. <Hint tip="Not for sale. Owners not contacted. A first screen on public data, not a final answer." /></p>
            <div className={`card ${a.section}`}>
              <div className={a.cardHead}><span className="eyebrow">Off-market targets, 25 per city</span></div>
              <ol className={a.list}>
                {targets.map((t) => (
                  <li key={t.apn}>
                    <button type="button" className={a.row} style={{ gridTemplateColumns: "1fr auto" }} onClick={() => setOffSel(t.apn)}>
                      <span className={a.addr}>{titleCase(t.address)}<span className={a.rowCity}>{t.city} · {topReason(t)}</span></span>
                      <span className={a.per}>{fmt(t.lotSqft)} sq ft</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
        {tab === "sites" && off && (
          <div className={a.site}>
            <button type="button" className={a.back} onClick={() => setOffSel(null)}>← Off-market</button>
            <div className="eyebrow">{off.city} · Parcel {off.apn}</div>
            <h1 className={a.siteTitle}>{titleCase(off.address)}</h1>
            <p className={a.reason}><span className={a.chip}>Off-market</span> Not for sale. Owner not contacted. <Hint /></p>
            <div className={a.nums}>
              <div><div className="eyebrow">Lot</div><div className={a.big}>{fmt(off.lotSqft)} sq ft</div></div>
              <div><div className="eyebrow">Zone</div><div className={a.big}>{off.zone}</div></div>
              {offTargetCluster && <div><div className="eyebrow">Group</div><div className={a.big}>{fmt(offTargetCluster.count)} lots</div></div>}
            </div>
            <ul style={{ margin: "0 0 4px", paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
              {off.reasons.map((x) => <li key={x} style={{ marginBottom: 4 }}>{x}</li>)}
            </ul>
            {offTargetCluster && <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>Its quarter-mile cell holds {fmt(offTargetCluster.count)} first-screen lots, so offers can be grouped.</p>}
            <div className={a.actions}>
              <button type="button" onClick={() => setWin("letter")}>Offer letter</button>
            </div>
            <p className="faint" style={{ fontSize: 11.5, margin: "12px 0 0" }}>Still needs the full parcel check (tenants, rent rules, prior splits) before any outreach.</p>
          </div>
        )}
        {tab === "sites" && !site && !off && mode === "sale" && (
          <div key="m-sale" className="ff-tabpane" style={{ "--dir": modeDir } as React.CSSProperties}>
            <h1 className={a.title}><Tick value={results.length} /> houses for sale<span className="second"><Tick value={results.filter((r) => r.verdict === "LIKELY YES").length} /> can likely become 4 homes each</span></h1>
            <p className={a.lede}>Investors can&apos;t split a lot under SB 9 unless they live there 3 years. Nonprofits can.</p>
            <div className="card" style={{ marginTop: 18 }}>
              <div className={a.cardHead}><span className="eyebrow">Ranked: best per home first</span></div>
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
          </div>
        )}

        {tab === "sites" && site && (
          <div className={a.site}>
            <button type="button" className={a.back} onClick={() => setSel(null)}>{isLead ? "← Leads" : "← All sites"}</button>
            <div className="eyebrow">{isLead ? `Unverified lead · ${site.city}` : `№${rank(site.id)}`} · Parcel {site.parcel?.apn ?? "UNKNOWN"}</div>
            <h1 className={a.siteTitle}>{site.address}</h1>
            <p className={a.reason}><span className={vClass(site.verdict)}>{site.verdict}</span> {shortReason(site.verdict_reason)}</p>
            <LotNumbers startAt={lotStart} asking={site.asking_price ?? null} perHome={site.land_cost_per_home ?? null} homes={site.max_homes ?? null} split={Boolean(site.split && site.max_homes && site.max_homes >= 4 && site.parcel)}>{(v) => (
            <div className={a.nums}>
              <div><div className="eyebrow">Homes</div><div className={`${a.big} accent`}>{v.homes}</div></div>
              <div><div className="eyebrow">Per home</div><div className={`${a.big} accent`}>{isLead && site.asking_price == null ? "Needs price" : v.perHome}</div></div>
              <div><div className="eyebrow">Asking</div><div className={a.big}>{isLead && site.asking_price == null ? "Confirm price" : money(site.asking_price)}</div></div>
            </div>
            )}</LotNumbers>
            <p className="faint" style={{ fontSize: 11.5, margin: "0 0 14px" }}>Sample budget: $360k per home<Star /></p>
            {groupOf(site.id) && <p className="muted" style={{ margin: "0 0 8px", fontSize: 13 }}>Part of {groupOf(site.id)!.label}: {groupOf(site.id)!.ids.length} sites, <span className="accent">{groupOf(site.id)!.homes} homes</span> within {groupOf(site.id)!.spread}.</p>}
            <div className={a.gate}><RecommendGate verdict={site.verdict} city={site.city}><span className="status verdict-LIKELY_YES">Recommended: make the first call</span></RecommendGate></div>
            {/* NextCallCard links to #call-sheet; in the app that opens the Call sheet window instead. */}
            <div className={a.next} onClickCapture={(e) => { const t = (e.target as HTMLElement).closest("a"); if (t && t.getAttribute("href") === "#call-sheet") { e.preventDefault(); setWin("calls"); } }}>
              <NextCallCard r={site} />
            </div>
            <div style={{ marginTop: 14 }}><NextStepsCompact result={site} onOpen={() => setWin("next")} /></div>
            <div className={a.actions}>
              <button type="button" onClick={() => setWin("next")}>What&apos;s next</button>
              <button type="button" onClick={() => setWin("checklist")}>Checklist</button>
              <button type="button" onClick={() => setWin("calls")}>Call sheet</button>
              {site.max_homes ? <button type="button" onClick={() => setWin("fund")}>Fund the gap</button> : null}
              <button type="button" onClick={() => setWin("support")}>Local support</button>
              <a href={`/site/${site.id}/brief`} className={a.linkBtn}>Briefing PDF</a>
            </div>
          </div>
        )}

        {tab === "groups" && area && (
          <AreaCard
            area={area} forSale={areaSale} leads={areaLeads} targets={areaTargets}
            onBack={() => setAreaSel(null)}
            onSelectSite={(id) => { setSel(id); setLotStart(performance.now() + 450); setTab("sites"); setAreaSel(null); }}
            onSelectTarget={(apn) => { setOffSel(apn); setMode("off"); setTab("sites"); setAreaSel(null); }}
            onOpen={(w) => setWin(w)}
          />
        )}
        {tab === "groups" && !area && g && (
          <GroupCard
            group={g}
            members={gMembers}
            onBack={() => setGroup(null)}
            onSelectSite={(id) => { setSel(id); setLotStart(performance.now() + 450); setTab("sites"); }}
            onOpen={(w) => setWin(w)}
          />
        )}
        {tab === "groups" && !area && !g && (
          <>
            <div className={a.seg} role="group" aria-label="City">
              {(["All", ...CITY_NAMES] as const).map((n) => <button key={n} type="button" aria-pressed={areaCity === n} onClick={() => setAreaCity(n)}>{n}</button>)}
            </div>
            <h1 className={a.title}><Tick value={shownAreas.length} /> areas to build in<span className="second">Dense pockets of buildable lots <Hint /></span></h1>
            <p className={a.lede}>Quarter-mile cells with at least {areas[0]?.threshold ?? ""} first-screen lots<Star />, merged where they touch. One area, one city desk, one crew.</p>
            {shownAreas.map((x) => (
              <button key={x.id} type="button" className={`card ${a.groupCard}`} onClick={() => setAreaSel(x.id)}>
                <div className={a.cardHead}><span className="eyebrow">{x.label}</span><span className="accent" style={{ fontFamily: "var(--font-mono)" }}><Tick value={x.lots} /> lots</span></div>
                <div style={{ fontSize: 14 }}><Tick value={x.forSale.length} /> for sale · <Tick value={x.leads.length} /> lead{x.leads.length === 1 ? "" : "s"} · <Tick value={x.targets.length} /> off-market target{x.targets.length === 1 ? "" : "s"}</div>
                <div className="muted" style={{ marginTop: 4 }}>Up to <Tick value={x.upToHomes} /> homes<Star /> · {x.size}</div>
              </button>
            ))}
            <p className="faint" style={{ fontSize: 11.5, margin: "0 0 14px" }}>Up to = lots × 4, an upper bound before any site is confirmed.</p>
            {groups.filter((x) => areaCity === "All" || x.city === areaCity).length > 0 && (
              <div className={a.section}>
                <div className={a.cardHead}><span className="eyebrow">Listings close together</span></div>
                <p className="muted" style={{ fontSize: 12.5, margin: "0 0 12px" }}>2+ viable listings or leads within 0.5 mi<Star /> of each other, outside the areas above.</p>
                {groups.filter((x) => areaCity === "All" || x.city === areaCity).map((x) => (
                  <button key={x.key} type="button" className={`card ${a.groupCard} ${group === x.key ? a.groupOn : ""}`} onClick={() => setGroup(x.key)}>
                    <div className={a.cardHead}><span className="eyebrow">{x.label} · {x.city}</span><span className="accent" style={{ fontFamily: "var(--font-mono)" }}>{x.homes} homes</span></div>
                    <div style={{ fontSize: 14 }}>{x.ids.map((id) => byId(id)?.address).join(" · ")}</div>
                    <div className="muted" style={{ marginTop: 4 }}>Within {x.spread}{x.avgPerHome ? ` · ${money(x.avgPerHome)} per home` : ""}{x.nearby != null ? ` · ${fmt(x.nearby)} first-screen lots within 0.5 mi of its center` : ""}</div>
                  </button>
                ))}
              </div>
            )}
            <Link href="/clusters" className={a.more}>Listing groups at 0.25 / 0.5 / 1 mi →</Link>
          </>
        )}

        {tab === "city" && (
          <>
            <div className={a.seg} role="group" aria-label="City">
              {CITY_NAMES.map((n) => <button key={n} type="button" aria-pressed={cityKey === n} onClick={() => pickCity(n)}>{n}</button>)}
            </div>
            <div key={"c-" + cityKey} className="ff-tabpane" style={{ "--dir": cityDir } as React.CSSProperties}>
            <h1 className={a.title}><Tick value={cityData.candidates} /> lots could split<span className="second">of <Tick value={cityData.total} /> in {cityKey} <Hint /></span></h1>
            <div className="card">
              {[["Parcels", cityData.total], ["Single-family zone", cityData.sf], ["Big enough to split", cityData.splittable], [cityKey === "Santa Ana" ? "Pass flood, fire, historic" : "Pass flood and fire", cityData.candidates]].map(([k, v], i) => (
                <div key={k as string} style={{ marginBottom: 10 }}>
                  <div className={a.cardHead} style={{ marginBottom: 2 }}><span className="eyebrow">{k}</span><span className={i === 3 ? "accent" : ""} style={{ fontFamily: "var(--font-mono)" }}><Tick value={v as number} /></span></div>
                  <div className="statbar"><i style={{ width: `${((v as number) / cityData.total) * 100}%`, background: i === 3 ? "var(--accent)" : undefined }} /></div>
                </div>
              ))}
              <p className="faint" style={{ fontSize: 11.5, margin: "6px 0 0" }}>{cityKey === "Santa Ana" ? `+${fmt(cityData.inDistrict)} in a historic district (possible fail). ` : "Historic status UNKNOWN: no city historic layer checked. "}Tenants, rent rules and prior splits not checked here.</p>
            </div>
            <div className={a.footLinks}>{cityKey === "Santa Ana" && <Link href="/city">Search all {fmt(cityData.candidates)} lots →</Link>}<Link href="/comparables">{ocProjects} OC SB 9 projects →</Link></div>
          </div>
          </>
        )}

        </div>
        <div className={a.disclaimer}>{(tab !== "city") && <AssumeNote style={{ margin: "0 0 6px" }} />}Prototype. Not legal or financial advice. Confirm with the city and a professional.</div>
      </aside>

      <section className={a.stage}>
        <MapStage site={site} listings={listings} onSelect={onSelect} focus={g ? g.ids : null} stageCity={stageCity} pointFocus={pointFocus} cityView={tab === "city"} inset={inset} lotStart={lotStart} onReplay={replay} />
      </section>

      {win === "checklist" && site && (
        <Window title={`SB 9 checklist · ${site.address}`} onClose={close}><Checklist result={site} showSummary={false} /></Window>
      )}
      {win === "calls" && site && <Window title={`Call sheet · ${site.address}`} onClose={close}><CallSheet result={site} /></Window>}
      {win === "fund" && site && (
        <Window title={`Fund the gap · ${site.address}`} onClose={close} note><InvestorCard r={site} /><FundGap r={site} /></Window>
      )}
      {win === "next" && site && <Window title={`What's next · ${site.address}`} onClose={close}><NextSteps result={site} /></Window>}
      {win === "group-checklist" && g && (
        <Window title={`SB 9 checklist · ${g.label}`} onClose={close}><GroupChecklist members={gMembers} /></Window>
      )}
      {win === "group-calls" && g && (
        <Window title={`Call sheet · ${g.label}`} onClose={close}><GroupCallSheet members={gMembers} /></Window>
      )}
      {win === "group-fund" && g && (
        <Window title={`Fund the gap · ${g.label}`} onClose={close} note><GroupFund members={gMembers} /></Window>
      )}
      {win === "area-letters" && area && (
        <Window title={`Offer letters · ${area.label}`} onClose={close}>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{areaTargets.length} drafts, one per off-market target. Nothing is sent. Owners not contacted; no owner names are used. Run the full parcel check first.</p>
          <div className={a.actions}>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(areaTargets.map((t) => draftOfferLetter({ site_address: titleCase(t.address), city: t.city })).join("\n\n----------\n\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); }}>{copied ? "Copied" : `Copy all ${areaTargets.length} letters`}</button>
          </div>
          {areaTargets.map((t) => (
            <div key={t.apn} style={{ marginTop: 18 }}>
              <div className="eyebrow">{titleCase(t.address)} · Parcel {t.apn}</div>
              <pre className={a.letter}>{draftOfferLetter({ site_address: titleCase(t.address), city: t.city })}</pre>
            </div>
          ))}
        </Window>
      )}
      {win === "area-checklist" && area && (
        <Window title={`SB 9 checklist · ${area.label}`} onClose={close}><GroupChecklist members={[...areaSale, ...areaLeads]} /></Window>
      )}
      {win === "letter" && off && (
        <Window title={`Offer letter · ${titleCase(off.address)}`} onClose={close} size="sm">
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>A draft only. Nothing is sent. Owner not contacted; no owner names are used. Run the full parcel check first.</p>
          <pre className={a.letter}>{draftOfferLetter({ site_address: titleCase(off.address), city: off.city })}</pre>
          <div className={a.actions}>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(draftOfferLetter({ site_address: titleCase(off.address), city: off.city })).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); }}>{copied ? "Copied" : "Copy letter"}</button>
          </div>
        </Window>
      )}
      {win === "support" && (
        <Window title="Local support" onClose={close} note><SupportPanel city={site?.city ?? "Santa Ana"} /><h3 style={{ marginTop: 20 }}>Your organization</h3><OrgProfile /></Window>
      )}
      {win === "check" && <Window title="Check an address" onClose={close} size="sm"><LiveCheck heading={false} /></Window>}
      {win === "more" && (
        <Window title="More" onClose={close} size="sm">
          <div className={a.moreGrid}>
            <Link href="/learn" className="card">Project outcomes<div className="muted">What FourFold learns from real projects</div></Link>
            <Link href="/comparables" className="card">OC SB 9 projects<div className="muted">{ocProjects} from state housing reports</div></Link>
            <Link href="/method" className="card">How it works<div className="muted">Tests, sources, assumptions, unknowns</div></Link>
            <Link href="/brief" className="card">Call list (PDF)<div className="muted">All 10 sites, printable</div></Link>
            <a href="/results.csv" download className="card">Results (CSV)<div className="muted">Every check and number</div></a>
            <Link href="/org" className="card">Your organization<div className="muted">Profile for the local support check</div></Link>
            <Link href="/" className="card">Back to intro<div className="muted">The FourFold landing page</div></Link>
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
