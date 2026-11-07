import type { Metadata } from "next";
import LiveCheck from "@/components/LiveCheck";

export const metadata: Metadata = { title: "Check an address · FourFold" };

export default function CheckPage() {
  return (
    <section style={{ maxWidth: 860 }}>
      <div className="eyebrow">Live check · Santa Ana</div>
      <h1>Check an address.<span className="second">Every SB 9 test, live, with sources.</span></h1>
      <p className="muted" style={{ fontSize: 15, maxWidth: 640 }}>
        Type any Santa Ana address. FourFold runs each test against city, county, FEMA and fire servers. A server that does not answer becomes UNKNOWN with the reason.
      </p>
      <LiveCheck heading={false} />
    </section>
  );
}
