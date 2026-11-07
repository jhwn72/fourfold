"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import s from "./NavBar.module.css";
import ThemeToggle from "./ThemeToggle";

const ITEMS = [
  { href: "/", label: "Sites" },
  { href: "/city", label: "Whole city" },
  { href: "/comparables", label: "SB 9 projects" },
  { href: "/method", label: "How it works" },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/" || path.startsWith("/site") || path === "/brief";
  return path === href || path.startsWith(href + "/");
}

export default function NavBar() {
  const path = usePathname() ?? "/";
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
        <nav className={s.nav} aria-label="Main">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} className={`${s.link} ${isActive(path, i.href) ? s.active : ""}`} aria-current={isActive(path, i.href) ? "page" : undefined}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className={s.right}>
          <ThemeToggle />
          <Link href="/check" className={`btn-primary ${s.cta}`}>
            <span className={s.ctaLong}>Check an address →</span>
            <span className={s.ctaShort}>Check</span>
          </Link>
          <button type="button" className={s.menuBtn} aria-expanded={open} aria-controls="nav-sheet" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>
      {open && (
        <nav id="nav-sheet" className={s.sheet} aria-label="Main">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} className={`${s.sheetLink} ${isActive(path, i.href) ? s.active : ""}`} onClick={() => setOpen(false)}>
              {i.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
