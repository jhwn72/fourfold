"use client";
// The floating glass pill nav from the landing page, shared by the app and the inner pages.
import Link from "next/link";
import s from "./chrome.module.css";

export type PillItem = { label: string; href?: string; onClick?: () => void; active?: boolean; short?: string };

function Item({ it, className, role }: { it: PillItem; className: string; role?: string }) {
  const body = it.short ? <><span className={s.long}>{it.label}</span><span className={s.short}>{it.short}</span></> : it.label;
  if (it.href) return <Link href={it.href} className={className} aria-current={it.active ? "page" : undefined}>{body}</Link>;
  return <button type="button" className={className} onClick={it.onClick} role={role} aria-selected={role === "tab" ? Boolean(it.active) : undefined}>{body}</button>;
}

export default function PillNav({ items, ghost, solid, tabs = false, extra }: { items: PillItem[]; ghost?: PillItem; solid?: PillItem; tabs?: boolean; extra?: React.ReactNode }) {
  return (
    <nav className={s.nav} aria-label="Main">
      <Link href="/" className={s.glyph} aria-label="FourFold home"><span /><span /><span /><span /></Link>
      <span className={s.items} role={tabs ? "tablist" : undefined} aria-label={tabs ? "App sections" : undefined}>
        {items.map((it) => <Item key={it.label} it={it} role={tabs ? "tab" : undefined} className={`${s.link} ${it.active ? s.on : ""}`} />)}
      </span>
      {ghost && <Item it={ghost} className={s.ghost} />}
      {solid && <Item it={solid} className={s.solid} />}
      {extra}
    </nav>
  );
}
