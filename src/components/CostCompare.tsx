import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import { money } from "./Checklist";
import { Star, AssumeNote } from "@/components/Assume";

export default function CostCompare({ price, homes, perHome }: { price: number | null; homes: number | null; perHome: number | null }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Purchase cost per home</h3>
      {perHome != null ? (
        <p style={{ fontSize: 18 }}>
          {money(price)} ÷ {homes} homes = <strong>{money(perHome)}</strong> per home
        </p>
      ) : (
        <p>{homes === 0 ? "n/a: SB 9 does not appear to apply, so there is no 4-home split to divide by." : price == null ? "UNKNOWN: no asking price." : "UNKNOWN."}</p>
      )}
      <p className="muted">
        Compare: the brief&apos;s worked example uses {money(BRIEF_LAND_PER_HOME)} per home for land and building purchase<Star /> (mock numbers from docs/background.md, not a real deal).
        {perHome != null && (perHome <= BRIEF_LAND_PER_HOME
          ? ` This site is ${money(BRIEF_LAND_PER_HOME - perHome)} below it.`
          : ` This site is ${money(perHome - BRIEF_LAND_PER_HOME)} above it.`)}
        {" "}Asking price is not the sale price. Construction, fees and time costs are not included.
      </p>
    </div>
  );
}
