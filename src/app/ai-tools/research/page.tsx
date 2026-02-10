"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Scale, 
  BookOpen, 
  Gavel, 
  Sparkles, 
  ChevronRight,
  FileText,
  Clock,
  Building,
  Lightbulb,
  Copy,
  Check,
  Download,
  ArrowLeft,
  HelpCircle,
  X
} from "lucide-react";
import { downloadText } from "@/lib/download";
import { API_BASE_URL } from "@/lib/constants";



interface Section {
  law_name: string;
  section_number: string;
  title: string;
  content: string;
}

interface Judgment {
  case_title: string;
  court: string;
  date: string;
  citation: string;
  summary: string;
}

interface SearchResult {
  query_type: string;
  sections: Section[];
  judgments: Judgment[];
  ai_explanation: string;
  suggestions: string[];
}

interface Stats {
  total_sections: number;
  total_judgments: number;
  laws_covered: string[];
}

export default function ResearchPage() {
  const API_BASE = API_BASE_URL;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Fetch stats on load
  useEffect(() => {
       fetch(`${API_BASE}/api/research/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
        const response = await fetch(`${API_BASE}/api/research/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      
      if (!response.ok) throw new Error("Search failed");
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickSearches = [
    "489F",
    "PPC 302",
    "CrPC 154",
    "bail murder",
    "divorce procedure",
    "Section 420",
  ];

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Back Link */}
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-900/40 rounded-lg">
                  <Scale className="w-6 h-6 text-emerald-300" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100">
                  Legal Research
                </h1>
              </div>
              <p className="text-slate-400">
                Search law sections, case law, or ask any legal question
              </p>
            </div>
            
            {/* How to Use Button */}
            <button
              onClick={() => setShowHowToUse(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-slate-200 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800"
          >
              <HelpCircle className="w-4 h-4" />
              How to Use
            </button>
          </div>
        </div>
      </div>

      {/* How to Use Modal */}
      {showHowToUse && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">
                How to Use Legal Research
              </h2>
              <button
                onClick={() => setShowHowToUse(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Search Types */}
              <div>
                <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-500" />
                  What You Can Search
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-lg">
                    <p className="font-medium text-blue-200 text-sm">📖 Law Sections</p>
                    <p className="text-sm text-blue-300 mt-1">
                      Type section numbers like <code className="bg-blue-900/60 px-1 rounded">489F</code>, <code className="bg-blue-900/60 px-1 rounded">PPC 302</code>, or <code className="bg-blue-900/60 px-1 rounded">CrPC 154</code>
                    </p>
                  </div>
                  <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg">
                    <p className="font-medium text-amber-200 text-sm">⚖️ Case Law</p>
                    <p className="text-sm text-amber-300 mt-1">
                      Search cases like <code className="bg-amber-900/60 px-1 rounded">bail murder</code> or <code className="bg-amber-900/60 px-1 rounded">2023 SCMR</code>
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                    <p className="font-medium text-emerald-200 text-sm">💡 Legal Questions</p>
                    <p className="text-sm text-emerald-300 mt-1">
                      Ask anything like <code className="bg-emerald-900/60 px-1 rounded">how to file FIR</code> or <code className="bg-emerald-900/60 px-1 rounded">divorce procedure</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Examples */}
              <div>
                <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Example Searches
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    <code className="bg-slate-800 px-2 py-0.5 rounded">489F</code> - Cheque bounce law
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    <code className="bg-slate-800 px-2 py-0.5 rounded">PPC 302</code> - Murder section
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    <code className="bg-slate-800 px-2 py-0.5 rounded">bail Supreme Court</code> - Bail cases
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    <code className="bg-slate-800 px-2 py-0.5 rounded">punishment for theft</code> - Legal question
                  </li>
                </ul>
              </div>

              {/* Tips */}
              <div>
                <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Use quick search buttons for common queries</li>
                  <li>• Add law name for precise results (PPC, CrPC, CPC)</li>
                  <li>• Click on sections to expand full text</li>
                  <li>• Download or copy AI explanations for your records</li>
                </ul>
              </div>

              {/* Database Info */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <h3 className="font-semibold text-slate-100 mb-2 text-sm">
                  📚 Database Coverage
                </h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Pakistan Penal Code 1860</li>
                  <li>• Code of Criminal Procedure 1898</li>
                  <li>• Code of Civil Procedure 1908</li>
                  <li>• Constitution of Pakistan 1973</li>
                  <li>• Qanun-e-Shahadat Order 1984</li>
                  <li>• Muslim Family Laws Ordinance 1961</li>
                  <li>• 78+ Supreme Court & High Court Judgments</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => setShowHowToUse(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
              >
                Got it, lets search!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Box */}
        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type section number (489F), case topic (bail murder), or ask a question..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-slate-700 rounded-xl bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Quick Searches */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-300 dark:text-slate-400">Try:</span>
            {quickSearches.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q);
                }}
                className="px-3 py-1 text-sm bg-slate-800 text-slate-300 rounded-full hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-300">
                Searching legal database...
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Query Type Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-900/50 text-emerald-200 text-sm font-medium rounded-full">
                {result.query_type === "section_lookup" && "📖 Section Lookup"}
                {result.query_type === "case_search" && "⚖️ Case Search"}
                {result.query_type === "legal_question" && "💡 Legal Question"}
              </span>
              <span className="text-sm text-slate-300 dark:text-slate-400">
                Found {result.sections.length} sections, {result.judgments.length} cases
              </span>
            </div>

            {/* AI Explanation - Main Card */}
            <div className="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">AI Explanation</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.ai_explanation)}
                      className="p-2 hover:bg-slate-900/20 rounded-lg transition-colors text-white"
                      title="Copy"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => {
                          downloadText(
                            result.ai_explanation,
                            `legal-research-${query}.txt`,
                            "text/plain"
                          );
                        }}
                      className="p-2 hover:bg-slate-900/20 rounded-lg transition-colors text-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
                    {result.ai_explanation}
                  </div>
                </div>
              </div>
            </div>

            {/* Law Sections */}
            {result.sections.length > 0 && (
              <div className="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-slate-100">
                      Law Sections ({result.sections.length})
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {result.sections.map((section, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-800/60">
                      <button
                        onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                                Section {section.section_number}
                              </span>
                              <span className="text-xs text-slate-300 dark:text-slate-400">
                                {section.law_name}
                              </span>
                            </div>
                            <h3 className="font-medium text-slate-100">
                              {section.title}
                            </h3>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              expandedSection === idx ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </button>
                      {expandedSection === idx && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">
                            {section.content}
                          </p>
                          <button
                            onClick={() => copyToClipboard(section.content)}
                            className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy section text
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Judgments */}
            {result.judgments.length > 0 && (
              <div className="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-slate-100">
                      Related Cases ({result.judgments.length})
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {result.judgments.map((judgment, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-800/60">
                      <h3 className="font-medium text-slate-100 mb-2">
                        {judgment.case_title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 dark:text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {judgment.court}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {judgment.date}
                        </span>
                        {judgment.citation && (
                          <span className="px-2 py-0.5 bg-amber-900/40 text-amber-200 rounded">
                            {judgment.citation}
                          </span>
                        )}
                      </div>
                      {judgment.summary && (
                        <p className="text-sm text-slate-300 line-clamp-3">
                          {judgment.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-200">
                    Search Tips
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.suggestions.map((suggestion, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs bg-slate-900 dark:bg-slate-700 text-slate-300 rounded-full border border-slate-200 dark:border-slate-600"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Start Your Legal Research
            </h3>
            <p className="text-slate-300 dark:text-slate-400 max-w-md mx-auto mb-4">
              Enter a section number like <strong>489F</strong>, search for cases like{" "}
              <strong>bail murder</strong>, or ask any legal question.
            </p>
            <button
              onClick={() => setShowHowToUse(true)}
              className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <HelpCircle className="w-4 h-4" />
              Learn how to use this tool
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

