"use client";

import React from "react";
import {
  FileText,
  Scale,
  Languages,
  Search,
  ArrowRight,
  Zap,
  CheckCircle,
  Sparkles,
  Star,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

interface AITool {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  gradient: string;
  iconBg: string;
  highlights: string[];
}

export default function Dashboard() {
  const aiTools: AITool[] = [
    {
      id: "case-summarizer",
      title: "AI Case Summarizer",
      tagline: "Summarize Pakistani Court Judgments in Seconds",
      description:
        "Upload Supreme Court, High Court, or District Court judgments in PDF format and get instant AI-powered summaries. Extract key findings, ratio decidendi, obiter dicta, and cited precedents automatically. Perfect for busy advocates preparing for hearings.",
      icon: FileText,
      path: "/ai-tools/case-summarizer",
      gradient: "from-blue-500 to-cyan-400",
      iconBg: "bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-500/30",
      highlights: [
        "Supreme Court & High Court PDFs",
        "Extract Ratio Decidendi",
        "Identify Cited Precedents",
        "Save Hours of Reading",
      ],
    },
    {
      id: "legal-drafter",
      title: "AI Legal Document Drafter",
      tagline: "Draft Bail Applications, Writ Petitions & Legal Notices",
      description:
        "Generate court-ready legal documents with proper Pakistani legal formatting. Create bail applications (pre-arrest & post-arrest), writ petitions under Article 199, Khula suits, stay applications, and legal notices. Auto-cite relevant PPC, CrPC, and CPC sections.",
      icon: Scale,
      path: "/ai-tools/legal-drafter",
      gradient: "from-purple-500 to-pink-500",
      iconBg: "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30",
      highlights: [
        "Bail Applications (Pre & Post Arrest)",
        "Writ Petitions Article 199",
        "Auto-Cite PPC, CrPC, CPC Sections",
        "Court-Ready Formatting",
      ],
    },
    {
      id: "legal-translator",
      title: "Legal Document Translator",
      tagline: "English to Urdu Legal Translation with Proper Terminology",
      description:
        "Translate legal documents between English and Urdu while preserving specialized Pakistani legal terminology. Supports Jameel Noori Nastaleeq font, RTL formatting, and court-specific language used in Pakistani judiciary system.",
      icon: Languages,
      path: "/ai-tools/legal-translator",
      gradient: "from-emerald-500 to-teal-400",
      iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-400/20 border border-emerald-500/30",
      highlights: [
        "English ↔ Urdu Translation",
        "Pakistani Legal Terminology",
        "Urdu RTL Formatting",
        "Court Document Ready",
      ],
    },
    {
      id: "legal-research",
      title: "AI Legal Research Assistant",
      tagline: "Search PPC, CrPC, CPC, Constitution & Case Law",
      description:
        "Search across 3,340+ law sections from Pakistan Penal Code (PPC), Code of Criminal Procedure (CrPC), Civil Procedure Code (CPC), Constitution of Pakistan, Qanun-e-Shahadat, and Muslim Family Laws. Find relevant judgments and ask AI legal questions.",
      icon: Search,
      path: "/ai-tools/research",
      gradient: "from-orange-500 to-amber-400",
      iconBg: "bg-gradient-to-br from-orange-500/20 to-amber-400/20 border border-orange-500/30",
      highlights: [
        "3,340+ Law Sections Database",
        "PPC, CrPC, CPC, Constitution",
        "78 Supreme Court Judgments",
        "AI-Powered Legal Q&A",
      ],
    },
  ];

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-900/50">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[#E85D2A] to-amber-400 bg-clip-text text-transparent">
                  PTL AI Legal Suite
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-3xl">
                Pakistan&apos;s first AI-powered legal platform for advocates and law firms. 
                Draft petitions, research case law, translate documents, and summarize judgments — all in one place.
              </p>
            </div>

            {/* Tools Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-[#E85D2A] to-amber-400 rounded-full" />
              <h2 className="text-2xl font-bold text-white">AI-Powered Legal Tools</h2>
              <span className="ml-auto text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
                4 Tools Available
              </span>
            </div>

            {/* AI Tools - Vertical Cards */}
            <div className="space-y-6">
              {aiTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient left border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tool.gradient}`} />

                  {/* Hover glow effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  <div className="relative p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Left: Icon & Number */}
                      <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                        <div
                          className={`w-16 h-16 ${tool.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <tool.icon className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-6xl font-bold text-gray-700/50 lg:hidden">
                          0{index + 1}
                        </span>
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="hidden lg:block text-5xl font-bold text-gray-700/30">
                            0{index + 1}
                          </span>
                          <div>
                            <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-[#E85D2A] transition-colors">
                              {tool.title}
                            </h3>
                            <p className={`text-sm font-medium bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent`}>
                              {tool.tagline}
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-400 mb-5 leading-relaxed max-w-3xl">
                          {tool.description}
                        </p>

                        {/* Highlights */}
                        <div className="flex flex-wrap gap-3 mb-5">
                          {tool.highlights.map((highlight, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/30 text-gray-300 text-sm rounded-lg border border-gray-600/30"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: CTA Button */}
                      <div className="lg:self-center">
                        <Link href={tool.path}>
                          <button
                            className={`w-full lg:w-auto px-6 py-3.5 bg-gradient-to-r ${tool.gradient} hover:opacity-90 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-black/20 whitespace-nowrap`}
                          >
                            <Sparkles className="w-4 h-4" />
                            Open Tool
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Help Banner */}
            <div className="mt-12 relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-[#E85D2A] to-amber-500" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
              <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-white/80" />
                    <span className="text-white/80 text-sm font-medium">
                      Built for Pakistani Legal Professionals
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Save Hours on Legal Research & Drafting
                  </h3>
                  <p className="text-white/80">
                    PTL AI Suite helps advocates, law firms, and legal researchers work faster. 
                    Access PPC, CrPC, CPC, Constitution sections and Supreme Court judgments instantly.
                  </p>
                </div>
                <Link href="/ai-tools/research">
                  <button className="px-6 py-3.5 bg-white text-[#E85D2A] rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all whitespace-nowrap">
                    Start Researching
                  </button>
                </Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-10 text-center">
              <p className="text-xs text-gray-500 max-w-3xl mx-auto leading-relaxed">
                <strong className="text-gray-400">Legal Disclaimer:</strong> All AI-generated
                content is for informational purposes only and does not constitute legal advice.
                Users must verify all citations and recommendations with official sources before
                court submission. PTL AI Suite is a research and drafting assistance tool for
                Pakistani lawyers and advocates.
              </p>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}