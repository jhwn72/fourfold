import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FourFold",
  description:
    "Finds houses for sale in Santa Ana where a nonprofit could use SB 9 to turn one home into four.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
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
