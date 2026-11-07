import type { Metadata } from "next";
import FontSwitcher from "@/components/FontSwitcher";
import NavBar from "@/components/NavBar";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";


export const metadata: Metadata = {
  title: "FourFold",
  description:
    "Finds houses for sale in Santa Ana where a nonprofit could use SB 9 to turn one home into four.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Set the saved theme and fonts before paint so there is no flash. Default theme is light. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var d=document.documentElement;var t=localStorage.getItem("fourfold-theme");d.dataset.theme=t==="dark"?"dark":"light";var f=JSON.parse(localStorage.getItem("fourfold-fonts")||"null");if(f){d.style.setProperty("--font-choice-sans","var("+f.text+")");d.style.setProperty("--font-choice-mono","var("+f.label+")");}}catch(e){}` }} />
      </head>
      <body>
        <NavBar />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div>Prototype. Not legal or financial advice. Confirm with the city and a professional.</div>
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Data checked 2026-11-07 · <a href="https://github.com/jhwn72/fourfold" target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }}>GitHub</a>
          </div>
        </footer>
        <FontSwitcher />
      </body>
    </html>
  );
}
