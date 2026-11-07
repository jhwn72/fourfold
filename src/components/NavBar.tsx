"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import s from "./NavBar.module.css";
import FontSwitcher, { FontPanel } from "./FontSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const path = usePathname() ?? "/";
  const home = path === "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={s.header}>
        <Link href="/" className={s.brand}>FourFold</Link>
        {!home && <Link href="/" className={s.back}>← Back to app</Link>}
        <div className={s.right}>
          <span className={s.wide}><ThemeToggle variant="icon" /></span>
          <span className={s.wide}><FontSwitcher /></span>
          <Link href="/?window=check" className={`btn-primary ${s.cta}`}>
            <span className={s.ctaLong}>Check an address</span>
            <span className={s.ctaShort}>Check</span>
          </Link>
          <button type="button" className={`iconbtn ${s.menuBtn}`} aria-expanded={open} aria-controls="nav-sheet" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>
      {open && (
        <div id="nav-sheet" className={s.sheet}>
          {!home && <Link href="/" className={s.sheetLink} onClick={() => setOpen(false)}>← Back to app</Link>}
          <div className={s.sheetRow}><span className="eyebrow">Theme</span><ThemeToggle /></div>
          <div style={{ paddingTop: 12 }}><FontPanel style={{ width: "100%", boxShadow: "none" }} /></div>
        </div>
      )}
    </>
  );
}
