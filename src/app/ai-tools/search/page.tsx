"use client";
import { useState, useEffect } from "react";
import { Search, BookOpen, Scale, AlertCircle, Database, Brain, FileText, ExternalLink, Clock } from "lucide-react";

// Types
interface AISearchResult {
  response: string;
  sources: string[];
}

interface Judgment {
  id: number;
  title: string;
  citation: string | null;
  summary: string | null;
  pdf_url: string;
  judgment_date: string | null;
  created_at: string | null;
  relevance_score?: number;
}

interface JudgmentSearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  results: Judgment[];
  search_type: string;
}

interface Stats {
  total_judgments: number;
  with_embeddings: number;
  with_full_text: number;
  last_updated: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LegalSearch() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"ai" | "keyword" | "semantic">("ai");
  
  // Search state
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // AI Search results
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  
  // Judgment search results
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  
  // Stats
  const [stats, setStats] = useState<Stats | null>(null);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/search/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.log("Stats not available");
      }
    };
    loadStats();
  }, []);

  // AI Search (existing functionality)
  const handleAISearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    setAiResult(null);

    try {
      const res = await fetch(`${API_URL}/api/search-engine?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (res.ok) {
        setAiResult(data);
      } else {
        setError("Failed to fetch AI results.");
      }
    } catch (err) {
      setError("Backend server is not running. Start it with: uvicorn main:app --reload");
    } finally {
      setLoading(false);
    }
  };

  // Keyword Search (new - uses FTS5)
  const handleKeywordSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    setJudgments([]);

    try {
      const res = await fetch(`${API_URL}/api/search/keyword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 20 }),
      });
      
      const data: JudgmentSearchResponse = await res.json();
      
      if (res.ok && data.success) {
        setJudgments(data.results);
        setTotalResults(data.total_results);
      } else {
        setError("Keyword search failed. Check if backend is running.");
      }
    } catch (err) {
      setError("Backend server is not running. Start it with: uvicorn main:app --reload");
    } finally {
      setLoading(false);
    }
  };

  // Semantic Search (new - uses AI embeddings)
  const handleSemanticSearch = async () => {
    if (!query || query.length < 10) {
      setError("Please enter at least 10 characters for semantic search");
      return;
    }
    setLoading(true);
    setError("");
    setJudgments([]);

    try {
      const res = await fetch(`${API_URL}/api/search/semantic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 10 }),
      });
      
      const data: JudgmentSearchResponse = await res.json();
      
      if (res.ok && data.success) {
        setJudgments(data.results);
        setTotalResults(data.total_results);
      } else {
        const errorData = data as { detail?: string };
        setError(errorData.detail || "Semantic search failed.");
      }
    } catch (err) {
      setError("Backend server is not running. Start it with: uvicorn main:app --reload");
    } finally {
      setLoading(false);
    }
  };

  // Handle search based on active tab
  const handleSearch = () => {
    if (activeTab === "ai") {
      handleAISearch();
    } else if (activeTab === "keyword") {
      handleKeywordSearch();
    } else {
      handleSemanticSearch();
    }
  };

  // Load recent judgments
  const loadRecent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/search/recent?limit=10`);
      const data: JudgmentSearchResponse = await res.json();
      if (res.ok && data.success) {
        setJudgments(data.results);
        setTotalResults(data.total_results);
        setActiveTab("keyword");
      }
    } catch (err) {
      setError("Failed to load recent judgments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">PTL Legal Research</h1>
          <p className="text-gray-500">Search Pakistani Case Law with AI-Powered Intelligence</p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap justify-center gap-4 text-sm border">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              <span className="text-gray-600">Judgments:</span>
              <span className="font-semibold">{stats.total_judgments}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-green-600" />
              <span className="text-gray-600">AI-Enabled:</span>
              <span className="font-semibold text-green-600">{stats.with_embeddings}</span>
            </div>
            {stats.last_updated && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-500 text-xs">
                  Updated: {new Date(stats.last_updated).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search Tabs */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === "ai"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            <Scale size={18} /> AI Analysis
          </button>
          <button
            onClick={() => setActiveTab("keyword")}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === "keyword"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            <Search size={18} /> Keyword Search
          </button>
          <button
            onClick={() => setActiveTab("semantic")}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === "semantic"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            <Brain size={18} /> AI Semantic Search
          </button>
        </div>

        {/* Search Description */}
        <div className="text-center text-sm text-gray-500">
          {activeTab === "ai" && "Ask legal questions - get AI-powered answers with statute references"}
          {activeTab === "keyword" && "Search judgments by keywords like 'bail', 'murder', 'constitutional'"}
          {activeTab === "semantic" && "Ask questions naturally - AI finds conceptually similar cases"}
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 shadow-lg bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="text"
            className="flex-1 p-3 outline-none text-lg"
            placeholder={
              activeTab === "ai"
                ? "e.g. Can I get bail in 489F? or Punishment for 302 PPC"
                : activeTab === "keyword"
                ? "Enter keywords: bail, murder, constitutional..."
                : "Ask naturally: can police arrest without warrant?"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? "Searching..." : <><Search size={20} /> Search</>}
          </button>
        </div>

        {/* Quick Actions */}
        {(activeTab === "keyword" || activeTab === "semantic") && (
          <div className="flex justify-center gap-2">
            <button
              onClick={loadRecent}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Recent Judgments
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {/* AI Search Results */}
        {activeTab === "ai" && aiResult && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-blue-900">
                <Scale className="text-blue-600" /> AI Legal Analysis
              </h2>
              <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {aiResult.response}
              </div>
            </div>

            {aiResult.sources && aiResult.sources.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {aiResult.sources.map((source: string, idx: number) => (
                  <div key={idx} className="bg-slate-100 p-4 rounded-lg text-sm border border-slate-200">
                    <div className="flex items-start gap-2">
                      <BookOpen size={16} className="mt-1 text-slate-500 shrink-0" />
                      <p className="text-slate-700">{source}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Judgment Search Results */}
        {(activeTab === "keyword" || activeTab === "semantic") && judgments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {totalResults} Judgment{totalResults !== 1 ? "s" : ""} Found
              </h2>
              {activeTab === "semantic" && (
                <span className="text-sm text-gray-500">Sorted by relevance</span>
              )}
            </div>

            {judgments.map((judgment) => (
              <div
                key={judgment.id}
                className="bg-white rounded-xl shadow-sm p-5 border hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-900">
                      {judgment.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-2 text-sm">
                      {judgment.citation && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs">
                          {judgment.citation}
                        </span>
                      )}
                      {judgment.relevance_score !== undefined && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
                          {(judgment.relevance_score * 100).toFixed(1)}% match
                        </span>
                      )}
                      {judgment.created_at && (
                        <span className="text-gray-500 text-xs">
                          Added: {new Date(judgment.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {judgment.summary && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {judgment.summary}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <a
                      href={judgment.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      <FileText size={14} /> PDF
                    </a>
                    <a
                      href={judgment.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                    >
                      <ExternalLink size={14} /> Open
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !aiResult && judgments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚖️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search Pakistani Legal Database
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {activeTab === "ai" 
                ? "Ask legal questions and get AI-powered analysis with references to Pakistani statutes and case law."
                : activeTab === "keyword"
                ? "Search through Supreme Court judgments using keywords. Try 'bail', 'murder', or 'constitutional rights'."
                : "Ask questions in natural language and AI will find conceptually similar cases, even without exact keyword matches."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}