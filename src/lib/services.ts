// src/lib/services.ts
export type Service = {
  name: string;
  slug: string;
  short: string;
  long: string;
  banner?: string;
  lottie?: string;
  keywords: string[];
};

export const SERVICES: Service[] = [
  {
    name: "AI Legal Drafting Assistant",
    slug: "ai-legal-drafting",
    short:
      "Generate professional, Pakistan-compliant legal drafts in seconds using PTL’s AI-powered drafting engine.",
    long: `PTL’s AI Legal Drafting Assistant helps lawyers in Pakistan create accurate and court-ready legal drafts instantly. 
It understands the language, structure, and format of Pakistani courts — saving hours of manual work. 
Generate agreements, affidavits, petitions, contracts, and more while ensuring your documents comply with local laws and formatting standards.`,
    banner: "/images/ai-legal-drafting-banner.png",
    lottie: "/lottie/ai-legal-drafting.json",
    keywords: [
      "AI legal drafting Pakistan",
      "automated contract creation Pakistan",
      "AI legal writer PTL",
      "legal document generator Pakistan",
    ],
  },
  {
    name: "AI Legal Research & RAG Assistant",
    slug: "ai-research-rag",
    short:
      "Perform smart, citation-backed legal research trained on Pakistani case laws and judgments.",
    long: `The AI Research & RAG Assistant allows Pakistani lawyers to search, summarize, and cross-reference judgments using local databases. 
It uses retrieval-augmented generation (RAG) to provide relevant citations, case summaries, and precedent analysis — making legal research faster, more reliable, and context-aware.`,
    banner: "/images/ai-research-rag-banner.png",
    lottie: "/lottie/ai-research-rag.json",
    keywords: [
      "AI legal research Pakistan",
      "case law assistant Pakistan",
      "RAG legal AI PTL",
      "law database Pakistan AI",
    ],
  },
  {
    name: "Case Summary Generator",
    slug: "case-summary",
    short:
      "Summarize lengthy judgments into short, readable case summaries designed for Pakistani lawyers.",
    long: `The Case Summary Generator uses AI to read and summarize court judgments, petitions, and legal documents in plain English or Urdu. 
It helps lawyers, students, and judges quickly review key facts, arguments, and rulings — saving research time and improving clarity in complex cases.`,
    banner: "/images/case-summary-banner.png",
    lottie: "/lottie/case-summary.json",
    keywords: [
      "case summary generator Pakistan",
      "AI case summarizer PTL",
      "court judgment summary Pakistan",
      "legal AI tools Pakistan",
    ],
  },
  {
    name: "Urdu Legal Translator",
    slug: "urdu-legal-translator",
    short:
      "Translate legal documents between Urdu and English with accuracy for Pakistan’s legal context.",
    long: `The Urdu Legal Translator by PTL is trained specifically for Pakistan’s legal terms, ensuring accurate translations of contracts, petitions, and affidavits. 
It supports both Urdu-to-English and English-to-Urdu with correct syntax and terminology — ideal for courts, legal drafting, and client communication.`,
    banner: "/images/urdu-legal-translator-banner.png",
    lottie: "/lottie/urdu-legal-translator.json",
    keywords: [
      "Urdu legal translator Pakistan",
      "AI Urdu English translation legal",
      "court translation Pakistan",
      "PTL legal Urdu AI",
    ],
  },
  {
    name: "Client Chatbot Assistant",
    slug: "client-chatbot",
    short:
      "Automate client responses with an intelligent chatbot trained on your law firm's FAQs and services.",
    long: `PTL’s Client Chatbot Assistant allows Pakistani lawyers to deploy custom AI chatbots for client handling. 
It answers common questions about legal fees, case updates, document requirements, and appointment scheduling — letting lawyers focus on strategy while the bot handles the routine.`,
    banner: "/images/client-chatbot-banner.png",
    lottie: "/lottie/client-chatbot.json",
    keywords: [
      "AI chatbot for lawyers Pakistan",
      "client assistant legal AI",
      "law firm automation chatbot",
      "PTL chatbot Pakistan",
    ],
  },
  {
    name: "Reminder & Task Manager",
    slug: "reminder-task-manager",
    short:
      "Keep track of hearings, filing deadlines, and client meetings with smart AI reminders.",
    long: `The PTL Reminder & Task Manager integrates with your daily legal workflow — helping lawyers never miss an important deadline again. 
It syncs with calendars, sends smart notifications, and prioritizes tasks automatically using AI, ensuring productivity and compliance.`,
    banner: "/images/reminder-task-manager-banner.png",
    lottie: "/lottie/reminder-task-manager.json",
    keywords: [
      "legal reminder app Pakistan",
      "task manager for lawyers Pakistan",
      "AI productivity tool law firms",
      "PTL scheduler Pakistan",
    ],
  },
  {
    name: "Legal Opinion Analyzer",
    slug: "legal-opinion-analyzer",
    short:
      "Review legal opinions and draft analysis reports using PTL’s AI reasoning engine.",
    long: `The Legal Opinion Analyzer reads legal drafts and identifies weak arguments, missing clauses, and non-compliance with local laws. 
It helps lawyers strengthen petitions, contracts, and legal opinions — offering smart suggestions backed by Pakistani legal context.`,
    banner: "/images/legal-opinion-analyzer-banner.png",
    lottie: "/lottie/legal-opinion-analyzer.json",
    keywords: [
      "legal opinion analyzer Pakistan",
      "AI legal review tool",
      "document analysis for lawyers",
      "PTL AI analyzer Pakistan",
    ],
  },
  {
    name: "Document Checker",
    slug: "document-checker",
    short:
      "Automatically review legal documents for missing clauses, compliance, and formatting errors.",
    long: `PTL’s Document Checker scans Pakistani legal documents and highlights missing signatures, outdated clauses, and formatting issues. 
It’s a must-have tool for ensuring professional and compliant filings — perfect for firms and solo practitioners alike.`,
    banner: "/images/document-checker-banner.png",
    lottie: "/lottie/document-checker.json",
    keywords: [
      "document checker AI Pakistan",
      "legal compliance tool PTL",
      "AI contract review Pakistan",
      "law document verification AI",
    ],
  },
];

// Utility to fetch service by slug
export function getServiceBySlug(slug: string): Service | null {
  return SERVICES.find((service) => service.slug === slug) || null;
}
