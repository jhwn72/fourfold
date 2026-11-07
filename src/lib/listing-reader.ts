// Placeholder until step 5: the Claude listing reader.
import type { ListingEvidence } from "./types";
export async function readListing(description: string): Promise<ListingEvidence> {
  return { status: "skipped", note: description ? "Listing reader not wired up yet." : "No listing description to read.", flags: [] };
}
