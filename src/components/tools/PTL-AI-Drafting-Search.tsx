"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Button from "../ui/Button";
import { loadSessions, saveSessions, Session, ChatMessage } from "@/lib/storage";

function nowIso(): string {
  return new Date().toISOString();
}

// Only "user" | "assistant" roles are stored in your storage.ChatMessage type
type StoredRole = "user" | "assistant";

function newMessage(role: StoredRole, content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, timestamp: nowIso() };
}

function createEmptySession(name?: string): Session {
  const id = crypto.randomUUID();
  const now = nowIso();
  const welcome: ChatMessage = newMessage(
    "assistant",
    "👋 Welcome to PTL • AI Drafting & Search — ask for drafting or legal research."
  );
  return {
    id,
    name: name ?? `PTL Session ${new Date().toLocaleString()}`,
    messages: [welcome],
    createdAt: now,
    updatedAt: now,
  } as Session;
}

export default function PTLAIDraftingSearch(): React.ReactElement {
  const [currentSession, setCurrentSession] = useState(() => {
    const saved = loadSessions();
    return (saved && saved[0]) ?? createEmptySession();
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastIntent, setLastIntent] = useState<"drafting" | "research" | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Persist only currentSession
  useEffect(() => {
    saveSessions([currentSession]);
  }, [currentSession]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [currentSession, isLoading]);

  const updateCurrentSession = (patch: Partial<Session> & { messages?: ChatMessage[] }): void => {
    const updated: Session = {
      ...currentSession,
      ...patch,
      messages: patch.messages ?? currentSession.messages,
      updatedAt: nowIso(),
    } as Session;
    setCurrentSession(updated);
  };

  const detectIntent = (text: string): "drafting" | "research" => {
    const lower = text.toLowerCase();
    const draftingKeywords = ["draft", "petition", "plaint", "notice", "agreement", "deed", "affidavit", "contract"];
    const researchKeywords = ["list", "section", "law", "explain", "meaning", "case", "procedure", "practice"];
    if (draftingKeywords.some((k) => lower.includes(k))) return "drafting";
    if (researchKeywords.some((k) => lower.includes(k))) return "research";
    return "research";
  };

  const exportCurrentSessionAsTxt = (): void => {
    const lines: string[] = [];
    const title = currentSession.name?.trim() || "PTL Session";
    lines.push(title);
    lines.push(`Created: ${new Date(currentSession.createdAt).toLocaleString()}`);
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push("");

    (currentSession.messages ?? []).forEach((msg) => {
      const who = msg.role === "user" ? "USER" : "ASSISTANT";
      lines.push(`${who} — ${new Date(msg.timestamp).toLocaleString()}`);
      lines.push("");
      lines.push(msg.content.replace(/\r\n/g, "\n").trim());
      lines.push("");
      lines.push("------------------------------------------------------------");
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (String(currentSession.name ?? "ptl-session").replace(/[^\w-_ ]+/g, "") || "ptl-session");
    a.download = `${safeName}_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const startNewSession = (): void => {
    const fresh = createEmptySession();
    setCurrentSession(fresh);
    setInput("");
    setLastIntent(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const intent = detectIntent(trimmed);
    setLastIntent(intent);

    const userMsg = newMessage("user", trimmed);
    const newMessages = [...(currentSession.messages ?? []), userMsg];
    updateCurrentSession({ messages: newMessages });

    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ptl-ai-drafting-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, intent }),
      });

      const data = (await res.json()) as { content?: string; error?: string };
      const assistantText = typeof data?.content === "string" ? data.content : data?.error ?? "⚠️ No response.";
      const assistantMsg = newMessage("assistant", assistantText);
      updateCurrentSession({ messages: [...newMessages, assistantMsg] });
    } catch (err) {
      console.error("PTL fetch error:", err);
      const errMsg = newMessage("assistant", "⚠️ Failed to connect to AI. Please try again.");
      updateCurrentSession({ messages: [...newMessages, errMsg] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = (): void => {
    updateCurrentSession({ messages: [] });
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white shadow-md gap-4 md:gap-0">
        <div>
          <h1 className="text-lg font-semibold">PTL • AI Drafting & Search</h1>
          <p className="text-sm text-gray-500">Drafting + Research — With legal references used in Pakistan</p>
        </div>
        <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto">
          <Button type="button" className="w-full sm:w-auto" onClick={startNewSession}>
            New Session
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={exportCurrentSessionAsTxt} disabled={!currentSession.messages?.length}>
            Export TXT
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div
          ref={chatRef}
          className="flex-1 p-4 overflow-y-auto bg-white rounded-b-lg shadow-inner mx-4 mt-4 min-h-[320px]"
        >
          {(currentSession.messages ?? []).length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Start the session — your chat window will appear here
            </div>
          ) : (
            (currentSession.messages ?? []).map((msg) => (
              <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm transition-all ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-900 rounded-tl-none"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
              </div>
            ))
          )}
          {isLoading && <div className="text-center text-gray-500 mt-3 animate-pulse">Processing your request…</div>}
        </div>

        <form onSubmit={handleSubmit} className="flex p-3 border-t bg-white shadow-sm gap-2 items-center mx-4">
          <input
            type="text"
            placeholder={
              lastIntent === "drafting"
                ? "Draft: e.g., 'Draft a plaint under Section 9 CPC'..."
                : "Search: e.g., 'Most used sections in Pakistan courts'..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-400 outline-none"
            aria-label="Enter your legal query"
          />
          <Button type="submit" isLoading={isLoading} disabled={!input.trim()}>
            Send
          </Button>
        </form>
      </main>
    </div>
  );
}
