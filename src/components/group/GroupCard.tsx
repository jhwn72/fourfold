"use client";
// The expanded group card: same layout and density as the selected-site card in FourFoldApp,
// rolled up across the group's members. Every number comes from results.json via summarizeGroup.
import { useMemo, useState } from "react";
import { groupAgentEmail, summarizeGroup } from "@/lib/groupSummary";
import type { SiteResult } from "@/lib/types";
import a from "../app/FourFoldApp.module.css";
import s from "./GroupCard.module.css";
import { Star, AssumeNote } from "@/components/Assume";

export type GroupWindow = "group-checklist" | "group-calls" | "group-fund";
export type GroupInfo = { key: string; label: string; ids: string[]; spread: string; nearby: number | null };

const money = (n: number | null | undefined) => (n == null ? "UNKNOWN" : "$" + Math.round(n).toLocaleString("en-US"));
const vClass = (v: string) => `status verdict-${v.replace(" ", "_")}`;
const vWord = (v: string) => (v === "LIKELY YES" ? "Yes" : v === "UNKNOWN" ? "Check" : "No");

export default function GroupCard({ group, members, onBack, onSelectSite, onOpen }: {
  group: GroupInfo; members: SiteResult[]; onBack: () => void; onSelectSite: (id: string) => void; onOpen: (w: GroupWindow) => void;
}) {
  const sum = useMemo(() => summarizeGroup(members, group.spread), [members, group.spread]);
  const email = useMemo(() => groupAgentEmail(members, sum), [members, sum]);
  const [copied, setCopied] = useState(false);
  const short = (id: string) => members.find((m) => m.id === id)?.address.split(",")[0] ?? id;
  const best = sum.bestCall;
  const moreQs = sum.questions.length - Math.min(2, best?.questions.length ?? 0);

  return (
    <div className={a.site}>
      <button type="button" className={a.back} onClick={onBack}>← Back to groups</button>
      <div className="eyebrow">{group.label} · {sum.sites} site{sum.sites === 1 ? "" : "s"}{sum.cities.length ? ` · ${sum.cities.join(", ")}` : ""}</div>
      <h1 className={a.siteTitle} style={{ fontSize: 22 }}>{members.map((m) => m.address.split(",")[0]).join(" · ")}</h1>
      <div className={s.chips}>
        {(["LIKELY YES", "UNKNOWN", "NO"] as const).filter((v) => sum.verdicts[v]).map((v) => (
          <span key={v} className={vClass(v)}>{sum.verdicts[v]} {v === "LIKELY YES" ? "likely yes" : v === "UNKNOWN" ? "to check" : "no"}</span>
        ))}
      </div>
      <p className={a.reason}>{sum.reason}.</p>

      <div className={a.nums}>
        <div><div className="eyebrow">Homes</div><div className={`${a.big} accent`}>{sum.homesUnknown ? (sum.homes ? `${sum.homes}+` : "UNKNOWN") : sum.homes}</div></div>
        <div><div className="eyebrow">Per home</div><div className={`${a.big} accent`}>{money(sum.perHome)}</div></div>
        <div><div className="eyebrow">Total asking</div><div className={a.big}>{sum.priceUnknown ? (sum.totalAsking ? `${money(sum.totalAsking)}+` : "UNKNOWN") : money(sum.totalAsking)}</div></div>
        {sum.investorPerHome != null && <div><div className="eyebrow">Investor / home</div><div className={a.big}>{money(sum.investorPerHome)}</div></div>}
      </div>
      <p className="faint" style={{ fontSize: 11, margin: "6px 0 0" }}>Per home = combined asking ÷ combined homes, before construction. Asking price is not the sale price.</p>

      <p className={s.why}>
        Why grouped: {members.length > 1 ? `every pair within ${group.spread}` : "no other viable listing nearby"}
        {sum.cities.length === 1 ? `, one city (${sum.cities[0]}), one planning desk` : sum.cities.length > 1 ? `, ${sum.cities.length} cities` : ""}
        {sum.zone ? `, same zone (${sum.zone})` : ""}
        {group.nearby != null ? `, ${group.nearby.toLocaleString("en-US")} first-screen candidate lots nearby` : ""}.
         0.5 mi radius<Star /> is a team judgment.
      </p>

      <div className="card" style={{ padding: "8px 6px", margin: "0 0 10px" }}>
        <div className={`${s.mhead} eyebrow`}><span>Members</span><span /><span>Homes</span><span>Per home</span></div>
        <ol className={s.members}>
          {members.map((m) => (
            <li key={m.id}>
              <button type="button" className={s.mrow} onClick={() => onSelectSite(m.id)} title={`Open ${m.address}`}>
                <span className={s.maddr}>{m.address}</span>
                <span className={vClass(m.verdict)}>{vWord(m.verdict)}</span>
                <span className={s.mnum}>{m.max_homes ?? "UNKNOWN"}</span>
                <span className={s.mnum}>{m.max_homes === 0 ? "n/a" : money(m.land_cost_per_home)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {best && (
        <div className={a.next}>
          <div className="card" style={{ margin: 0 }}>
            <div className="eyebrow">Next call for the group</div>
            <h3 style={{ margin: "6px 0 10px", fontSize: 20, fontWeight: 300 }}>{best.who}</h3>
            <ol style={{ paddingLeft: 18, margin: "0 0 12px" }}>
              {best.questions.slice(0, 2).map((q) => (
                <li key={q.checkId + q.question} style={{ marginBottom: 6 }}>
                  {q.question}
                  <span className={s.applies}>Applies to {q.memberIds.length === members.length && members.length > 1 ? "all sites" : q.memberIds.map(short).join(", ")}</span>
                </li>
              ))}
            </ol>
            {moreQs > 0 && <p className="muted" style={{ margin: "0 0 10px" }}>{moreQs} more in the <a href="#" onClick={(e) => { e.preventDefault(); onOpen("group-calls"); }}>group call sheet</a>.</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {email && (
                <button type="button" className="btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(email); setCopied(true); } catch {} }}>
                  {copied ? "Copied" : "Copy email to agents"}
                </button>
              )}
            </div>
            <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>Drafts only. Nothing is sent.</p>
          </div>
        </div>
      )}

      <div className={a.actions}>
        <button type="button" onClick={() => onOpen("group-checklist")}>Checklist</button>
        <button type="button" onClick={() => onOpen("group-calls")}>Call sheet</button>
        {sum.homes > 0 && <button type="button" onClick={() => onOpen("group-fund")}>Fund the gap</button>}
      </div>
    </div>
  );
}
