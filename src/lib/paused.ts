// FourFold's live AI (the Claude listing reader) is paused now that the hackathon is over.
// While this is true: a notice shows across the top of every page, the live check never calls Claude,
// and the live check offers saved sample listings that show Claude's reads from the Nov 7 run.
// Set to false (and add ANTHROPIC_API_KEY in Vercel) to turn the reader back on, then redeploy.
export const LIVE_AI_PAUSED = true;

// Saved listings the live check can replay. Ids are from data/results.json.
export const SAMPLES = [
  { id: "sa-06", label: "1213 S Corta Dr", hint: "Claude flags a tenant" },
  { id: "sa-04", label: "1209 S Townsend St", hint: "Likely yes, 4 homes" },
  { id: "sa-01", label: "4202 W Fay Cir", hint: "No" },
] as const;
