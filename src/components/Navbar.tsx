"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="bg-white">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        
          <Image
          src="/loggo.PNG"   // path relative to /public
            alt="Company Logo"
            width={30}        // set dimensions
            height={30}
            priority          // preload for faster loading
          />
       

        {/* Menu */}
        <ul className="flex space-x-4 text-sm font-bold text-blue-900">
          {[
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
            { name: "Services", path: "/services" },
            { name: "Contact", path: "/contact" },
          ].map((item) => (
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
      </nav>
    </header>
  );
}
