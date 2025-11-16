"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  {
    name: "AI Legal Drafting",
    href: "/tools/AILegalDrafting",
    icon: FileText,
  },
  {
    name: "AI Legal Search",
    href: "/tools/AIResearchRAG",
    icon: Search,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-blue-700 text-white shadow-lg flex flex-col">
      {/* 🔹 Logo Section */}
      <div className="p-5 border-b border-blue-500 text-center">
        <h1 className="text-2xl font-bold tracking-wide">PTL AI</h1>
        <p className="text-xs text-blue-100 mt-1">Legal Intelligence Suite</p>
      </div>

      {/* 🔹 Navigation */}
      <nav className="flex-1 overflow-y-auto mt-4">
        <ul className="space-y-1">
          {tools.map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-inner"
                      : "text-blue-100 hover:bg-blue-600 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 🔹 Footer */}
      <div className="p-4 border-t border-blue-600 text-xs text-blue-200 text-center">
        © {new Date().getFullYear()} PTL Legal AI
      </div>
    </aside>
  );
}
