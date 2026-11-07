import { NextResponse } from "next/server";
import { checkSite } from "@/lib/sb9";
import { readListing } from "@/lib/listing-reader";

export const runtime = "nodejs";
export const maxDuration = 60;

// Live check for one address. Every external call has an 8 second timeout; a failed call
// becomes UNKNOWN with the reason and the other checks still return.
export async function POST(req: Request) {
  let body: { address?: string; asking_price?: number | string | null; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with an address." }, { status: 400 });
  }
  const address = String(body.address ?? "").trim().slice(0, 200);
  if (!address) return NextResponse.json({ error: "Address is required." }, { status: 400 });
  const priceNum = body.asking_price === null || body.asking_price === "" || body.asking_price === undefined ? null : Number(body.asking_price);
  const asking_price = priceNum && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null;
  const description = String(body.description ?? "").slice(0, 8000);
  const evidence = await readListing(description);
  const result = await checkSite({ id: "live", address, city: "Santa Ana", asking_price, description }, evidence);
  return NextResponse.json(result);
}
