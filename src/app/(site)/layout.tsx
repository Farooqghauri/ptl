import "../globals.css";
import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Providers } from "../providers";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "PTL | AI Legal Drafting Assistant for Lawyers in Pakistan",
  description:
    "PTL is Pakistan's first AI-powered legal assistant. Smart AI tools for law firms and lawyers to draft contracts, analyze cases, and automate legal workflows.",
  keywords: [
    "AI for Pakistani Lawyers",
    "AI Legal Drafting Assistant for Lawyers in Pakistan",
    "Smart AI Tools for Law Firms in Pakistan",
    "Pakistan Legal AI",
    "AI for Law Firms",
    "AI Legal Research Pakistan",
    "LawTech Pakistan",
    "AI Legal Document Automation",
    "PTL Legal Assistant",
  ],
  openGraph: {
    title: "PTL — AI Legal Assistant for Pakistani Lawyers",
    description:
      "Empower your law practice with AI-powered drafting, legal research, and document review — built for Pakistan's legal professionals.",
    url: "https://pakistantoplawyers.com",
    siteName: "PTL - Pakistan Top Lawyers",
    images: [
      {
        url: "https://pakistantoplawyers.com/loggo.png",
        width: 1200,
        height: 630,
        alt: "PTL - AI Legal Assistant Pakistan",
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PTL — AI Legal Drafting Assistant Pakistan",
    description:
      "Smart AI Tools for Pakistani Lawyers and Law Firms. Automate your legal drafting and research with PTL.",
    images: ["https://pakistantoplawyers.com/loggo.png"],
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ThemeProvider>
        <Navbar />
        {children}
        <Footer />
      </ThemeProvider>
    </Providers>
  );
}