// Fonts offered in the font switcher. All are free Google Fonts, loaded with next/font.
import { DM_Mono, DM_Sans, Geist, Geist_Mono, IBM_Plex_Mono, IBM_Plex_Sans, Inter, JetBrains_Mono, Manrope, Space_Grotesk, Space_Mono } from "next/font/google";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["300", "400", "500"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["300", "400", "500"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["300", "400", "500"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const fontVariables = [geist, geistMono, inter, plexSans, plexMono, jetbrains, spaceGrotesk, spaceMono, dmSans, dmMono, manrope]
  .map((f) => f.variable)
  .join(" ");
