"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";

export default function ChatSidebar() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const createSession = () => {
    const newSession = `Chat ${sessions.length + 1}`;
    setSessions((prev) => [...prev, newSession]);
    setSelected(newSession);
  };

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-[#0A2342] text-white p-3 rounded-full shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 right-0 z-40 h-full w-64 bg-white shadow-lg border-l transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-semibold text-[#0A2342]">Chat Sessions</h3>
          <button
            onClick={createSession}
            className="bg-[#0A2342] text-white px-2 py-1 rounded text-sm"
          >
            +
          </button>
        </div>

        <div className="p-3 overflow-y-auto h-[calc(100%-60px)]">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No saved sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li
                  key={s}
                  onClick={() => setSelected(s)}
                  className={`p-2 rounded cursor-pointer ${
                    selected === s
                      ? "bg-[#0A2342] text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
