"use client";

import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useState } from "react";

interface Step {
  step: string;
  description: string;
}

interface ToolHeaderProps {
  title: string;
  description: string;
  steps: Step[];
}

export default function ToolHeader({ title, description, steps }: ToolHeaderProps) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="mb-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <HelpCircle className="w-4 h-4" />
          How to Use
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-gray-600">{description}</p>

      {/* User Guide (Collapsible) */}
      {showGuide && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-3">📖 How to Use</h3>
          <ol className="space-y-2">
            {steps.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <span className="font-medium text-gray-900">{item.step}</span>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}