// Options for the font switcher. `value` is the CSS variable each font sets on <html>.
export const TEXT_FONTS = [
  { label: "Geist", value: "--font-geist-sans" },
  { label: "Inter", value: "--font-inter" },
  { label: "IBM Plex Sans", value: "--font-plex-sans" },
  { label: "Space Grotesk", value: "--font-space-grotesk" },
  { label: "DM Sans", value: "--font-dm-sans" },
  { label: "Manrope", value: "--font-manrope" },
  { label: "Geist Mono", value: "--font-geist-mono" },
  { label: "JetBrains Mono", value: "--font-jetbrains" },
  { label: "IBM Plex Mono", value: "--font-plex-mono" },
  { label: "Space Mono", value: "--font-space-mono" },
  { label: "DM Mono", value: "--font-dm-mono" },
] as const;

export const LABEL_FONTS = [
  { label: "Geist Mono", value: "--font-geist-mono" },
  { label: "JetBrains Mono", value: "--font-jetbrains" },
  { label: "IBM Plex Mono", value: "--font-plex-mono" },
  { label: "Space Mono", value: "--font-space-mono" },
  { label: "DM Mono", value: "--font-dm-mono" },
] as const;

export const FONT_KEY = "fourfold-fonts";
