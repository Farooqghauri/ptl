import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "PTL | AI Legal Drafting & Research Platform for Pakistani Lawyers",
  description:
    "PTL is Pakistan's first AI-powered legal platform. Draft bail applications, legal notices, writ petitions. Search Pakistan Penal Code, CrPC, CPC, Constitution. Built for advocates and law firms.",
  keywords: [
    "Pakistan Penal Code",
    "PPC sections",
    "CrPC Pakistan",
    "bail application format Pakistan",
    "legal notice format",
    "writ petition format Pakistan",
    "AI legal drafting Pakistan",
    "Pakistani law",
    "legal research Pakistan",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PTL",
  },
  openGraph: {
    title: "PTL — AI Legal Platform for Pakistani Lawyers",
    description:
      "Draft petitions, search case law, translate documents — built for Pakistan's legal system.",
    url: "https://pakistantoplawyers.com",
    siteName: "PTL - Pakistan Top Lawyers",
    images: [
      {
        url: "https://pakistantoplawyers.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PTL - AI Legal Platform Pakistan",
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PTL — AI Legal Platform Pakistan",
    description:
      "Draft petitions, search Pakistan Penal Code — built for Pakistani lawyers.",
    images: ["https://pakistantoplawyers.com/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="PTL" />
        </head>
        <body className="antialiased bg-gray-950 text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}