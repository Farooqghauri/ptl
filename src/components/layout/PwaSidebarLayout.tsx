"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Scale,
  Languages,
  Search,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home, color: "#3B82F6" },
  { name: "Case Summarizer", href: "/ai-tools/case-summarizer", icon: FileText, color: "#8B5CF6" },
  { name: "Legal Drafter", href: "/ai-tools/legal-drafter", icon: Scale, color: "#E85D2A" },
  { name: "Legal Translator", href: "/ai-tools/legal-translator", icon: Languages, color: "#10B981" },
  { name: "Legal Research", href: "/ai-tools/research", icon: Search, color: "#F59E0B" },
];

export default function PwaSidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gray-950">
      
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-72 md:w-64
          bg-gray-900 
          border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E85D2A] to-[#B84A21] rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">PTL</h1>
                <p className="text-xs text-gray-400">Legal Suite</p>
              </div>
            </Link>
            
            {/* Close button - Mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Tools
          </p>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-[#E85D2A] text-white shadow-lg shadow-[#E85D2A]/25" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                  ${isActive 
                    ? "bg-white/20" 
                    : "bg-gray-800"
                  }
                `}>
                  <Icon className="w-5 h-5" style={{ color: isActive ? "white" : item.color }} />
                </div>
                <span className="font-medium flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {/* Home Link */}
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
              <Home className="w-5 h-5 text-gray-500" />
            </div>
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Bar - Mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E85D2A] to-[#B84A21] rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">PTL</span>
            </Link>

            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}