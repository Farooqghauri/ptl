"use client";

import React, { useState } from "react";
import Sidebar, { ToolKey } from "@/components/Sidebar";
import AILegalDrafting from "@/components/tools/AILegalDrafting";
import DocumentSummarizer from "@/components/tools/DocumentSummarizer";
import AIResearchRAG from "@/components/tools/AIResearchRAG";
import { useUser, UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [selected, setSelected] = useState<ToolKey>("ai-legal-drafting");
  const { user } = useUser();

  const renderTool = (): React.ReactNode => {
    switch (selected) {
      case "ai-legal-drafting":
        return <AILegalDrafting />;
      case "ai-research-rag":
        return <AIResearchRAG />;
      case "case-summary":
        return <DocumentSummarizer />;
      default:
        return <AILegalDrafting />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F9FB]">
      <Sidebar
        expand={expanded}
        setExpand={setExpanded}
        selected={selected}
        onSelect={(k) => setSelected(k)}
      />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2342]">
              AI For Pakistan’s Lawyers
            </h1>
            <p className="text-sm text-gray-600">
              Welcome back, {user?.firstName ?? "Lawyer"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-600">
              PTL • Secure Platform
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>

        <section className="h-[calc(100vh-120px)]">{renderTool()}</section>
      </main>
    </div>
  );
}
