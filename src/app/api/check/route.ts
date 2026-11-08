import { NextResponse } from "next/server";
import { checkSite } from "@/lib/sb9";
import { readListing } from "@/lib/listing-reader";
import { geocode, OC_FIPS } from "@/lib/geocode";
import { SRC } from "@/lib/sources";
import { getSite } from "@/lib/results";

export const runtime = "nodejs";
export const maxDuration = 60;

// Live check for one address. Every external call has an 8 second timeout; a failed call
// becomes UNKNOWN with the reason and the other checks still return.
export async function POST(req: Request) {
  let body: { address?: string; city?: string; asking_price?: number | string | null; description?: string; sample?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with an address." }, { status: 400 });
  }
  // A saved sample: the Nov 7 result for one of the 10 listings, including Claude's listing read. No live calls.
  if (body.sample) {
    const saved = getSite(String(body.sample));
    if (!saved) return NextResponse.json({ error: "Unknown sample." }, { status: 404 });
    return NextResponse.json({ ...saved, matched_address: `${saved.address}, ${saved.city}, CA`, sample: true });
  }
  const address = String(body.address ?? "").trim().slice(0, 200);
  if (!address) return NextResponse.json({ error: "Address is required." }, { status: 400 });
  const priceNum = body.asking_price === null || body.asking_price === "" || body.asking_price === undefined ? null : Number(body.asking_price);
  const asking_price = priceNum && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null;
  const description = String(body.description ?? "").slice(0, 8000);
  const typedCity = String(body.city ?? "").trim().slice(0, 60);
  const query = typedCity && !address.toLowerCase().includes(typedCity.toLowerCase()) ? `${address}, ${typedCity}, CA` : address;

  // 1. Geocode with the U.S. Census Bureau Geocoder (8 s timeout). City and county come from it, not the typing.
  const stop = (title: string, reason: string, extra: Record<string, unknown> = {}) =>
    NextResponse.json({ stop: true, title, reason, source_name: SRC.censusGeocoder.name, source_url: SRC.censusGeocoder.url, checked_at: new Date().toISOString(), ...extra });
  let geo;
  try {
    geo = await geocode(query);
  } catch (e) {
    return stop("UNKNOWN: could not reach the address lookup", `${(e as Error).message}. Try again in a minute.`);
  }
  if (!geo) return stop("UNKNOWN: address not found", "Couldn't find that address; check the spelling or include the city and ZIP.");
  if (geo.county_fips !== OC_FIPS) {
    return stop("FourFold covers Orange County for now", `The Census geocoder places this address in ${geo.county_name ?? "an unknown county"}, outside Orange County.`, { matched_address: geo.matched_address, city: geo.city });
  }

  const evidence = await readListing(description);
  const result = await checkSite({ id: "live", address, city: geo.city, asking_price, description, geo }, evidence);
  return NextResponse.json({ ...result, matched_address: geo.matched_address, incorporated: geo.incorporated });
}
