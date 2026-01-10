"use client";

import React, { useState } from "react";
import {
  FileText,
  Scale,
  Languages,
  Search,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Zap,
  Shield,
  Users,
  Home,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import "../../styles/dark-theme.css";



interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  color: string;
  bgGradient: string;
  iconBg: string;
  darkIconBg: string;
  status: "active" | "coming-soon";
  features: string[];
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const aiTools: AITool[] = [
    {
      id: "case-summarizer",
      title: "Case Summarizer",
      description:
        "Upload court judgments and get instant AI-powered summaries with key findings and precedents.",
      icon: FileText,
      path: "/ai-tools/case-summarizer",
      color: "text-blue-600 dark:text-blue-400",
      bgGradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-100",
      darkIconBg: "dark:bg-blue-900/50",
      status: "active",
      features: ["PDF Upload", "Key Findings", "Citation Extraction"],
    },
    {
      id: "legal-drafter",
      title: "Legal Drafter",
      description:
        "Generate professional legal drafts with automated citations from Supreme Court and High Court judgments.",
      icon: Scale,
      path: "/ai-tools/legal-drafter",
      color: "text-purple-600 dark:text-purple-400",
      bgGradient: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-100",
      darkIconBg: "dark:bg-purple-900/50",
      status: "active",
      features: ["Auto Citations", "Multiple Templates", "Smart Drafting"],
    },
    {
      id: "legal-translator",
      title: "Legal Translator",
      description:
        "Translate legal documents between English and Urdu with specialized legal terminology accuracy.",
      icon: Languages,
      path: "/ai-tools/legal-translator",
      color: "text-green-600 dark:text-green-400",
      bgGradient: "from-green-500 to-emerald-600",
      iconBg: "bg-green-100",
      darkIconBg: "dark:bg-green-900/50",
      status: "active",
      features: ["English ↔ Urdu", "Legal Terms", "Document Upload"],
    },
    {
      id: "legal-research",
      title: "Legal Research Hub",
      description:
        "Search judgments, analyze cases, find precedents, and ask legal questions - all in one powerful tool.",
      icon: Search,
      path: "/ai-tools/research",
      color: "text-orange-600 dark:text-orange-400",
      bgGradient: "from-orange-500 to-red-600",
      iconBg: "bg-orange-100",
      darkIconBg: "dark:bg-orange-900/50",
      status: "active",
      features: ["78+ Judgments", "AI Search", "Legal Q&A", "Precedents"],
    },
  ];

  const stats = [
    {
      label: "AI Tools",
      value: "4",
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: "Judgments",
      value: "78+",
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/30",
    },
    {
      label: "Active Users",
      value: "150+",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/30",
    },
    {
      label: "Uptime",
      value: "99.9%",
      icon: Shield,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/30",
    },
  ];

  const filteredTools = aiTools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
          {/* Header */}
          {/* <div className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      PTL AI Suite
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Pakistan Top Lawyers
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </Link>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md">
                    <Sparkles className="w-4 h-4" />
                    <span>Pro Plan</span>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, Counselor 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Access powerful AI tools designed specifically for Pakistani legal professionals.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search AI tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* AI Tools Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tools</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"} available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Card Header with Gradient */}
                    <div className={`h-2 bg-gradient-to-r ${tool.bgGradient}`} />

                    <div className="p-6">
                      {/* Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-14 h-14 ${tool.iconBg} ${tool.darkIconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <tool.icon className={`w-7 h-7 ${tool.color}`} />
                        </div>

                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Live
                        </span>
                      </div>

                      {/* Title and Description */}
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {tool.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tool.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Action Button */}
                      <Link href={tool.path}>
                        <button className="w-full py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-600 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                          Open Tool
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredTools.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No tools found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search query</p>
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Need help getting started?</h3>
                  <p className="text-blue-100">
                    Our AI tools are designed to save you hours of research and drafting time.
                    Start with the Case Summarizer to see the power of AI in action.
                  </p>
                </div>
                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap">
                  View Documentation
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500 max-w-3xl mx-auto">
                <strong>Legal Disclaimer:</strong> All AI-generated content is for informational
                purposes only and does not constitute legal advice. Users must verify all citations
                and recommendations with official sources before court submission. PTL AI Suite is
                a research and drafting assistance tool.
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
