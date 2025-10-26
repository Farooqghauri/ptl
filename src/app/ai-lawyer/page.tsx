"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
};

export default function AILawyerPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      role: "system",
      content:
        "👋 Welcome to PTL Legal Assistant — your AI lawyer specialized in Pakistani law. Ask me any legal question.",
    },
  ]);
  const chatRef = useRef<HTMLDivElement | null>(null);

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
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: String(data?.content ?? ""),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "⚠️ Sorry, I couldn't get a response. Try again later.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-indigo-700 text-center mb-4">
          ⚖️ PTL Legal Assistant
        </h1>

        {/* Chat Window */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto border rounded p-3 bg-gray-100 space-y-3 h-[400px]"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-md ${
                m.role === "user"
                  ? "bg-indigo-100 text-right"
                  : m.role === "system"
                  ? "bg-gray-200 text-center italic text-gray-700"
                  : "bg-green-100 text-left"
              }`}
            >
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="text-gray-500 text-sm italic">Typing...</div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rent laws, FIR, or agreements..."
            className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
