import type { Metadata } from "next";
import ArchiveBanner from "@/components/ArchiveBanner";
import NavBar from "@/components/NavBar";
import { LIVE_AI_PAUSED } from "@/lib/paused";
import SiteFooter from "@/components/SiteFooter";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";


export const metadata: Metadata = {
  title: "FourFold",
  description:
    "Finds houses for sale in Santa Ana where a nonprofit could use SB 9 to turn one home into four.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} data-archive={LIVE_AI_PAUSED ? "" : undefined} suppressHydrationWarning>
      <head>
        {/* Set the saved theme and fonts before paint so there is no flash. Default theme is light. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var d=document.documentElement;var t=localStorage.getItem("fourfold-theme");d.dataset.theme=t==="dark"?"dark":"light";var f=JSON.parse(localStorage.getItem("fourfold-fonts")||"null");if(f){d.style.setProperty("--font-choice-sans","var("+f.text+")");d.style.setProperty("--font-choice-mono","var("+f.label+")");}}catch(e){}` }} />
      </head>
      <body>
        <ArchiveBanner />
        <NavBar />
        <main className="container">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
