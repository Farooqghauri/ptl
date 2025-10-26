"use client";

import React, { useState } from "react";

export default function CaseFinder() {
  const [query, setQuery] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!query.trim()) return alert("Please enter a section number or topic.");

    setIsLoading(true);
    try {
      const res = await fetch("/api/casesearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setResponse(data.content);
    } catch (err) {
      console.error(err);
      alert("Error fetching case results.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm h-full overflow-auto">
      <h2 className="text-xl font-semibold text-[#0A2342] mb-3">⚖️ Case Finder</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter section numbers or legal topics to get summaries of relevant Pakistani judgments.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Section 302 PPC or Contract Act 1872"
          className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-[#0A2342]"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-[#FACC15] text-[#0A2342] px-4 py-2 rounded hover:bg-yellow-400 disabled:opacity-50"
        >
          {isLoading ? "Searching..." : "Find Cases"}
        </button>
      </div>

      {response && (
        <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap leading-relaxed">
          {response}
        </div>
      )}
    </div>
  );
}
