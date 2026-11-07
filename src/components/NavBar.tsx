"use client";
// Header for the inner pages: the landing's floating glass pill, with links back to the app tabs.
// "/" has its own nav and "/app" renders the pill itself (its tabs drive the app state).
import { usePathname } from "next/navigation";
import s from "./NavBar.module.css";
import FontSwitcher from "./FontSwitcher";
import ThemeToggle from "./ThemeToggle";
import PillNav from "./chrome/PillNav";

export default function NavBar() {
  const path = usePathname() ?? "/";
  if (path === "/" || path === "/app") return null;
  return (
    <header className={s.header}>
      <PillNav
        items={[
          { label: "Sites", href: "/app", active: path.startsWith("/site") },
          { label: "Groups", href: "/app?tab=groups", active: path.startsWith("/clusters") },
          { label: "City", href: "/app?tab=city", active: path.startsWith("/city") },
        ]}
        ghost={{ label: "Check an address", short: "Check", href: "/app?window=check" }}
        solid={{ label: "Open FourFold", short: "App", href: "/app" }}
        extra={<span className={s.tools}><ThemeToggle variant="icon" /><FontSwitcher /></span>}
      />
    </header>
  );
}
