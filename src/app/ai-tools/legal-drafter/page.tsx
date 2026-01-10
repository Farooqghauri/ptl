"use client";

import { useState } from "react";
import { 
  Scale, 
  PenTool, 
  Download, 
  Copy, 
  CheckCircle, 
  FileText,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import ToolHeader from "@/components/ToolHeader";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import "../../../styles/dark-theme.css"; // ensure path depth is correct

export default function LegalDrafter() {
  const [category, setCategory] = useState("Bail Petition");
  const [facts, setFacts] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const categories = [
    "Bail Petition (Post-Arrest)",
    "Bail Petition (Pre-Arrest)",
    "Legal Notice",
    "Suit for Recovery",
    "Divorce Deed (Talaq-nama)",
    "Rent Agreement",
    "Stay Application",
    "Writ Petition"
  ];

  const handleDraft = async () => {
    if (!facts.trim()) return;
    setLoading(true);
    setDraft("");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, facts }),
      });
      const data = await response.json();
      if (data.draft) setDraft(data.draft);
    } catch (error) {
      console.error("Drafting failed:", error);
      setDraft("Error: Could not connect to the drafting server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWord = () => {
    const paragraphs = draft.split('\n').map((line) => {
      const isHeading = line.trim() === line.trim().toUpperCase() && line.trim().length > 5;
      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 24,
            font: "Times New Roman",
            bold: isHeading,
          }),
        ],
        spacing: { after: 120 },
        alignment: isHeading ? AlignmentType.CENTER : AlignmentType.LEFT,
      });
    });
    const doc = new Document({ sections: [{ children: paragraphs }] });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${category.replace(/\s+/g, '_')}_Draft.docx`);
    });
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">

            <ToolHeader
              title="Legal Drafter"
              description="Generate professional legal documents with AI assistance."
              steps={[
                { step: "Select Document Type", description: "Choose from Bail Petition, Divorce, Writ, etc." },
                { step: "Enter Case Details", description: "Describe your case facts in the text box" },
                { step: "Generate Draft", description: "Click Generate and AI will create your document" },
                { step: "Download", description: "Save as Word or PDF format" },
              ]}
            />

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4 shadow-lg">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">AI Legal Drafter</h1>
              <p className="text-gray-600 dark:text-gray-400">Generate professional petitions, notices, and suits in seconds.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Input Section */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-purple-100 dark:border-gray-800 h-fit">
                {/* Category Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Document Type</label>
                  <div className="relative">
                    <select 
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 dark:text-gray-200 font-medium"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {/* Facts Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Case Facts & Details</label>
                  <textarea
                    className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-gray-700 dark:text-gray-200"
                    placeholder="e.g. My client (Ali Khan) was arrested on 10th Jan. FIR No. 123/24 at Station Gulberg..."
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">Be specific for better results.</p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleDraft}
                  disabled={loading || !facts}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg
                    ${loading || !facts 
                      ? "bg-purple-300 cursor-not-allowed" 
                      : "bg-purple-600 hover:bg-purple-700 hover:shadow-xl hover:scale-[1.02]"
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Drafting Document...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      Generate Draft
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT: Output Section */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-purple-100 dark:border-gray-800 flex flex-col h-[700px]">
                {/* Output Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Preview</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900 rounded-lg text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
                      title="Copy Text"
                    >
                      {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={handleDownloadWord}
                      disabled={!draft}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
                      title="Download Word Doc"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Output Area */}
                <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900 rounded-b-2xl font-serif leading-relaxed text-gray-800 dark:text-gray-200">
                  {draft ? (
                    <div className="whitespace-pre-wrap">{draft}</div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-500">
                      <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                      <p>Your legal draft will appear here</p>
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
