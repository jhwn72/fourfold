// Which data source each city uses, and which zoning codes count as single-family.
// Zoning lists were read from each layer's distinct values on 2026-11-07.
// Rule: HCD SB 9 Fact Sheet (Sept 2024) p.2, single-family residential zones only.
import { SRC } from "./sources";

export type City = "Santa Ana" | "Anaheim" | "Fullerton";
export const CITIES: City[] = ["Santa Ana", "Anaheim", "Fullerton"];

/** "fullerton", "Fullerton, CA" -> "Fullerton". Unknown cities fall back to Santa Ana (the original pipeline). */
export function cityOf(raw: string | undefined | null): City {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("anaheim")) return "Anaheim";
  if (s.includes("fullerton")) return "Fullerton";
  return "Santa Ana";
}

/**
 * Anaheim (layer field ZONING, description ZONINGDES). Counted as single-family because the layer's own
 * description says "Single-Family Residential":
 *   RS-1 (10,000 s.f. min.), RS-2 (7,200), RS-3 (5,000), RS-4 "Small Lot Single-Family Residential",
 *   RH-1, RH-2, RH-3 "Hillside Single-Family Residential".
 * ASSUMPTION: RS-4 (small lot) and RH-* (hillside) are single-family zones for SB 9 because their published
 * description says so; confirm with the Anaheim planning desk. Specific plans (SP 87-1 etc.) are not counted
 * (the plan decides). "SP" alone is "Semi-Public", not a specific plan.
 */
export const ANAHEIM_SF = new Set(["RS-1", "RS-2", "RS-3", "RS-4", "RH-1", "RH-2", "RH-3"]);

/**
 * Fullerton (layer fields ZONE_ABR1 class, ZONE_ABR2 detail, ZONE_DSC description). Counted as single-family
 * because the description says "One-Family Residential": ZONE_ABR1 R1 (R-1-6 through R-1-40) and
 * R1P (R-1-7.2P "One-Family Residential, Preservation").
 * ASSUMPTION: R-1-7.2P is a single-family zone; "Preservation" may mean a local historic or preservation
 * district, which SB 9 can exclude, so R1P lots are flagged as a possible historic fail.
 * Not counted: PRD (planned residential development; some are "Single Family Greenbelt", the plan decides),
 * SPD specific plans, R-2, R-3 and other multifamily or nonresidential zones.
 */
export const FULLERTON_SF = new Set(["R1", "R1P"]);
export const FULLERTON_PRESERVATION = new Set(["R1P"]);

export function citySources(city: City) {
  if (city === "Anaheim") return { parcels: SRC.anParcels, zoning: SRC.anZoning };
  if (city === "Fullerton") return { parcels: SRC.fuParcels, zoning: SRC.fuZoning };
  return { parcels: SRC.saParcels, zoning: SRC.saZoning };
}

/** Anaheim APNs come as 8 digits ("13436110"); show them as "134-361-10". */
export function dashApn(apn: string): string {
  const d = apn.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : apn;
}
