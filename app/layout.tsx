import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import { PALETTE } from "@/lib/palette";
import "./globals.css";

/**
 * One family, Latin subset. Public Sans covers English, Tagalog and Bahasa Indonesia,
 * has a large x-height and unambiguous digits, and is open licensed. Traditional
 * Chinese and the South Asian scripts each need their own file and their own bundle
 * check, which is why they are a later locale rather than a later font switch.
 */
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Month End",
  description:
    "A short game about money traps in Hong Kong, and how to spot them before they cost you.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: PALETTE.ground,
  width: "device-width",
  initialScale: 1,
  // Never block zoom. Some people need to magnify a number before they trust it.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
