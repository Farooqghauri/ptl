"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { ToolKey } from "@/components/Sidebar";

// ✅ Tool imports
import AILegalDrafting from "@/components/tools/AILegalDrafting";
import AIResearchRAG from "@/components/tools/AIResearchRAG";
import CaseSummary from "@/components/tools/CaseSummary";
import UrduLegalTranslator from "@/components/tools/UrduLegalTranslator";
import ClientChatbot from "@/components/tools/ClientChatbot";
import ReminderTaskManager from "@/components/tools/ReminderTaskManager";
import FeeEstimator from "@/components/tools/FeeEstimator";
import LegalOpinionAnalyzer from "@/components/tools/LegalOpinionAnalyzer";
import DocumentChecker from "@/components/tools/DocumentChecker";

const toolComponents: Record<ToolKey, React.ComponentType> = {
  "ai-legal-drafting": AILegalDrafting,
  "ai-research-rag": AIResearchRAG,
  "case-summary": CaseSummary,
  "urdu-legal-translator": UrduLegalTranslator,
  "client-chatbot": ClientChatbot,
  "reminder-task-manager": ReminderTaskManager,
  "fee-estimator": FeeEstimator,
  "legal-opinion-analyzer": LegalOpinionAnalyzer,
  "document-checker": DocumentChecker,
};

export default function AIToolsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [selectedTool, setSelectedTool] = useState<ToolKey>("ai-legal-drafting");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const CurrentToolComponent = toolComponents[selectedTool];

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Sidebar (always on left) */}
      <Sidebar
        expand={sidebarExpanded}
        setExpand={setSidebarExpanded}
        selected={selectedTool}
        onSelect={setSelectedTool}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 overflow-y-auto ${
          isMobile ? "ml-20" : sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <div className="h-full p-4 md:p-8 bg-white shadow-inner rounded-tl-3xl">
          {CurrentToolComponent ? (
            <CurrentToolComponent />
          ) : (
            <p className="text-center text-gray-600 mt-20">
              Select an AI tool from the sidebar to begin.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
