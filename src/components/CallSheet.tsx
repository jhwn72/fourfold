"use client";
import { useState } from "react";
import { buildCallSheet } from "@/lib/callsheet";
import type { SiteResult } from "@/lib/types";

export default function CallSheet({ result }: { result: SiteResult }) {
  const { groups, email } = buildCallSheet(result);
  const [copied, setCopied] = useState(false);
  if (!groups.length) return null;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Call sheet: what to ask, and who</h3>
      <p className="muted">Every open question above, turned into a call. FourFold drafts these; it never sends anything.</p>
      {groups.map(([who, items]) => (
        <div key={who}>
          <strong>{who}</strong>
          <ol>
            {items.map((it) => <li key={it.question}>{it.question} <span className="muted">({it.why})</span></li>)}
          </ol>
        </div>
      ))}
      {email && (
        <details>
          <summary>Draft email to the listing agent</summary>
          <pre style={{ whiteSpace: "pre-wrap", padding: 10, fontSize: 13 }}>{email}</pre>
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(email); setCopied(true); } catch {} }}>
            {copied ? "Copied" : "Copy draft"}
          </button>
        </details>
      )}
    </div>
  );
}
