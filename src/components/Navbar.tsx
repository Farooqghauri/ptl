"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
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
    { name: "AI Tools", path: "/ai-tools" },
    { name: "Top Lawyers", path: "/top-lawyers" },
    { name: "Hire A Top Lawyer", path: "/hire-a-top-lawyer" },
    { name: "Contact", path: "/contact" },

  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur shadow-sm" : "bg-white"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Go to Home" className="flex items-center gap-2">
            <Image
              src="/loggo.png"
              alt="PTL Logo"
              width={40}
              height={40}
              priority
              className="rounded-sm"
            />
            <span className="hidden sm:inline text-blue-900 font-extrabold tracking-tight">
              Pakistan&apos;s Top Lawyers
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-1 text-sm font-semibold text-blue-900">
          {menuItems.map((item: MenuItem) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-2 rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    isActive
                      ? "bg-blue-900 text-white"
                      : "hover:bg-blue-900 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Auth / CTA */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 border border-blue-900 text-blue-900 rounded-md hover:bg-blue-900 hover:text-white transition-colors"
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/add-lawyer"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Lawyers Registration
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-blue-900 p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-gray-200 overflow-hidden transition-[max-height] duration-300 ${
          isOpen ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col p-4 gap-1 text-blue-900 font-semibold">
          {menuItems.map((item: MenuItem) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-900 text-white"
                      : "hover:bg-blue-900 hover:text-white"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 bg-blue-900 text-white rounded-md text-center"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 border border-blue-900 text-blue-900 rounded-md text-center"
              onClick={() => setIsOpen(false)}
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/add-lawyer"
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-center"
              onClick={() => setIsOpen(false)}
            >
              Add Lawyer
            </Link>
            <div className="flex justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
