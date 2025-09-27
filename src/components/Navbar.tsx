"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center">
  <Link href="/" aria-label="Go to Home">
    <Image
      src="/loggo.png"
      alt="Company Logo"
      width={40}
      height={40}
      priority
      className="cursor-pointer"
    />
  </Link>
</div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-4 text-sm font-bold text-blue-900">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className="px-3 py-2 rounded-md transition-all duration-300 hover:bg-blue-900 hover:text-white"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth Section */}
        <div className="hidden md:flex space-x-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 border border-blue-900 text-blue-900 rounded-md hover:bg-blue-900 hover:text-white transition"
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-blue-900 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <ul className="flex flex-col p-4 space-y-2 text-blue-900 font-semibold">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className="block px-3 py-2 rounded-md hover:bg-blue-900 hover:text-white transition"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col space-y-2 px-4 pb-4">
            <SignedOut>
              <Link
                href="/sign-in"
                className="px-4 py-2 bg-blue-900 text-white rounded-md text-center"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 border border-blue-900 text-blue-900 rounded-md text-center"
              >
                Sign Up
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}
