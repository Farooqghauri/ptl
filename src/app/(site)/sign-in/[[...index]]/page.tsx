// src/app/sign-in/page.tsx
"use client";

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import React from "react";
import { assets } from "@/assets/assets";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A2342] to-[#072844] p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left branding */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#0A2342] to-[#07305a] text-white">
          <div className="flex items-center gap-3">
            <Image src={assets.ptl_logo_icon} alt="PTL" width={48} height={48} />
            <div>
              <h1 className="text-2xl font-bold">Pakistan Top Lawyers</h1>
              <p className="text-sm text-[#FCEFC3] mt-1">AI for legal professionals • Secure • Private</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Modern legal workflows</h2>
            <p className="mt-3 text-sm text-[#DDECF9] leading-relaxed">
              Draft documents, review contracts, and run legal research powered by AI — in a secure environment.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#FACC15] text-[#0A2342] font-semibold">✓</span>
                <span>Confidential by design</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#FACC15] text-[#0A2342] font-semibold">✓</span>
                <span>Specialized legal templates</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 text-xs text-[#cfe7ff]">
            © {new Date().getFullYear()} Pakistan Top Lawyers
          </div>
        </div>

        {/* Clerk sign-in */}
        <div className="p-8 md:p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h3 className="text-2xl font-semibold text-[#0A2342] mb-3">Sign in to PTL</h3>
            <p className="text-sm text-gray-500 mb-6">Use your firm account or create a new account.</p>

            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#0A2342",
                  colorText: "#111827",
                },
                elements: {
                  formButtonPrimary:
                    "bg-[#FACC15] hover:bg-[#e6b70a] text-[#0A2342] font-medium py-2 px-4 rounded-lg transition",
                  card: "shadow-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  rootBox: "w-full",
                },
              }}
              redirectUrl="/dashboard"
            />

            <div className="mt-4 text-center text-xs text-gray-400">
              By signing in you agree to PTL`&aposs terms and privacy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
