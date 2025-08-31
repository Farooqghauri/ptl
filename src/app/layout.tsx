// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Pakistan's Top Lawyers | PTL",
  description:
    "Find verified lawyers across Pakistan for family, criminal, property, and corporate law cases.",
  keywords:
    "Pakistan lawyers, divorce lawyer, property lawyer, criminal lawyer, top lawyers Pakistan, best lawyers Karachi, best lawyers Lahore",
  authors: [{ name: "Pakistan Top Lawyers" }],
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider   publishableKey="pk_test_bG92aW5nLXBhbnRoZXItMTYuY2xlcmsuYWNjb3VudHMuZGV2JA">
      <html lang="en">
        <body className="bg-white text-gray-900 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
