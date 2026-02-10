"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Trash2 } from "lucide-react";
import "../../../styles/dark-theme.css";
import { API_BASE_URL } from "@/lib/constants";

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function LegalAssistant() {
  const API_BASE = API_BASE_URL;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! I am PTL AI. Ask me any question about Pakistani Law (PPC, CrPC, Family Law, etc.)." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/assistant-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "Error: Could not connect to PTL Server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh] border border-gray-200">
        
        {/* Header */}
        <div className="bg-blue-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Legal Research Assistant</h1>
              <p className="text-blue-200 text-xs">Powered by Pakistani Law (PPC/CrPC)</p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ role: "bot", content: "Chat cleared. How can I help?" }])}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                ${msg.role === "user" ? "bg-blue-600" : "bg-emerald-600"}`}>
                {msg.role === "user" ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm whitespace-pre-wrap leading-relaxed
                ${msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none flex gap-2 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a legal question (e.g., 'What is the procedure for Khula?')"
              className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input || loading}
              className={`p-4 rounded-xl transition-all shadow-md flex items-center justify-center
                ${!input || loading 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95"}`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            AI can make mistakes. Please verify important legal clauses.
          </p>
        </div>

      </div>
    </div>
  );
}
