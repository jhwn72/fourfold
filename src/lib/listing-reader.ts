// Claude reads the free-text listing description and returns flags with quoted evidence.
// Claude never decides eligibility. Code then checks that every quote really appears in the text;
// a flag whose quote is not found is dropped. A flag can only turn the tenant test into
// "possible FAIL, confirm with agent" (see checks/manual.ts), never into PASS.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import type { ListingEvidence, ListingFlag } from "./types";

export const LISTING_MODEL = "claude-sonnet-5-5";

const FlagSchema = z.object({
  present: z.boolean(),
  quote: z.string().nullable(),
});
const ReadSchema = z.object({
  tenant_occupied: FlagSchema,
  vacant: FlagSchema,
  owner_occupied: FlagSchema,
});

const SYSTEM = `You read real-estate listing descriptions for a housing nonprofit.
For each flag, decide whether the text itself says so, and copy the exact phrase from the text that shows it.
- tenant_occupied: the text says a tenant or renter lives there now or recently (for example "tenant occupied", "do not disturb tenants", "currently rented", "income property with tenants").
- vacant: the text says the home is vacant or empty.
- owner_occupied: the text says the owner lives there.
Rules: "quote" must be copied character for character from the text, short (under 20 words). If the text does not clearly say it, set present=false and quote=null. Do not infer from words like "investor", "fixer" or "ADU potential". Do not judge eligibility for any law.`;

const CACHE_DIR = path.join(process.cwd(), ".cache", "listing-reader");

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function readListing(description: string): Promise<ListingEvidence> {
  const text = (description ?? "").trim();
  if (!text) return { status: "skipped", note: "No listing description to read.", flags: [] };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: "skipped", note: "Listing reader off: no ANTHROPIC_API_KEY set.", flags: [] };
  }

  const key = createHash("sha1").update(LISTING_MODEL + SYSTEM + text).digest("hex");
  const useCache = process.env.FOURFOLD_CACHE === "1";
  if (useCache) {
    try {
      return JSON.parse(await fs.readFile(path.join(CACHE_DIR, key + ".json"), "utf8"));
    } catch {}
  }

  try {
    const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
    const response = await client.messages.parse({
      model: LISTING_MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: `Listing text:\n<listing>\n${text}\n</listing>` }],
      output_config: { effort: "low", format: zodOutputFormat(ReadSchema) },
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { status: "error", note: `Claude did not return flags (stop reason: ${response.stop_reason}).`, flags: [], model: LISTING_MODEL };
    }
    const out = response.parsed_output;
    const dropped: string[] = [];
    const flags: ListingFlag[] = (["tenant_occupied", "vacant", "owner_occupied"] as const).map((name) => {
      const f = out[name];
      // Code checks the quote. A quote not found in the text does not count.
      if (f.present && (!f.quote || !norm(text).includes(norm(f.quote)))) {
        dropped.push(name);
        return { flag: name, present: false, quote: null };
      }
      return { flag: name, present: f.present, quote: f.present ? f.quote : null };
    });
    const result: ListingEvidence = {
      status: "ok",
      note: dropped.length ? `Dropped ${dropped.join(", ")}: the quote was not found in the text.` : "Flags read by Claude; every quote was checked against the text.",
      flags,
      model: LISTING_MODEL,
    };
    if (useCache) {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(path.join(CACHE_DIR, key + ".json"), JSON.stringify(result));
    }
    return result;
  } catch (e) {
    const msg = e instanceof Anthropic.APIError ? `API error ${e.status}` : (e as Error).message;
    return { status: "error", note: `Listing reader failed: ${msg}. Tenant test stays UNKNOWN.`, flags: [], model: LISTING_MODEL };
  }
}
