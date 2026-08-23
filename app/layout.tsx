import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/config";

// Want real webfonts? Uncomment, then point --font-display at the variable
// in globals.css. Left off by default so builds don't need network access.
// import { Baloo_2 } from "next/font/google";
// const display = Baloo_2({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: `${SITE_CONFIG.copy.title} — 20 steps to your Certificate of Recovery`,
  description: SITE_CONFIG.copy.tagline,
  openGraph: {
    title: SITE_CONFIG.copy.title,
    description: SITE_CONFIG.copy.tagline,
    type: "website",
  },
  robots: { index: false, follow: false }, // it's a private joke, not a landing page
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Light-only by design — matches --paper in globals.css.
  themeColor: "#fbf7f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
