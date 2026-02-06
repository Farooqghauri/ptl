"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Scale } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  path: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menuItems: MenuItem[] = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-slate-800"
          : "bg-slate-950 border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Go to Home" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="block text-lg font-bold bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent">
                Pakistan&apos;s Top Lawyers
              </span>
              <span className="block text-xs text-slate-400 font-medium -mt-0.5">
                AI-Powered Legal Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {menuItems.map((item: MenuItem) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-5 py-2.5 text-slate-200 font-medium hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 ring-2 ring-blue-500/20",
                },
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Right Section */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Hamburger */}
          <button
            className="p-2 rounded-lg bg-slate-800 text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={() => setIsOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      <div
        id="mobile-menu"
        className={`lg:hidden border-t border-slate-800 bg-slate-950 overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col p-4 gap-1">
          {menuItems.map((item: MenuItem) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-200 hover:bg-slate-800"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-3 text-center text-slate-200 font-medium border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-center font-medium shadow-lg"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <div className="flex justify-center pt-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
