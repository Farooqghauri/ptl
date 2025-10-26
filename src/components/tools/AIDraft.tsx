
"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

export default function AIDraft() {
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // ✅ Load saved chat from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ptl-legal-chat");
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "sys-1",
              role: "system",
              content:
                "👋 Welcome to PTL Legal Assistant — Ask your questions related to Pakistani law only.",
            },
          ];
    }
    return [];
  });

  const chatRef = useRef<HTMLDivElement | null>(null);

  // ✅ Scroll to bottom whenever messages update
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    // ✅ Save chat to localStorage
    localStorage.setItem("ptl-legal-chat", JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Request failed");

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data?.content || "⚠️ No response from AI.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "⚠️ Sorry, I couldn’t get a response. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-[#0A2342] mb-4">
        ⚖️ PTL Legal Assistant
      </h2>

      {/* ✅ Scrollable chat area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto border rounded p-3 bg-gray-50 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        style={{ maxHeight: "70vh" }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-md whitespace-pre-wrap break-words ${
              m.role === "user"
                ? "bg-[#FACC15]/30 text-right"
                : m.role === "system"
                ? "bg-gray-200 text-center italic text-gray-700"
                : "bg-green-100 text-left"
            }`}
          >
            {/* ✅ Formatted markdown output */}
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500 text-sm italic">Typing...</div>
        )}
      </div>

      {/* ✅ Input Area */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about rent laws, FIR, or agreements..."
          className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-[#0A2342]"
        />
        <button
          type="submit"
          className="bg-[#0A2342] hover:bg-[#132f56] text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}