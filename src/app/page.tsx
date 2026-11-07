import Link from "next/link";
import LiveCheck from "@/components/LiveCheck";
import SiteTable from "@/components/SiteTable";
import CityHero from "@/components/viz/CityHero";
import { RESULTS } from "@/lib/results";

export default function Home() {
  const rows = RESULTS.results;
  return (
    <section>
      <CityHero />
      <h1>FourFold</h1>
      <p>
        Investors can&apos;t split a lot under SB 9 unless they live there for 3 years. Nonprofits and community land trusts
        are exempt (<a href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf" target="_blank" rel="noreferrer">HCD SB 9 fact sheet, April 2026, p.2</a>).
        FourFold finds the houses for sale where a nonprofit can turn one home into four.
      </p>
      <h2>Santa Ana: homes for sale, ranked</h2>
      <p className="muted">
        {rows.length} listings collected by hand on 2026-11-07. Ranked: LIKELY YES first, then lowest land cost per home, then fewest unknowns.
        Eligibility is decided by code from city, county, FEMA and CAL FIRE data. Claude only reads the listing text for tenant or vacancy clues.
        {RESULTS.generated_at ? ` Checks run ${RESULTS.generated_at.slice(0, 16).replace("T", " ")} UTC.` : ""}
      </p>
      <SiteTable results={rows} />
      <p><Link href="/brief">Printable call list (PDF)</Link> · <a href="/results.csv" download>Download CSV</a> · <a href="/city.csv" download>Citywide lots CSV</a> · <Link href="/comparables">Recent SB 9 projects in Orange County</Link></p>
      <p className="muted">Per home = asking price ÷ max homes: land and building purchase per home, before construction. $360k is the brief&apos;s worked example <span className="label">ASSUMPTION</span>.</p>
      <p><Link href="/city">See every lot in Santa Ana where SB 9 likely works, listed or not</Link>.</p>
      <LiveCheck />
    </section>
  );
}
