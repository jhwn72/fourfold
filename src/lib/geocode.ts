// Typed address -> matched address, lon/lat, county and city, from the U.S. Census Bureau Geocoder
// (free, documented: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html). 8 s timeout.
import { TIMEOUT_MS } from "./arcgis";
import { SRC } from "./sources";

export const OC_FIPS = "06059";

export type Geo = {
  matched_address: string; // "2121 VALENCIA AVE, SANTA ANA, CA, 92706"
  street: string; // "2121 VALENCIA AVE"
  lon: number;
  lat: number;
  county_fips: string | null;
  county_name: string | null;
  city: string; // "Santa Ana", "Irvine"; unincorporated areas use the postal city
  incorporated: boolean;
};

const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Returns null when the geocoder finds no match. Throws on timeout or HTTP error. */
export async function geocode(address: string): Promise<Geo | null> {
  const q = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Counties,Incorporated Places",
    format: "json",
  });
  let res: Response;
  try {
    res = await fetch(`${SRC.censusGeocoder.url}?${q}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    const err = e as Error;
    throw new Error(err.name === "TimeoutError" || err.name === "AbortError" ? `Census geocoder timed out after ${TIMEOUT_MS / 1000}s` : `Census geocoder: ${err.message}`);
  }
  if (!res.ok) throw new Error(`Census geocoder HTTP ${res.status}`);
  const json = await res.json();
  const m = json?.result?.addressMatches?.[0];
  if (!m) return null;
  const county = m.geographies?.Counties?.[0];
  const place = m.geographies?.["Incorporated Places"]?.[0];
  const matched = String(m.matchedAddress ?? address);
  const placeName = place?.BASENAME ? String(place.BASENAME) : null;
  return {
    matched_address: matched,
    street: matched.split(",")[0].trim(),
    lon: Number(m.coordinates?.x),
    lat: Number(m.coordinates?.y),
    county_fips: county?.GEOID ? String(county.GEOID) : null,
    county_name: county?.NAME ? String(county.NAME) : null,
    city: placeName ?? title(String(m.addressComponents?.city ?? "")),
    incorporated: Boolean(placeName),
  };
}
