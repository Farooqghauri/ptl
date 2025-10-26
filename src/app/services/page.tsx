"use client";

import Link from "next/link";
import Script from "next/script";
import Lottie from "lottie-react";
import PTLAIAnimation from "@/animations/PTL_AI.json";
import Image from "next/image";

// ✅ Types
interface Service {
  name: string;
  slug: string;
  description: string;
  details: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// ✅ AI Tools / Services for Lawyers in Pakistan
const servicesList: Service[] = [
  {
    name: "AI Legal Drafting Assistant",
    slug: "ai-legal-drafting",
    description:
      "Generate professional legal drafts instantly using PTL’s AI trained on Pakistani case law and judicial language.",
    details:
      "From contracts and petitions to affidavits and agreements — create flawless legal documents in Urdu or English, customized for Pakistan’s courts and law practices.",
  },
  {
    name: "AI Legal Research & RAG Engine",
    slug: "ai-legal-research",
    description:
      "Search and summarize Pakistani case laws, acts, and judgments using AI-powered retrieval tools.",
    details:
      "Our Retrieval-Augmented Generation (RAG) system finds relevant precedents from local databases and provides concise legal research summaries to save hours of manual work.",
  },
  {
    name: "AI Case Summary Generator",
    slug: "ai-case-summary",
    description:
      "Summarize lengthy case judgments, FIRs, and petitions into short, structured briefs.",
    details:
      "Upload any PDF or Word document and get instant summaries — perfect for lawyers handling multiple cases or preparing court submissions.",
  },
  {
    name: "AI Urdu Legal Translator",
    slug: "ai-urdu-translator",
    description:
      "Translate legal documents between Urdu and English with complete accuracy and legal context retention.",
    details:
      "Built for Pakistani lawyers, PTL ensures translations maintain official legal terminologies as used in court documents and acts.",
  },
  {
    name: "AI Client Chatbot",
    slug: "ai-client-chatbot",
    description:
      "Deploy a smart legal chatbot that answers client queries and collects case details automatically.",
    details:
      "Your digital assistant operates 24/7, helping clients understand services, book consultations, and share case details securely.",
  },
  {
    name: "AI Task & Reminder Manager",
    slug: "ai-task-reminder",
    description:
      "Stay organized with automated case reminders, filing deadlines, and court hearing alerts.",
    details:
      "Integrated with PTL’s AI, it keeps track of your cases and tasks — helping lawyers meet critical timelines effortlessly.",
  },
  {
    name: "AI Legal Opinion Analyzer",
    slug: "ai-legal-opinion-analyzer",
    description:
      "Evaluate and enhance legal opinions using advanced AI reasoning aligned with Pakistani laws.",
    details:
      "Analyze drafts, legal notes, or opinions to identify weaknesses, missing citations, or potential contradictions.",
  },
  {
    name: "AI Document Checker",
    slug: "ai-document-checker",
    description:
      "Ensure your legal documents are error-free and contain all mandatory clauses under Pakistani regulations.",
    details:
      "PTL AI cross-checks contracts, affidavits, and agreements for missing sections or inconsistencies — ensuring legal compliance before submission.",
  },
];

// ✅ FAQs
const faqs: FAQ[] = [
  {
    question: "What makes PTL’s AI tools unique for Pakistani lawyers?",
    answer:
      "PTL’s AI tools are trained on local case laws, Urdu and English legal language, and Pakistani court formats — giving lawyers accurate, jurisdiction-specific assistance.",
  },
  {
    question: "Can I generate or translate legal documents in Urdu?",
    answer:
      "Yes. PTL’s AI can draft, translate, and summarize legal content in both Urdu and English while maintaining professional accuracy.",
  },
  {
    question: "Is my confidential case data secure?",
    answer:
      "Absolutely. PTL ensures end-to-end encryption and follows strict cybersecurity standards to protect all user and client data.",
  },
  {
    question: "Do these AI tools replace lawyers?",
    answer:
      "No. PTL’s AI tools are designed to assist lawyers — not replace them — by automating repetitive tasks and enhancing accuracy and efficiency.",
  },
  {
    question: "Can overseas Pakistani lawyers use PTL?",
    answer:
      "Yes. PTL is fully accessible online, allowing overseas legal professionals to draft, translate, and analyze documents related to Pakistani law.",
  },
];

export default function Services() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12 text-gray-800">
      {/* ✅ Structured Data for SEO */}
      <Script id="ptl-faq-jsonld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        })}
      </Script>

      {/* ✅ Header Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 leading-tight">
          AI Tools for Lawyers in Pakistan
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          Transform your legal practice with PTL — Pakistan’s first suite of
          AI-powered tools built exclusively for lawyers, advocates, and law
          firms. Draft, research, translate, and analyze — all in one secure
          legal AI platform.
        </p>
      </section>

      {/* ✅ Lottie Animation (Rounded, Responsive, Optimized) */}
      <div className="relative flex justify-center items-center mb-20">
        <div className="w-full max-w-[700px] aspect-[16/9] rounded-5xl overflow-hidden shadow-xl">
          <Lottie
            animationData={PTLAIAnimation}
            loop
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* ✅ AI Tools Section */}
      <section>
        <h2 className="text-3xl font-bold text-blue-900 mb-10 text-center">
          Explore PTL’s AI Tools for Legal Professionals
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {servicesList.map((service) => (
            <li
              key={service.slug}
              className="border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all bg-white"
            >
              <h3 className="text-2xl font-semibold text-blue-800 mb-3">
                <Link href={`/services/${service.slug}`} className="hover:underline">
                  {service.name}
                </Link>
              </h3>
              <p className="text-gray-700 mb-2">{service.description}</p>
              <p className="text-gray-600 mb-4">{service.details}</p>
              <Link
                href={`/services/${service.slug}`}
                className="text-blue-700 font-medium hover:underline"
              >
                Learn more →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ✅ FAQ Section */}
      <section className="mt-24">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <ul className="space-y-6 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <li
              key={index}
              className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-100"
            >
              <h4 className="font-semibold text-blue-800 mb-2">{faq.question}</h4>
              <p className="text-gray-700">{faq.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ✅ CTA Section */}
      <section className="mt-24 text-center">
        <div className="max-w-3xl mx-auto">
          <Image
            src="/ai-law-banner.png"
            alt="AI Tools for Lawyers in Pakistan"
            width={800}
            height={300}
            className="mx-auto rounded-3xl shadow-md object-cover"
            priority
          />
          <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-3">
            Empower Your Legal Practice with AI
          </h2>
          <p className="text-gray-700 mb-6">
            From drafting and research to client communication — PTL’s AI tools
            help Pakistani lawyers save time, improve accuracy, and stay ahead
            in the digital era.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Request Free Demo
          </Link>
        </div>
      </section>
    </main>
  );
}
