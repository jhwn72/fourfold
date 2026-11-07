"use client";
// The floating glass pill nav from the landing page, shared by the app and the inner pages.
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import s from "./chrome.module.css";

export type PillItem = { label: string; href?: string; onClick?: () => void; active?: boolean; short?: string };

function Item({ it, className, role }: { it: PillItem; className: string; role?: string }) {
  const body = it.short ? <><span className={s.long}>{it.label}</span><span className={s.short}>{it.short}</span></> : it.label;
  if (it.href) return <Link href={it.href} className={className} aria-current={it.active ? "page" : undefined}>{body}</Link>;
  return <button type="button" className={className} onClick={it.onClick} role={role} aria-selected={role === "tab" ? Boolean(it.active) : undefined}>{body}</button>;
}

export default function PillNav({ items, ghost, solid, tabs = false, extra }: { items: PillItem[]; ghost?: PillItem; solid?: PillItem; tabs?: boolean; extra?: React.ReactNode }) {
  // Tabs: one pill slides under the active tab (measured with offsetLeft / offsetWidth).
  const itemsRef = useRef<HTMLSpanElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number; ready: boolean } | null>(null);
  const activeIdx = items.findIndex((it) => it.active);
  useLayoutEffect(() => {
    if (!tabs) return;
    const box = itemsRef.current;
    const measure = () => {
      const el = box?.querySelectorAll<HTMLElement>("[role=tab]")[activeIdx];
      setPill((p) => (el ? { x: el.offsetLeft, w: el.offsetWidth, ready: Boolean(p) } : null));
    };
    measure();
    // Re-measure when fonts load or the layout changes width.
    const ro = new ResizeObserver(measure);
    box?.querySelectorAll("[role=tab]").forEach((t) => ro.observe(t));
    return () => ro.disconnect();
  }, [tabs, activeIdx]);
  return (
    <nav className={s.nav} aria-label="Main">
      <Link href="/" className={s.glyph} aria-label="FourFold home"><span /><span /><span /><span /></Link>
      <span ref={itemsRef} className={`${s.items} ${tabs && pill ? s.slid : ""}`} role={tabs ? "tablist" : undefined} aria-label={tabs ? "App sections" : undefined}>
        {tabs && pill && <span aria-hidden className={s.pill} style={{ transform: `translateX(${pill.x}px)`, width: pill.w, transition: pill.ready ? undefined : "none" }} />}
        {items.map((it) => <Item key={it.label} it={it} role={tabs ? "tab" : undefined} className={`${s.link} ${it.active ? s.on : ""}`} />)}
      </span>
      {ghost && <Item it={ghost} className={s.ghost} />}
      {solid && <Item it={solid} className={s.solid} />}
      {extra}
    </nav>
  );
}
