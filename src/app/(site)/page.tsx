// src/app/page.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Script from "next/script";
import { 
  FileText, 
  Scale, 
  Languages, 
  Search,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  Users,
  BookOpen,
  Gavel
} from "lucide-react";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function HomePage() {
  const aiTools = [
    {
      icon: FileText,
      title: "Case Summarizer",
      desc: "Upload any judgment PDF and get instant AI-powered summaries with key holdings, facts, and legal principles extracted automatically.",
      href: "/ai-tools/case-summarizer",
      color: "blue",
      stats: "78+ Judgments"
    },
    {
      icon: Scale,
      title: "Legal Drafter",
      desc: "Generate professional legal documents — petitions, contracts, notices, affidavits — tailored to Pakistani law standards in seconds.",
      href: "/ai-tools/legal-drafter",
      color: "emerald",
      stats: "15+ Templates"
    },
    {
      icon: Languages,
      title: "Legal Translator",
      desc: "Translate legal documents between English and Urdu with accurate Pakistani legal terminology preservation.",
      href: "/ai-tools/legal-translator",
      color: "purple",
      stats: "Bilingual AI"
    },
    {
      icon: Search,
      title: "Legal Research",
      desc: "Search 3,340+ law sections from PPC, CrPC, CPC, Constitution & more. Find relevant case law instantly with AI explanations.",
      href: "/ai-tools/research",
      color: "amber",
      stats: "3,340+ Sections"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Instant Results",
      desc: "Get AI-powered legal insights in seconds, not hours"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      desc: "Your data is encrypted and never used for training"
    },
    {
      icon: BookOpen,
      title: "Pakistani Law Focus",
      desc: "Built specifically for Pakistan's legal framework"
    },
    {
      icon: Users,
      title: "For Legal Professionals",
      desc: "Designed by lawyers and AI experts together"
    }
  ];

  const laws = [
    "Pakistan Penal Code 1860",
    "Code of Criminal Procedure 1898",
    "Code of Civil Procedure 1908",
    "Constitution of Pakistan 1973",
    "Qanun-e-Shahadat Order 1984",
    "Muslim Family Laws Ordinance 1961"
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* SEO JSON-LD */}
      <Script id="ptl-jsonld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PTL — AI Legal Assistant for Lawyers in Pakistan",
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

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Pakistans First AI Legal Platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
              AI-Powered Legal
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">
                Assistant for Pakistan
              </span>
            </h1>
            
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Transform your legal practice with intelligent tools for case summarization, 
              document drafting, legal translation, and comprehensive research — all built 
              for Pakistani law.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              >
                Start Using AI Tools
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#tools"
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
              >
                Explore Features
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">3,340+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Law Sections</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">78+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Court Judgments</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">6</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Major Laws</p>
              </div>
            </div>
          </div>

          {/* Lottie Animation */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 dark:from-blue-500/10 dark:to-emerald-500/10 rounded-full blur-2xl" />
              <Player
                autoplay
                loop
                src="https://assets2.lottiefiles.com/packages/lf20_z9ed2jna.json"
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI TOOLS SECTION */}
      <section id="tools" className="py-20 bg-slate-100/50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Powerful AI Tools for Legal Professionals
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Four specialized tools designed to streamline your legal workflow and save hours of manual work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiTools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-xl ${
                    tool.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    tool.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                    tool.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    <tool.icon className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.title}
                      </h3>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">
                        {tool.stats}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {tool.desc}
                    </p>
                    
                    <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Try Now <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LAWS COVERED */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-3xl p-10 md:p-16 text-white overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Gavel className="w-8 h-8" />
                <h2 className="text-3xl md:text-4xl font-bold">
                  Comprehensive Legal Database
                </h2>
              </div>
              
              <p className="text-blue-100 text-lg max-w-2xl mb-10">
                Access Pakistans most important legal texts — all searchable with AI-powered explanations in simple English and Urdu.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {laws.map((law) => (
                  <div key={law} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white font-medium">{law}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/ai-tools/research"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  Search Legal Database
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE PTL */}
      <section className="py-20 bg-slate-100/50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Why Pakistani Lawyers Choose PTL
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Built specifically for Pakistans legal ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mb-4">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-10 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Legal Practice?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of Pakistani lawyers already using AI to work smarter. 
              Start drafting, researching, and analyzing with PTL today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Get Started Free
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}