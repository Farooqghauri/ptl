import AboutAnimation from "../../components/AboutAnimation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PTL | AI Legal Assistant for Lawyers in Pakistan",
  description:
    "Learn about PTL — Pakistan’s first AI-powered legal drafting and research assistant. Our mission is to empower lawyers and law firms with smart AI tools designed for the Pakistani legal system.",
  keywords: [
    "AI for Pakistani Lawyers",
    "AI Legal Drafting Assistant",
    "AI Legal Tools Pakistan",
    "Law Tech Pakistan",
    "Legal AI Solutions",
    "Smart AI Tools for Law Firms in Pakistan",
    "PTL Legal AI Platform",
  ],
  openGraph: {
    title: "About PTL | AI Legal Assistant for Lawyers in Pakistan",
    description:
      "PTL is transforming Pakistan’s legal landscape with AI tools for drafting, research, and document review — designed specifically for lawyers and law firms.",
    url: "https://your-domain.com/about",
    siteName: "PTL - AI Legal Assistant",
    locale: "en_PK",
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
      {/* ✅ Intro Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
          About PTL – Pakistan’s AI Legal Assistant
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
          PTL is Pakistan’s first <span className="font-semibold text-blue-800">AI-powered legal drafting and research assistant</span>,
          created to help lawyers, law firms, and legal students work faster, smarter, and with greater accuracy.
          We combine technology and law to bring automation and intelligence to your daily practice.
        </p>
      </section>

      {/* ✅ Lottie Animation */}
      <div className="flex justify-center items-center my-10">
        <div className="w-full max-w-xl h-[250px] md:h-[350px] rounded-3xl overflow-hidden bg-white shadow-lg">
          <AboutAnimation />
        </div>
      </div>

      {/* ✅ Mission Section */}
      <section className="mb-12 text-left">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">
          Our Mission
        </h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          At PTL, our mission is to <span className="font-semibold">empower Pakistani legal professionals</span> with smart AI tools
          that simplify drafting, research, and document analysis — so they can focus on strategy and client success.
        </p>
        <p className="text-gray-700 leading-relaxed">
          By merging AI and legal expertise, we aim to modernize law practice across Pakistan and make
          advanced technology accessible to every lawyer — from individual practitioners to large law firms.
        </p>
      </section>

      {/* ✅ Vision Section */}
      <section className="mb-12 text-left">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">
          Our Vision
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-700">
          <li>
            To make <span className="font-semibold text-blue-800">AI a trusted partner</span> for every lawyer in Pakistan.
          </li>
          <li>
            To reduce manual work by <span className="font-semibold">automating drafting, research, and compliance</span>.
          </li>
          <li>
            To create an ecosystem where legal services are faster, more transparent, and client-focused.
          </li>
          <li>
            To help lawyers compete globally with smart, data-driven technology tools.
          </li>
        </ul>
      </section>

      {/* ✅ Why PTL Section */}
      <section className="mb-12 text-left">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">
          Why Choose PTL?
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          PTL is not just another AI tool — it’s a purpose-built platform developed
          for Pakistan’s legal framework. Our models are designed to understand
          the nuances of local laws, court procedures, and language preferences.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-3">
          <li>⚖️ <span className="font-semibold">Localized AI Models:</span> Trained for Pakistani legal language and case formats.</li>
          <li>🔍 <span className="font-semibold">AI Legal Drafting:</span> Generate professional contracts, petitions, and affidavits instantly.</li>
          <li>📚 <span className="font-semibold">AI Legal Research:</span> Find judgments, references, and precedents faster.</li>
          <li>🔒 <span className="font-semibold">Confidential & Secure:</span> All data encrypted and processed securely.</li>
        </ul>
      </section>

      {/* ✅ Closing Section */}
      <section className="text-center mt-16">
        <h3 className="text-2xl font-bold text-blue-900 mb-4">
          Building the Future of Law with AI
        </h3>
        <p className="text-gray-700 mb-6 max-w-3xl mx-auto">
          PTL is built by technologists and legal professionals who believe that the future of law is
          intelligent, accessible, and powered by innovation. Join us in transforming Pakistan’s legal ecosystem.
        </p>
        <a
          href="/features"
          className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          Explore Our Features
        </a>
      </section>
    </main>
  );
}
