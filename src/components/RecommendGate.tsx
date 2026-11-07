"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { assessSupport, getCitySignals, isRecommended } from "@/lib/support";
import { useOrgProfile } from "./OrgProfile";
import s from "./RecommendGate.module.css";

/**
 * Shows the "Recommended" badge/CTA (children) only when the site is LIKELY YES and local support is
 * at least SOME. Otherwise: "Build local support first" with the top step.
 */
export default function RecommendGate({ verdict, city, children }: { verdict: string; city: string; children?: ReactNode }) {
  const { profile, loaded } = useOrgProfile();
  if (verdict !== "LIKELY YES") return null; // not eligible on public data: nothing to recommend
  const result = assessSupport(getCitySignals(city), profile, city);

  if (loaded && isRecommended(verdict, result.level)) {
    return (
      <div className={s.gate}>
        <span className="status PASS">Recommended: make an offer</span>
        {children}
      </div>
    );
  }

  return (
    <div className={s.gate}>
      <span className="status POSSIBLE">Build local support first</span>
      <span className={`muted ${s.why}`}>
        Eligible on public data. {profile ? result.steps[0] : "Tell FourFold about your organization first."}{" "}
        <Link href="/org">{profile ? "Local support" : "Add your organization"}</Link>
      </span>
    </div>
  );
}
