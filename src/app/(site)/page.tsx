"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  Gavel,
  Scale,
  Search,
  Shield,
  Users,
} from "lucide-react";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Script id="ptl-jsonld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PTL - AI Legal Assistant for Lawyers in Pakistan",
          url: "https://pakistantoplawyers.com",
          logo: "https://pakistantoplawyers.com/loggo.png",
          description:
            "PTL offers AI-powered legal drafting, case summarization, legal translation, and smart research tools for Pakistani lawyers and law firms.",
          sameAs: [
            "https://www.linkedin.com/company/pakistantoplawyers",
            "https://twitter.com/pakistantoplawyers",
            "https://www.facebook.com/pakistantoplawyers",
          ],
        })}
      </Script>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
              <CheckCircle className="h-4 w-4" />
              Pakistan&apos;s AI Legal Platform
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              AI-Powered Legal
              <span className="block bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Assistant for Pakistan
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Draft, research, translate, and summarize legal documents with a
              platform designed for Pakistani law firms. Built to reduce manual
              work and increase accuracy.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                Start Using AI Tools
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-8 py-4 font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-2xl font-bold text-white">3,340+</p>
                <p className="text-sm text-slate-400">Law Sections</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-2xl font-bold text-white">78+</p>
                <p className="text-sm text-slate-400">Court Judgments</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-2xl font-bold text-white">6</p>
                <p className="text-sm text-slate-400">Major Laws</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative h-80 w-80 sm:h-96 sm:w-96">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-2xl" />
              <Player
                autoplay
                loop
                src="/law-scale.json"
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-slate-800 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Practical AI Tools for Legal Professionals
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Focused features that shorten drafting time, improve research
              accuracy, and standardize legal output.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Case Summarizer",
                desc: "Extract key facts, issues, and holdings from judgments in minutes.",
              },
              {
                icon: Scale,
                title: "Legal Drafter",
                desc: "Generate court-ready drafts based on Pakistani legal formats.",
              },
              {
                icon: Search,
                title: "Legal Research",
                desc: "Search PPC, CrPC, CPC, and Constitution with AI-supported context.",
              },
              {
                icon: Gavel,
                title: "Compliance Focus",
                desc: "Built around local legal practice and court expectations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-white">Why Law Firms Choose PTL</h2>
            <p className="mt-4 text-slate-300">
              PTL is designed for Pakistani legal practice with built-in structure
              and compliance checks. Draft faster, research smarter, and keep
              workflows consistent across teams.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 text-blue-300" />
                Private, secure, and designed for professional use
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 text-blue-300" />
                Built on Pakistani statutes and case structures
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-blue-300" />
                Trusted by lawyers, students, and in-house teams
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
            <h3 className="text-xl font-semibold text-white">Get Started</h3>
            <p className="mt-3 text-slate-300">
              Experience the tools that reduce manual drafting and improve
              accuracy. Start with a single case or scale across your firm.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                Open Dashboard
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

