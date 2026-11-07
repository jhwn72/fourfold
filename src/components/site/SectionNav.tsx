const SECTIONS = [
  ["checklist", "Checklist"],
  ["why-nonprofit", "Why nonprofits win"],
  ["call-sheet", "Call sheet"],
  ["fund", "Fund the gap"],
  ["support", "Local support"],
  ["nearby", "Nearby projects"],
  ["sources", "Sources"],
] as const;

export default function SectionNav({ hide = [] }: { hide?: string[] }) {
  return (
    <nav aria-label="Sections" style={{ position: "sticky", top: 57, zIndex: 10, background: "var(--header-bg)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)", margin: "24px -16px 0", padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
      {SECTIONS.filter(([id]) => !hide.includes(id)).map(([id, label]) => (
        <a key={id} href={`#${id}`} className="chip" style={{ whiteSpace: "nowrap", textDecoration: "none" }}>{label}</a>
      ))}
    </nav>
  );
}
