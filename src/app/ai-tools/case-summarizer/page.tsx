"use client";

import { useState } from "react";
import { FileText, Sparkles, Copy, CheckCircle } from "lucide-react";
import ToolHeader from "@/components/ToolHeader";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import "../../../styles/dark-theme.css"; // keep dark theme import

export default function LegalSummarizer() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSummary("");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.summary) setSummary(data.summary);
    } catch (error) {
      console.error("Summarization failed:", error);
      setSummary("Error: Could not connect to the summarizer server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SignedIn>
        {/* Dark theme logic applied only to wrappers */}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">

            <ToolHeader
              title="Legal Summarizer"
              description="Summarize lengthy case documents into concise points."
              steps={[
                { step: "Paste Text", description: "Insert your case or document text" },
                { step: "Generate Summary", description: "Click Summarize to condense the content" },
                { step: "Copy or Save", description: "Use the summary in your workflow" },
              ]}
            />

            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Input Section */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 h-fit">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Paste Text</label>
                <textarea
                  className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-gray-700 dark:text-gray-200"
                  placeholder="Paste your legal text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  onClick={handleSummarize}
                  disabled={loading || !text}
                  className={`mt-4 w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg
                    ${loading || !text 
                      ? "bg-purple-300 cursor-not-allowed" 
                      : "bg-purple-600 hover:bg-purple-700 hover:shadow-xl hover:scale-[1.02]"
                    }`}
                >
                  {loading ? "Summarizing..." : "Generate Summary"}
                </button>
              </div>

              {/* RIGHT: Output Section */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[700px]">
                {/* Output Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Summary</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900 rounded-lg text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
                    title="Copy Summary"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                {/* Output Area */}
                <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900 rounded-b-2xl font-serif leading-relaxed text-gray-800 dark:text-gray-200">
                  {summary ? (
                    <div className="whitespace-pre-wrap">{summary}</div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-500">
                      <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                      <p>Your summary will appear here</p>
                    </div>
                  )}
                </div>
              </div>
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
