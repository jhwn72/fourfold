"use client";
import { useState } from "react";
import { buildCallSheet } from "@/lib/callsheet";
import type { SiteResult } from "@/lib/types";

export default function NextCallCard({ r }: { r: SiteResult }) {
  const sheet = buildCallSheet(r);
  const email = sheet.email;
  // Lead with the listing agent: one call settles tenants, rent rules and covenants.
  const groups = [...sheet.groups].sort((a, b) => (a[0] === "Listing agent" ? -1 : b[0] === "Listing agent" ? 1 : 0));
  const [copied, setCopied] = useState(false);
  if (!groups.length) return null;
  const [who, items] = groups[0];
  const total = groups.reduce((s, [, it]) => s + it.length, 0);
  const more = total - Math.min(2, items.length);
  return (
    <div className="card" style={{ margin: 0, height: "100%" }}>
      <div className="eyebrow">Next call</div>
      <h3 style={{ margin: "6px 0 10px", fontSize: 20, fontWeight: 300 }}>{who}</h3>
      <ol style={{ paddingLeft: 18, margin: "0 0 12px" }}>
        {items.slice(0, 2).map((it) => <li key={it.question} style={{ marginBottom: 6 }}>{it.question}</li>)}
      </ol>
      {more > 0 && <p className="muted" style={{ margin: "0 0 14px" }}>{more} more in the <a href="#call-sheet">call sheet</a>.</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {email && (
          <button type="button" className="btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(email); setCopied(true); } catch {} }}>
            {copied ? "Copied" : "Copy email to agent"}
          </button>
        )}
        <a href="#call-sheet" className="chip" style={{ textDecoration: "none" }}>See call sheet</a>
      </div>
      <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>Drafts only. Nothing is sent.</p>
    </div>
  );
}
