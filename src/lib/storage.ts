// lib/storage.ts

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const STORAGE_KEY = "ptl_chats_v2";

/**
 * Load all saved sessions from localStorage.
 */
export function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Session[];
    // ensure messages array exists
    return parsed.map(s => ({ ...s, messages: s.messages ?? [] }));
  } catch (err) {
    console.error("Failed to load sessions:", err);
    return [];
  }
}

/**
 * Save all sessions to localStorage.
 */
export function saveSessions(sessions: Session[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save sessions:", err);
  }
}
