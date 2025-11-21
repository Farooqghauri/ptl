"use client";

import React, { useState } from "react";
// Import the components for the two desired tools
import PTLAIDraftingSearch from "@/components/tools/PTL-AI-Drafting-Search";
import EnglishToUrdu from "@/components/tools/EnglishToUrdu"; 

// Import icons
import { Layers, Globe } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

// Define the two desired tool keys
type Tool = "combined" | "urdu-english";

export default function AIToolsPage(): React.ReactElement {
  const [activeTool, setActiveTool] = useState<Tool>("combined");

  // Key to force remount/reset state when switching tools
  const [toolKey, setToolKey] = useState<number>(Date.now());

  const handleTabClick = (key: Tool) => {
    setActiveTool(key);
    setToolKey(Date.now()); // Reset chat/tool state
  };

  const renderTool = (): React.ReactElement | null => {
    switch (activeTool) {
      case "combined":
        return <PTLAIDraftingSearch key={toolKey} />;
      case "urdu-english":
        // Ensure this component exists in your tools directory!
        return <EnglishToUrdu key={toolKey} />;
      default:
        return null;
    }
  };

  const tabs: { key: Tool; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: "combined",
      label: "AI Drafting + Search",
      icon: <Layers className="h-5 w-5" />,
      desc: "Unified AI for Legal Drafting & Research.",
    },
    {
      key: "urdu-english",
      label: "Urdu/English Translation",
      icon: <Globe className="h-5 w-5" />,
      desc: "Translate legal terms, documents, and concepts between English and Urdu.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="py-6 shadow-sm bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            ⚖️ PTL AI Legal Suite
          </h1>

          {/* Tabs */}
          <nav className="flex flex-wrap gap-3 justify-center">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-transparent",
                  activeTool === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-500 hover:bg-slate-100"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </header>

      {/* Tool Description */}
      <div className="max-w-4xl mx-auto mt-4 px-6 text-center text-gray-600 text-sm">
        {tabs.find((t) => t.key === activeTool)?.desc}
      </div>

      {/* Tool Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <motion.div
          key={activeTool}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl shadow-sm bg-white/90 border border-slate-200 p-4 md:p-6"
        >
          {renderTool()}
        </motion.div>
      </main>
    </div>
  );
}