"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";

export type ToolKey =
  | "ai-legal-drafting"
  | "ai-research-rag"
  | "case-summary"
  | "urdu-legal-translator"
  | "client-chatbot"
  | "reminder-task-manager"
  | "fee-estimator"
  | "legal-opinion-analyzer"
  | "document-checker";

interface SidebarProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  selected: ToolKey;
  onSelect: (key: ToolKey) => void;
}

const items: { key: ToolKey; label: string; icon: string }[] = [
  { key: "ai-legal-drafting", label: "AI Legal Drafting", icon: assets.ai_draft_icon },
  { key: "ai-research-rag", label: "AI Research (RAG)", icon: assets.ai_research_icon },
  { key: "case-summary", label: "Case Summary", icon: assets.ai_case_icon },
  { key: "urdu-legal-translator", label: "Urdu Translator", icon: assets.ai_draft_icon },
  { key: "client-chatbot", label: "Client Chatbot", icon: assets.ai_chatbot_icon },
  { key: "reminder-task-manager", label: "Reminders / Tasks", icon: assets.bell_icon },
  { key: "fee-estimator", label: "Fee Estimator", icon: assets.ai_contract_icon },
  { key: "legal-opinion-analyzer", label: "Legal Opinion Analyzer", icon: assets.ai_compliance_icon },
  { key: "document-checker", label: "Document Checker", icon: assets.ai_draft_icon },
];

export default function Sidebar({ expand, setExpand, selected, onSelect }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      className={`flex flex-col justify-between bg-white border-r-4 border-black text-[#0A2342] pt-4 transition-all duration-300 z-40
        ${isMobile ? "w-20 px-2" : expand ? "w-64 px-4" : "w-20 px-2"} shrink-0 h-screen fixed left-0 top-0`}
    >
      {/* Header */}
      <div>
        <div className={`flex items-center gap-3 ${expand && !isMobile ? "justify-between" : "flex-col"}`}>
          <Image
            src={expand && !isMobile ? assets.ptl_logo_text : assets.ptl_logo_icon}
            alt="PTL"
            width={expand && !isMobile ? 140 : 36}
            height={36}
            priority
          />

          {/* Collapse toggle (hidden on mobile) */}
          {!isMobile && (
            <button
              aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => setExpand(!expand)}
              className="p-2 rounded-md hover:bg-[#0A2342]/10 transition"
              type="button"
            >
              <Image
                src={expand ? assets.sidebar_close_icon : assets.sidebar_icon}
                alt="toggle"
                width={20}
                height={20}
              />
            </button>
          )}
        </div>

        <div className="mt-6 border-t-2 border-black pt-4" />

        {/* Tool List */}
        <nav className="mt-4 flex flex-col gap-2" aria-label="AI tools">
          {items.map((it) => {
            const active = selected === it.key;
            return (
              <button
                key={it.key}
                onClick={() => onSelect(it.key)}
                title={it.label}
                className={`flex items-center gap-3 w-full py-2 px-2 rounded-lg transition text-sm font-medium
                  ${active ? "bg-[#0A2342]/10 border-l-4 border-[#0A2342]" : "hover:bg-[#0A2342]/5"}`}
                type="button"
              >
                <Image src={it.icon} alt={it.label} width={24} height={24} />
                {expand && !isMobile && <span>{it.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-4 mb-6 border-t-2 border-black pt-4 flex flex-col gap-2">
        <button
          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#0A2342]/5 transition text-sm font-medium"
          type="button"
          title="Settings"
        >
          <Image src={assets.settings_icon} alt="Settings" width={20} height={20} />
          {expand && !isMobile && <span>Settings</span>}
        </button>

        <button
          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#0A2342]/5 transition text-sm font-medium"
          type="button"
          title="Logout"
        >
          <Image src={assets.logout_icon} alt="Logout" width={20} height={20} />
          {expand && !isMobile && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
