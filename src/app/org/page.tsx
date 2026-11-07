import type { Metadata } from "next";
import OrgProfile from "@/components/OrgProfile";
import SupportPanel from "@/components/SupportPanel";

export const metadata: Metadata = { title: "Your organization · FourFold" };

export default function OrgPage() {
  return (
    <section style={{ maxWidth: 860 }}>
      <div className="eyebrow">Local support</div>
      <h1>Your organization.<span className="second">Local support before an offer.</span></h1>
      <p className="muted" style={{ fontSize: 15, maxWidth: 640 }}>
        A lot can pass every SB 9 test and still stall without local support. FourFold combines public signals about the city with your organization&apos;s own local ties, and only recommends making an offer when support is at least some.
      </p>
      <OrgProfile />
      <SupportPanel city="Santa Ana" />
    </section>
  );
}
