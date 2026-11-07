import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <header className="site-header">
          <Link href="/" className="brand">FourFold</Link>
          <Link href="/city">Whole city</Link>
          <span className="tagline">One home into four, for nonprofits. Santa Ana prototype.</span>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          Prototype. Not legal or financial advice. Confirm with the city and a professional.
        </footer>
      </body>
    </html>
  );
}
