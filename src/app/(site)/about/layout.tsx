import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PTL | AI Legal Assistant for Lawyers in Pakistan",
  description:
    "Learn about PTL - Pakistan's AI-powered legal drafting and research platform built for lawyers and law firms.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
