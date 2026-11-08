import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works · FourFold" };

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);
const ASSUMPTION = () => <span className="label">ASSUMPTION</span>;

const SECTIONS = [
  ["#tests", "SB 9 tests"],
  ["#sources", "Sources and assumptions"],
  ["#unknown", "What is UNKNOWN"],
  ["#real-vs-mock", "Real vs mocked"],
  ["#wrong", "Where it can be wrong"],
  ["#claude", "How Claude is used"],
];

const sec: React.CSSProperties = { scrollMarginTop: 72, marginTop: 44 };

export default function MethodPage() {
  return (
    <article style={{ maxWidth: 980 }}>
      <div className="eyebrow">Method · sources · limits</div>
      <h1>How it works<span className="second">Code decides, Claude reads, every test has a source.</span></h1>
      <nav aria-label="Sections" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "18px 0 8px" }}>
        {SECTIONS.map(([href, label]) => <a key={href} href={href} className="chip" style={{ textDecoration: "none" }}>{label}</a>)}
      </nav>

      <section id="tests" style={sec}>
        <div className="eyebrow">01</div>
        <h2 style={{ marginTop: 4 }}>The SB 9 tests</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Test</th><th>Data</th><th>Rule source</th></tr></thead>
            <tbody>
              <tr><td>Address → parcel polygon</td><td>Santa Ana Assessor Parcels</td><td>needed for every test</td></tr>
              <tr><td>Single-family zone (R1, RE)</td><td>Santa Ana Zoning Classifications</td><td>HCD SB 9 Fact Sheet (Sept 2024) p.2; Gov. Code 65852.21(a), 66411.7(a)(3)(A)</td></tr>
              <tr><td>Split into two lots ≥ 1,200 sq ft, neither &lt; 40%</td><td>polygon area in State Plane feet (wkid 2230)</td><td>HCD fact sheet (April 2026) p.1 (1,200 sq ft, &quot;roughly equal&quot;). 40%: Gov. Code 66411.7(a)(1)(B), not stated in the fact sheets and <strong>not verified</strong> against statute text today</td></tr>
              <tr><td>Special flood hazard area</td><td>FEMA NFHL, cross-checked with OC Floodplains</td><td>HCD fact sheet (April 2026) p.3; Gov. Code 65913.4(a)(6)(B)-(K). Statute has exceptions</td></tr>
              <tr><td>Very high fire hazard severity zone</td><td>OC FHSZ LRA (fallback CAL FIRE LRA 2011)</td><td>same</td></tr>
              <tr><td>Historic property or district</td><td>Santa Ana Historic Resources layer (properties + districts)</td><td>HCD fact sheet (April 2026) p.3-4 (AB 1061)</td></tr>
              <tr><td>Landslide zone (site risk only, does not change verdict)</td><td>CGS Landslide Zones</td><td>Not an SB 9 exclusion in the HCD fact sheets</td></tr>
              <tr><td>Tenant in last 3 years</td><td>listing text read by Claude (possible FAIL only)</td><td>HCD fact sheet (April 2026) p.2-3</td></tr>
              <tr><td>Rent restriction, rent control, Ellis Act; prior SB 9 split; earthquake fault; wetlands, habitat, farmland, hazardous waste</td><td><strong>always UNKNOWN</strong> in the MVP, each with a next step</td><td>HCD fact sheet (April 2026) p.2-3</td></tr>
            </tbody>
          </table>
        </div>
        <p id="ranking" style={{ scrollMarginTop: 72 }}><strong>Max homes:</strong> 4 if every counted test passes or is unknown (two lots, up to two units each: HCD fact sheet April 2026 p.2). 2 if only the lot-size test fails (two units without a split). 0 if any other test fails.</p>
        <p><strong>Land cost per home</strong> = asking price ÷ max homes. Labelled &quot;land and building purchase per home, before construction&quot;.</p>
        <p><strong>Ranking:</strong> LIKELY YES first, then lowest land cost per home, then fewest unknowns.</p>
      </section>

      <section id="sources" style={sec}>
        <div className="eyebrow">02</div>
        <h2 style={{ marginTop: 4 }}>Sources and assumptions</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Source or assumption</th><th>Date checked</th></tr></thead>
            <tbody>
              <tr><td>SB 9 rules</td><td><A href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf">HCD Duplexes and Lot Splits fact sheet, April 2026</A>; <A href="https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf">HCD SB 9 Fact Sheet, Sept 2024</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Parcels</td><td><A href="https://gis.santa-ana.org/server/rest/services/Public/GIS_AssessorParcels/MapServer/0">Santa Ana Assessor Parcels</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Zoning</td><td><A href="https://gis.santa-ana.org/server/rest/services/Public/PBA_ZoningClassifications/FeatureServer/0">Santa Ana Zoning Classifications</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Historic</td><td><A href="https://gis.santa-ana.org/server/rest/services/Public/PBA_HistoricResource/FeatureServer">Santa Ana Historic Resources</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Flood</td><td><A href="https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28">FEMA NFHL layer 28</A>; <A href="https://www.ocgis.com/arcpub/rest/services/Map_Layers/Floodplains/MapServer/0">OC Floodplains</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Fire</td><td><A href="https://www.ocgis.com/arcpub/rest/services/Map_Layers/Fire_Hazard_Severity_Zones_LRA/MapServer/0">OC FHSZ LRA</A>; <A href="https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/1">CAL FIRE LRA 2011</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Building footprints</td><td><A href="https://www.ocgis.com/arcpub/rest/services/Map_Layers/Building_Footprints/MapServer/0">OC Building Footprints</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Transit (parking)</td><td><A href="https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHrailroad/CA_HQ_Transit_Areas/FeatureServer/0">Caltrans High Quality Transit Areas</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Landslide</td><td><A href="https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0">CGS Landslide Zones</A></td><td className="mono">2026-11-07</td></tr>
              <tr><td>Recent SB 9 projects</td><td><A href="https://data.ca.gov/@california-department-of-housing-and-community-development/housing-element-annual-progress-report-apr-data-by-jurisdiction-and-year">HCD Housing Element APR data</A>, matched on &quot;SB 9 / SB9 / lot split&quot; in project notes; only projects a city chose to label</td><td className="mono">2026-11-07</td></tr>
              <tr><td>Cost examples in the fund calculator</td><td><ASSUMPTION />: the brief&apos;s worked example per home ($85k time costs, $50k fees, $285k family price, $100k subsidies, $55k rent), offered as optional examples only</td><td className="mono">2026-11-06</td></tr>
              <tr><td>Listings</td><td>10 public Zillow / Redfin listings collected by hand by Jerry; link on each site page; no agent or seller names stored</td><td className="mono">2026-11-07</td></tr>
              <tr><td>$360k land and building purchase per home</td><td><ASSUMPTION />: the brief&apos;s worked example (<code>docs/background.md</code>), mock numbers, not a real deal</td><td className="mono">2026-11-06</td></tr>
              <tr><td>RE zone counts as single-family</td><td><ASSUMPTION />: zone description &quot;Residential-Estate&quot;; confirm in the Santa Ana zoning code</td><td className="mono">2026-11-07</td></tr>
              <tr><td>Santa Ana is in an urbanized area (SB 9 applies to urbanized areas, fact sheet April 2026 p.1)</td><td><ASSUMPTION />, not checked against Census data</td><td className="mono">2026-11-07</td></tr>
              <tr><td>Split line</td><td><ASSUMPTION />: a straight equal-area cut across the lot&apos;s long side. A sketch, not a surveyed parcel map</td><td className="mono">n/a</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="unknown" style={sec}>
        <div className="eyebrow">03</div>
        <h2 style={{ marginTop: 4 }}>What is UNKNOWN and why</h2>
        <ul>
          <li><strong>Tenant history (3 years):</strong> no public data. Claude reads the listing for clues, but a listing can&apos;t prove there was no tenant. Ask the listing agent.</li>
          <li><strong>Rent restriction, rent control, Ellis Act withdrawal:</strong> not in free parcel data. Ask the agent and the city housing division.</li>
          <li><strong>Prior SB 9 split, or an adjacent split by the same owner:</strong> needs the parcel&apos;s map history. Ask the planning desk.</li>
          <li><strong>Earthquake fault zone:</strong> the CGS seismic hazard service needed a token when tested. Check CGS EQ Zapp.</li>
          <li><strong>Wetlands, habitat, farmland, conservation easement, hazardous waste:</strong> not checked. Check DTSC EnviroStor and the planning desk.</li>
          <li><strong>Historic:</strong> we check Santa Ana&apos;s own list and districts. The State Historic Resources Inventory is not checked, so a clean city result still says UNKNOWN.</li>
          <li><strong>A1 &quot;General Agricultural&quot; zone:</strong> HCD says agricultural zones are not SB 9 zones, but Santa Ana&apos;s A1 can hold ordinary houses. Shown as possible FAIL; ask the city.</li>
        </ul>
      </section>

      <section id="real-vs-mock" style={sec}>
        <div className="eyebrow">04</div>
        <h2 style={{ marginTop: 4 }}>Real vs. mocked</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Part</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Parcel lookup, lot area, zoning, flood, fire, historic, landslide checks</td><td>working, live government data</td></tr>
              <tr><td>Split sketch and SVG</td><td>working; a sketch, not a survey</td></tr>
              <tr><td>Claude listing reader</td><td>working; all 10 listings read on 2026-11-07 (1213 S Corta flagged: &quot;DO NOT DISTURB TENANTS.&quot;). Paused in the live check since 2026-11-08, after the hackathon; the sample listings in the live check show the saved reads</td></tr>
              <tr><td>Keep-the-house and no-parking flags</td><td>working; footprints may include attached garages, and transit areas are straight-line</td></tr>
              <tr><td>Whole-city screen</td><td>working; a first screen using parcel centroids, not a verdict. Parcels that share one outline (condo or mobile-home units) are excluded</td></tr>
              <tr><td>Listings</td><td>real public listings, collected by hand on 2026-11-07; prices can change</td></tr>
              <tr><td>Ranking and land cost per home</td><td>working; uses asking price, not sale price</td></tr>
              <tr><td>Other cities</td><td>not built; Santa Ana only</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="wrong" style={sec}>
        <div className="eyebrow">05</div>
        <h2 style={{ marginTop: 4 }}>Where it can be wrong</h2>
        <ul>
          <li>Lot area comes from the city polygon. It can differ from the listing (sa-01: listing 10,001 sq ft, city polygon about 8,682).</li>
          <li>&quot;Intersects&quot; means any part of the parcel. A parcel that barely touches a flood zone gets FAIL; we pull the outline in 1 ft to avoid edge-touch errors, but a sliver can still count.</li>
          <li>Fire map vintage may predate CAL FIRE&apos;s 2025 LRA maps.</li>
          <li>Address matching is by text. Some city addresses differ from listings (Valencia St vs Ave, Fay Cir with no &quot;W&quot;). We use a looser match and show the APN so a person can confirm it.</li>
          <li>Six of the ten listing descriptions are the collector&apos;s summaries, not verbatim listing text. Quotes from those are labelled as coming from the summary.</li>
          <li>A FAIL does not cover statutory exceptions (for example a flood-zone site that meets FEMA requirements).</li>
          <li>The whole-city screen tests each parcel&apos;s center point, not its full outline, and cannot check tenants, rent control, prior splits, fault zones or environmental sites. 105 candidates have no address and 42 are over an acre (possibly parks or schools). Treat it as a list of lots worth a closer look, not a list of eligible lots.</li>
          <li>The county fire layer has no fire hazard zones inside Santa Ana, so fire never fails here. Other cities will differ.</li>
        </ul>
      </section>

      <section id="claude" style={sec}>
        <div className="eyebrow">06</div>
        <h2 style={{ marginTop: 4 }}>How Claude is used</h2>
        <ul>
          <li><strong>Built with Claude Code:</strong> the whole app, the data probe, and the rule encoding from the HCD fact sheets. A Claude subagent checked every listing Jerry collected against the city parcel layer (see <code>data/listings-check.md</code>).</li>
          <li><strong>Inside the tool: code decides, Claude reads.</strong> Eligibility is decided only by code using government data. Claude (<code>claude-sonnet-5-5</code>, structured JSON output) reads only the free-text listing description and returns tenant-occupied / vacant / owner-occupied flags with a quoted phrase. Code then checks each quote really appears in the text and drops any that do not. A Claude flag can turn the tenant test into &quot;possible FAIL, confirm with agent&quot;. It can never make a test PASS.</li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 40 }}>
        Full README and code: <A href="https://github.com/jhwn72/fourfold">github.com/jhwn72/fourfold</A> · <Link href="/app">Back to the ranked list</Link>
      </p>
    </article>
  );
}
