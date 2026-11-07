import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FourFold",
  description:
    "Finds houses for sale in Santa Ana where a nonprofit could use SB 9 to turn one home into four.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NavBar />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div>Prototype. Not legal or financial advice. Confirm with the city and a professional.</div>
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Data checked 2026-11-07 · <a href="https://github.com/jhwn72/fourfold" target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }}>GitHub</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
