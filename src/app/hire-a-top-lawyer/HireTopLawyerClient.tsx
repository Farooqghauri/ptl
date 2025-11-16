"use client";

// FINAL — LOTTIE USING EXTERNAL JSON (fetch from /public) — SAME PATTERN AS AboutAnimation.jsx
// PAGE: Hire a Top Lawyer — PTL

import type { Metadata } from "next";
import Image from "next/image";
import { useState, useEffect } from "react";
import Lottie from "lottie-react";

// ========================= TYPES =========================
interface Lawyer {
  _id: string;
  name: string;
  specialization: string;
  city: string;
  experience: number;
  rating: number;
  avatar: string;
}

// Temporary empty — real data will come from backend
const lawyers: Lawyer[] = [];

// ========================= LOTTIE COMPONENT =========================
function HireLawyerAnimation() {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/HireLawyerAnimation.json")
      .then((res) => res.json())
      .then(setAnimationData);
  }, []);

  if (!animationData) return null;

  return (
    <div className="w-full h-full">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// ========================= MAIN PAGE =========================
export default function HireTopLawyerClient() {
  const [query, setQuery] = useState<string>("");

  const filtered = lawyers.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.specialization.toLowerCase().includes(query.toLowerCase()) ||
    l.city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-gray-900">
      {/* ================= HERO SECTION ================= */}
      <section className="grid md:grid-cols-2 gap-10 items-center mb-20">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 leading-tight">
            Hire a Top Lawyer in Pakistan
          </h1>

          <p className="mt-4 text-lg text-gray-700 max-w-xl leading-relaxed">
            PTL connects you with
            <span className="font-semibold text-blue-800">
              {" "}verified, highly experienced lawyers
            </span>
            {" "}for Civil, Criminal, Family, Corporate, Property, Tax, and High Court matters.
            Get expert legal help instantly anywhere in Pakistan.
          </p>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Search by lawyer name, city, or specialization..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-96 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* ================= LOTTIE ANIMATION ================= */}
        <div className="flex justify-center items-center w-full">
          <div className="w-full max-w-xl h-[250px] md:h-[350px] rounded-3xl overflow-hidden bg-white shadow-lg">
            <HireLawyerAnimation />
          </div>
        </div>
      </section>

      {/* ================= LISTING SECTION ================= */}
      <section className="mb-20">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 text-lg py-16">
            No lawyers found yet. Real profiles will auto-load from PTL database.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filtered.map((lawyer) => (
              <div
                key={lawyer._id}
                className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition bg-white"
              >
                <Image
                  src={lawyer.avatar}
                  alt={lawyer.name}
                  width={400}
                  height={400}
                  className="w-full h-56 object-cover rounded-xl"
                />

                <h3 className="text-xl font-bold mt-3">{lawyer.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{lawyer.specialization}</p>
                <p className="text-sm text-gray-400">{lawyer.city}</p>

                <div className="mt-3 text-sm text-gray-700">
                  Experience: {lawyer.experience} years
                </div>

                <div className="mt-1 text-sm font-semibold text-blue-700">
                  ⭐ {lawyer.rating.toFixed(1)} / 5
                </div>

                <button className="mt-4 w-full py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= SEO FOOTER ================= */}
      <footer className="py-10 text-center border-t bg-gray-50 text-sm text-gray-500">
        <div className="max-w-4xl mx-auto text-[12px] text-gray-500 leading-relaxed">
          Hire Lawyer Pakistan · Best Lawyers Pakistan · Legal Services · Civil Attorney · Criminal Defense · Family Law ·
          Corporate Lawyer · Property Disputes · High Court Lawyer · Supreme Court Lawyer · Verified Attorneys Pakistan ·
          Divorce Lawyer · Bail Lawyer · Cyber Crime Lawyer · Immigration Lawyer · Legal Consultation · Case Filing Expert ·
          Law Firm Pakistan · Professional Advocates · Litigation Specialist
        </div>

        <p className="mt-4">© {new Date().getFullYear()} PTL — Pakistan’s Trusted Legal Platform</p>
      </footer>
    </main>
  );
}
