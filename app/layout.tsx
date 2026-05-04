import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Espen Campbell — GTM systems for B2B SaaS founders",
  description:
    "Outbound, RevOps, and AI personalization built end-to-end with HubSpot, Clay, n8n, and Claude. For Series A through B teams that need infrastructure, not another deck.",
  metadataBase: new URL("https://espencampbell.com"),
  openGraph: {
    title: "Espen Campbell — GTM systems for B2B SaaS founders",
    description:
      "Outbound, RevOps, and AI personalization. Built end-to-end. Series A through B.",
    url: "https://espencampbell.com",
    siteName: "Espen Campbell",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Espen Campbell — GTM systems for B2B SaaS founders",
    description:
      "Outbound, RevOps, and AI personalization. Built end-to-end.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
