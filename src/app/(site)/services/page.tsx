"use client";

import Link from "next/link";
import Script from "next/script";
import { FileText, Languages, Scale, Search } from "lucide-react";

interface ToolDetail {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  howToUse: string[];
}

const tools: ToolDetail[] = [
  {
    title: "AI Case Summarizer",
    icon: FileText,
    description:
      "Summarize Pakistani court judgments with structured outputs like facts, issues, holdings, and key citations.",
    howToUse: [
      "Upload a judgment PDF in the Case Summarizer tool.",
      "Wait for the summary sections to appear (facts, issues, holdings).",
      "Copy or download the summary for your case file.",
    ],
  },
  {
    title: "AI Legal Document Drafter",
    icon: Scale,
    description:
      "Generate court-ready drafts in Pakistani legal formats with section guidance and structured templates.",
    howToUse: [
      "Select the draft category (bail, writ, notice, stay, recovery).",
      "Paste case facts with names, dates, and sections if known.",
      "Generate and review the English and Urdu drafts before filing.",
    ],
  },
  {
    title: "Legal Document Translator",
    icon: Languages,
    description:
      "Translate legal documents between English and Urdu while preserving legal terminology and format.",
    howToUse: [
      "Upload a document and choose translation direction.",
      "Review the translated output for legal accuracy.",
      "Download the translation for client or court use.",
    ],
  },
  {
    title: "AI Legal Research Assistant",
    icon: Search,
    description:
      "Search Pakistani statutes and case law with AI summaries and relevant sections.",
    howToUse: [
      "Enter a section number or legal question.",
      "Review the returned statutes, cases, and AI explanation.",
      "Use the citations for further drafting and research.",
    ],
  },
];

const faqs = [
  {
    question: "Who should use PTL services?",
    answer:
      "PTL is designed for lawyers, law firms, legal teams, and overseas Pakistanis who need reliable legal drafting and research support.",
  },
  {
    question: "Are the AI drafts court ready?",
    answer:
      "Drafts are structured and compliant, but every document should be reviewed by a licensed lawyer before filing.",
  },
  {
    question: "Does PTL support Urdu legal work?",
    answer:
      "Yes. PTL includes Urdu translation tools and Urdu draft outputs where applicable.",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Script id="ptl-services-jsonld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "PTL Legal Services",
          description:
            "AI legal drafting, translation, summarization, and research tools for Pakistani lawyers and law firms.",
          provider: {
            "@type": "Organization",
            name: "Pakistan's Top Lawyers",
          },
        })}
      </Script>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Services
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            AI-Powered Legal Services for Pakistan
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
            PTL provides practical, compliant legal AI tools for drafting,
            summarization, translation, and research. Each tool is designed for
            Pakistani law firms and legal professionals who need speed without
            sacrificing accuracy.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-bold text-white">Hire a Top Lawyer</h2>
          <p className="mt-4 text-slate-300">
            Need direct legal representation? PTL connects overseas Pakistanis
            and local clients with vetted, experienced lawyers across Pakistan.
            Share your case details and we will guide you to the right expert.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/hire-a-top-lawyer"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Request a Lawyer
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
            >
              Contact Support
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl font-bold text-white">
            Working AI Tools (Detailed Usage)
          </h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            These tools are available in the dashboard and currently active. Each
            section below explains what the tool does and how to use it.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {tools.map((tool) => (
              <div
                key={tool.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {tool.title}
                  </h3>
                </div>
                <p className="mt-4 text-slate-300">{tool.description}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  {tool.howToUse.map((step) => (
                    <div key={step} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Pricing</h2>
              <p className="mt-3 text-slate-300">
                Choose a plan that fits your practice. See full details on the
                pricing page.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              View Pricing
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white">FAQs</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
