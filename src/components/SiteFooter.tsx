"use client";
import { usePathname } from "next/navigation";

/** Global footer. Hidden on "/" because the app panel shows the disclaimer itself. */
export default function SiteFooter() {
  const path = usePathname() ?? "/";
  if (path === "/") return null;
  return (
    <footer className="site-footer">
      <div>Prototype. Not legal or financial advice. Confirm with the city and a professional.</div>
      <div className="eyebrow" style={{ marginTop: 6 }}>
        Data checked 2026-11-07 · <a href="https://github.com/jhwn72/fourfold" target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }}>GitHub</a>
      </div>
    </footer>
  );
}
