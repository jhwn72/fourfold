import Link from "next/link";
import { LIVE_AI_PAUSED } from "@/lib/paused";

// A slim notice across the top of every page while the live AI is paused.
// Its height is --banner-h (set on <html> in layout.tsx); the fixed navs and full-screen views move down by it.
export default function ArchiveBanner() {
  if (!LIVE_AI_PAUSED) return null;
  return (
    <div role="status" className="archive-banner">
      <span className="archive-banner-long">
        FourFold won 3rd place at Claude Impact Lab (UCI), Nov 7, 2026. Live AI is paused; sample checks show saved results.
      </span>
      <span className="archive-banner-short">3rd place, Claude Impact Lab. AI paused.</span>
      <Link href="/method#real-vs-mock">How it works</Link>
    </div>
  );
}
