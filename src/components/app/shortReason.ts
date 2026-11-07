// Card-size verdict phrase. UI only: the full verdict_reason (from src/lib/sb9.ts) stays in the Checklist window.
function clause(t: string): string {
  const s = t.toLowerCase();
  if (s.includes("flood")) return "flood zone";
  if (s.includes("fire")) return "fire zone";
  if (s.includes("single-family") || s.includes("zone")) return "zoning";
  if (s.includes("historic")) return "historic";
  if (s.includes("tenant")) return "possible tenant";
  if (s.includes("lot") || s.includes("split")) return "lot size";
  if (s.includes("parcel")) return "parcel not found";
  return t.split(/[,.]/)[0].trim();
}

export function shortReason(reason: string): string {
  const r = reason.trim();
  if (/^passes/i.test(r)) return "Passes zoning, lot, flood, fire";
  const m = r.match(/^(fails|possible fail, confirm)\s*:\s*(.*)$/i);
  if (m) {
    const parts = Array.from(new Set(m[2].split(";").map(clause).filter(Boolean)));
    return `${/^fails/i.test(m[1]) ? "Fails" : "Check"}: ${parts.join(", ")}`;
  }
  const first = r.split(/[.;]/)[0];
  return first.length > 48 ? first.slice(0, 46).trimEnd() + "…" : first;
}
