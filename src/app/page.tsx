"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

// ✅ Load Lottie Player only in browser (no SSR)
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* HERO WITH ANIMATION + SEARCH */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="text-left">
            <h1 className="mt-6 text-3xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Your Trusted Pakistani Lawyers
            </h1>
            <p className="mt-4 text-gray-700 text-lg max-w-2xl">
              Find verified lawyers across Pakistan for family, criminal, property, and corporate law.
            </p>

            {/* Search Bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                placeholder="Enter city"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3"
              />
              <input
                placeholder="Enter service"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3"
              />
              <button className="bg-blue-900 text-white px-5 py-3 rounded-lg hover:bg-blue-800 transition">
                Search
              </button>
            </div>
          </div>

          {/* Animation */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-72 h-72">
              <Player autoplay loop src="/law-scale.json" style={{ height: "100%", width: "100%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* NEW GRADIENT SECTION BELOW ANIMATION */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Trusted Pakistani Lawyers for Nationals Abroad
          </h2>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto">
            Pakistan&#39;s Top Lawyers (PTL) connects overseas Pakistanis with the best
            legal experts in Pakistan. Whether you need a <strong>property lawyer</strong>,
            <strong> family lawyer</strong>, or <strong>criminal defense attorney</strong>,
            we ensure your case is handled professionally, transparently, and on time.
          </p>
          <button className="mt-6 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition-all duration-300">
            Get Started
          </button>
        </div>
      </section>

      {/* SERVICES INTRO */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900">Our Services</h2>
        <p className="mt-2 text-gray-700">
          Explore legal services tailored to your needs — from family disputes to corporate contracts.
        </p>
      </section>

      {/* FEATURED SERVICES GRID */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Family & Divorce Lawyers",
              desc: "Trusted lawyers for divorce, custody, and family disputes.",
              href: "/services/family-law",
            },
            {
              title: "Criminal Defense Lawyers",
              desc: "Expert legal defense for criminal cases across Pakistan.",
              href: "/services/criminal-law",
            },
            {
              title: "Property & Real Estate Lawyers",
              desc: "Secure property transactions and dispute resolution.",
              href: "/services/property-law",
            },
            {
              title: "Corporate & Business Lawyers",
              desc: "Professional guidance for contracts, compliance, and disputes.",
              href: "/services/corporate-law",
            },
            {
              title: "Immigration & Overseas Matters",
              desc: "Helping overseas Pakistanis with immigration and NOC issues.",
              href: "/services/immigration-law",
            },
            {
              title: "Civil & Contract Lawyers",
              desc: "Resolve civil disputes and contract enforcement professionally.",
              href: "/services/civil-law",
            },
          ].map((service) => (
            <article
              key={service.title}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
            >
              <h3 className="text-xl font-semibold text-blue-900">
                {service.title}
              </h3>
              <p className="text-gray-600 mt-2">{service.desc}</p>
              <Link
                href={service.href}
                className="inline-block mt-4 text-blue-900 font-medium hover:underline"
              >
                Learn More →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gray-100 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">Why Clients Trust PTL</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            We have helped thousands of clients in Pakistan and abroad with legal
            issues ranging from family disputes to property settlements.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Ahmed Khan",
                feedback:
                  "PTL connected me with the best property lawyer in Lahore. My case was resolved faster than I expected!",
              },
              {
                name: "Sarah Ali",
                feedback:
                  "I live in Dubai, and PTL made it easy to hire a family lawyer in Karachi. Excellent service and communication.",
              },
              {
                name: "Bilal Hussain",
                feedback:
                  "Professional, transparent, and reliable. Highly recommend PTL for anyone seeking legal help in Pakistan.",
              },
            ].map((t, i) => (
              <article
                key={i}
                className="bg-white shadow-md rounded-lg p-6 text-left hover:shadow-lg transition"
              >
                <p className="text-gray-700 italic">&quot;{t.feedback}&quot;</p>
                <h4 className="mt-4 font-semibold text-blue-900">- {t.name}</h4>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-blue-900 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Need Legal Help in Pakistan?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Our verified lawyers are ready to assist you with family, property,
            criminal, and corporate matters. Get expert legal advice today.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Contact Us
            </Link>
            <Link
              href="/services"
              className="bg-transparent border border-white px-6 py-3 rounded-lg hover:bg-blue-800 transition"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
