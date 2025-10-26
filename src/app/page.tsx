"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Script from "next/script";

// Lottie only loads on client
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* SEO JSON-LD */}
      <Script id="ptl-jsonld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PTL — AI Legal Assistant for Lawyers in Pakistan",
          url: "https://pakistantoplawyers.com",
          logo: "https://pakistantoplawyers.com/loggo.png",
          description:
            "PTL offers AI-powered legal drafting and smart tools for Pakistani lawyers and law firms. Automate legal research, drafting, and document review using generative AI.",
          sameAs: [
            "https://www.linkedin.com/company/pakistantoplawyers",
            "https://twitter.com/pakistantoplawyers",
            "https://www.facebook.com/pakistantoplawyers",
          ],
        })}
      </Script>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              AI Legal Drafting Assistant <br />
              <span className="text-blue-900">for Lawyers in Pakistan</span>
            </h1>
            <p className="mt-5 text-gray-700 text-lg max-w-2xl">
              Transform your legal practice with PTL — Pakistan’s first
              AI-powered assistant built specifically for lawyers, law firms, and
              legal professionals. Draft contracts, analyze cases, and generate
              legal documents in seconds.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Try PTL Free
              </Link>
              <Link
                href="/learn-more"
                className="border border-blue-900 text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* ✅ Lottie Animation */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-72 h-72 sm:w-80 sm:h-80">
              <Player
                autoplay
                loop
                src="https://assets2.lottiefiles.com/packages/lf20_z9ed2jna.json" // Replace with your actual Lottie URL
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SMART AI TOOLS */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold">
            Smart AI Tools for Law Firms in Pakistan
          </h2>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-blue-100">
            From contract automation to case law analysis — PTL brings
            AI-powered legal tools tailored for Pakistani lawyers and firms.
            Save hours on drafting, research, and document review.
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
          Why Choose PTL — The Future of Law in Pakistan
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "AI Legal Drafting",
              desc: "Generate contracts, petitions, and affidavits with AI assistance trained for Pakistani legal standards.",
            },
            {
              title: "Legal Research Assistant",
              desc: "Search and summarize case law, judgments, and statutes within seconds using intelligent legal search.",
            },
            {
              title: "Document Review & Compliance",
              desc: "Upload documents for instant summaries, risk analysis, and compliance checks powered by AI.",
            },
            {
              title: "Localized for Pakistani Law",
              desc: "PTL understands local legal terms, bilingual context, and Pakistan’s legal framework.",
            },
            {
              title: "Secure & Confidential",
              desc: "Your legal data remains encrypted, private, and never used for model training.",
            },
            {
              title: "Designed for Professionals",
              desc: "Built for lawyers, by legal and AI experts — to enhance your daily legal workflow.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100"
            >
              <h3 className="text-xl font-semibold text-blue-900">
                {item.title}
              </h3>
              <p className="mt-3 text-gray-700">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 text-white py-20 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          Experience AI for Pakistani Lawyers
        </h2>
        <p className="mt-4 text-blue-100 text-lg max-w-2xl mx-auto">
          Join the revolution in Pakistan’s legal industry. Start drafting,
          researching, and reviewing with the power of AI — today.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/signup"
            className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Start Free
          </Link>
          <Link
            href="/contact"
            className="border border-white px-6 py-3 rounded-lg hover:bg-blue-800 transition"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </main>
  );
}
