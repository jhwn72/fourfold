import Link from "next/link";
import LiveCheck from "@/components/LiveCheck";
import SiteTable from "@/components/SiteTable";
import CityHero from "@/components/viz/CityHero";
import { RESULTS } from "@/lib/results";
// Server component: these imports are read at build time and are not shipped to the browser.
import cityMeta from "../../public/city-points.json";
import comparables from "../../data/comparables.json";
import h from "./Home.module.css";

const HCD_FACT_SHEET = "https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf";
const fmt = (n: number) => n.toLocaleString("en-US");

export default function Home() {
  const rows = RESULTS.results;
  const likelyYes = rows.filter((r) => r.verdict === "LIKELY YES").length;
  const counts = cityMeta.counts;
  const ocProjects = comparables.projects.length;

  const stats: { k: string; v: string; href?: string; accent?: boolean }[] = [
    { k: "Listings checked", v: fmt(rows.length), href: "#list" },
    { k: "Likely yes", v: fmt(likelyYes), href: "#list", accent: true },
    { k: "Parcels screened", v: fmt(counts.total), href: "/city" },
    { k: "Candidate lots", v: fmt(counts.candidates), href: "/city", accent: true },
    { k: "OC SB 9 projects", v: fmt(ocProjects), href: "/comparables" },
  ];

  return (
    <section>
      <div className={h.hero}>
        <div className={h.copy}>
          <div className="eyebrow">Santa Ana / SB 9 / {rows.length} listings, 2026-11-07</div>
          <h1>One house for sale.<span className="second">Four homes for a nonprofit.</span></h1>
          <p className={h.lede}>
            Investors can&apos;t split a lot under SB 9 unless they live there for 3 years. Nonprofits and community land trusts
            are exempt (<a href={HCD_FACT_SHEET} target="_blank" rel="noreferrer">HCD SB 9 fact sheet, April 2026, p.2</a>).
            FourFold finds the houses for sale where a nonprofit can turn one home into four.
          </p>
          <div className={h.ctas}>
            <a href="#list" className={`btn-primary ${h.primary}`}>See the ranked list ↓</a>
            <Link href="/check" className={h.secondary}>Check an address ↗</Link>
          </div>
        </div>
        <CityHero height={320} />
      </div>

      <div className={`stats ${h.stats}`}>
        {stats.map((s) => (
          <div key={s.k}>
            <a href={s.href} className={h.statLink}>
              <div className="k">{s.k}</div>
              <div className={`v${s.accent ? " accent" : ""}`}>{s.v}</div>
            </a>
          </div>
        ))}
      </div>

      <div id="list" className={h.listHead} style={{ scrollMarginTop: 72 }}>
        <h2>Santa Ana: homes for sale, ranked</h2>
      </div>
      <p className={h.caption}>
        {rows.length} listings collected by hand on 2026-11-07 · Ranked: LIKELY YES first, then lowest land cost per home, then fewest unknowns ·
        Eligibility decided by code from city, county, FEMA and CAL FIRE data; Claude only reads the listing text for tenant or vacancy clues
        {RESULTS.generated_at ? ` · Checks run ${RESULTS.generated_at.slice(0, 16).replace("T", " ")} UTC` : ""}
      </p>
      <SiteTable results={rows} />

      <p className="muted" style={{ marginTop: 16 }}>
        Per home = asking price ÷ max homes: land and building purchase per home, before construction. $360k is the brief&apos;s worked example{" "}
        <span className="label">ASSUMPTION</span>. <Link href="/method">How it works</Link>
      </p>

      <div className={h.links}>
        <Link href="/city">Every lot in Santa Ana →</Link>
        <Link href="/comparables">Recent SB 9 projects in Orange County →</Link>
        <a href="#live">Check any address →</a>
      </div>

      <LiveCheck />
    </section>
  );
}
