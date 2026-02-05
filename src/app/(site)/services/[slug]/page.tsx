// app/services/[slug]/page.tsx
import { getServiceBySlug, SERVICES, type Service } from "@/lib/services";
import LottieClient from "@/components/LottieClient";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// ---------- SEO Metadata (Enhanced) ----------
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service: Service | null = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service not found — Pakistan Top Lawyers",
      description: "The requested AI legal service could not be found.",
    };
  }

  const title = `${service.name} — AI Legal Tools for Pakistani Lawyers | Pakistan Top Lawyers`;
  const description = `${service.short} Trusted by 500+ lawyers across Pakistan. Free AI-powered legal technology for advocates, barristers, and law firms.`;
  const siteUrl = "https://pakistantoplawyers.com";

  return {
    title,
    description,
    keywords: [
      ...(service.keywords ?? []),
      "AI legal tools Pakistan",
      "Pakistani lawyers AI",
      "law tech Pakistan",
      "PTL AI tools",
      "legal technology Lahore",
      "AI advocate tools",
      "free legal AI Pakistan",
      "law firm automation",
      "court document generator",
      "Pakistani law database",
    ],
    authors: [{ name: "Pakistan Top Lawyers", url: siteUrl }],
    creator: "Pakistan Top Lawyers",
    publisher: "Pakistan Top Lawyers",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_PK",
      title,
      description,
      url: `${siteUrl}/services/${service.slug}`,
      siteName: "Pakistan Top Lawyers",
      images: service.banner
        ? [
            {
              url: `${siteUrl}${service.banner}`,
              width: 1200,
              height: 630,
              alt: `${service.name} - AI Legal Tool for Pakistani Lawyers`,
            },
          ]
        : [
            {
              url: `${siteUrl}/og-default.jpg`,
              width: 1200,
              height: 630,
              alt: "Pakistan Top Lawyers - AI Legal Tools",
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@pakistantoplawyers",
    },
    alternates: {
      canonical: `${siteUrl}/services/${service.slug}`,
    },
  };
}

// ---------- Static Generation ----------
export async function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

// ---------- Helper Data ----------
const TRUST_STATS = [
  { value: "500+", label: "Lawyers Trust Us", icon: "👨‍⚖️" },
  { value: "2,761", label: "Law Sections in Database", icon: "📚" },
  { value: "24/7", label: "AI Availability", icon: "🤖" },
  { value: "Free", label: "No Hidden Charges", icon: "✨" },
];

const WHY_CHOOSE = [
  {
    title: "Built for Pakistani Law",
    description:
      "Our AI understands PPC, CrPC, CPC, Constitution, MFLO, QSO and all major Pakistani statutes. Not a generic tool — purpose-built for Pakistani legal professionals.",
    icon: "🇵🇰",
  },
  {
    title: "Court-Ready Output",
    description:
      "Generate documents that follow proper court formats — High Court, District Court, Family Court. Proper headings, prayer clauses, and verification formats.",
    icon: "⚖️",
  },
  {
    title: "Bilingual Support",
    description:
      "Full English and Urdu support. Legal translation that maintains proper terminology. RTL formatting for Urdu documents.",
    icon: "🔤",
  },
  {
    title: "Verified Law Database",
    description:
      "Access 2,761 verified law sections from official sources. No hallucinated sections — every citation is from our validated database.",
    icon: "✅",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "PTL's AI drafter has reduced my document preparation time by 70%. The bail petition templates are exactly what I need for District Courts.",
    author: "Advocate Rizwan Ahmed",
    location: "Lahore High Court",
    avatar: "RA",
  },
  {
    quote:
      "Finally, an AI tool that understands Pakistani law! The case summarizer handles Supreme Court judgments perfectly.",
    author: "Barrister Ayesha Khan",
    location: "Karachi",
    avatar: "AK",
  },
  {
    quote:
      "The legal research feature saved me hours on a complex constitutional matter. Found relevant Article 199 precedents in minutes.",
    author: "Advocate Usman Malik",
    location: "Islamabad High Court",
    avatar: "UM",
  },
];

const FAQ_DATA = [
  {
    question: "Is Pakistan Top Lawyers free to use?",
    answer:
      "Yes! Our core AI legal tools are completely free for Pakistani lawyers and law students. We believe in democratizing legal technology access across Pakistan.",
  },
  {
    question: "How accurate is the AI-generated content?",
    answer:
      "Our AI is trained on verified Pakistani law databases with 2,761 sections. We use a 3-layer validation system to ensure accuracy. However, we always recommend lawyer review before court submission.",
  },
  {
    question: "Which courts are supported?",
    answer:
      "We support all Pakistani courts — Supreme Court, Federal Shariat Court, High Courts (Lahore, Sindh, Peshawar, Balochistan, Islamabad), District & Sessions Courts, Civil Courts, and Family Courts.",
  },
  {
    question: "Can I generate documents in Urdu?",
    answer:
      "Absolutely! All our tools support bilingual output in English and Urdu with proper RTL formatting and legal terminology.",
  },
];

// ---------- Page UI ----------
export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  // Get related services (excluding current)
  const relatedServices = SERVICES.filter((s) => s.slug !== service.slug).slice(
    0,
    6
  );

  return (
    <main className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-amber-100/40 via-transparent to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-100/30 via-transparent to-transparent rounded-full blur-3xl" />
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-16">
          {/* Breadcrumb */}
          <nav
            className="mb-8 flex items-center gap-2 text-sm"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="text-gray-500 hover:text-amber-600 transition-colors"
            >
              Home
            </Link>
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <Link
              href="/services"
              className="text-gray-500 hover:text-amber-600 transition-colors"
            >
              AI Tools
            </Link>
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-amber-700 font-medium">{service.name}</span>
          </nav>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-amber-800 text-sm font-medium">
                  Free AI Legal Tool for Pakistan
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {service.name}
                <span className="block text-amber-600 mt-2">
                  Powered by AI
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                {service.short}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href={`/ai-tools/${service.slug}`}
                  className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span>Try {service.name} Free</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>See How It Works</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-6 border-t border-gray-100 mt-6">
                <div className="flex -space-x-2">
                  {["RA", "AK", "UM", "SK"].map((initials, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-amber-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Trusted by{" "}
                    <span className="font-semibold text-gray-700">500+</span>{" "}
                    Pakistani Lawyers
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              {/* Banner Image */}
              {service.banner ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-100">
                  <Image
                    src={service.banner}
                    alt={`${service.name} - AI Legal Tool for Pakistani Lawyers`}
                    width={800}
                    height={500}
                    className="object-cover w-full h-[400px] lg:h-[500px]"
                    priority
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Floating Badge */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Powered by</p>
                          <p className="font-bold text-gray-900">
                            Pakistan Top Lawyers AI
                          </p>
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Live
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : service.lottie ? (
                <div className="relative bg-gradient-to-br from-amber-50 to-white rounded-3xl p-8 shadow-2xl shadow-gray-900/10 border border-gray-100">
                  <LottieClient
                    animationUrl={service.lottie}
                    className="w-full h-[400px]"
                    ariaLabel={`${service.name} animation`}
                  />
                </div>
              ) : (
                <div className="relative bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl p-12 shadow-2xl shadow-gray-900/10 border border-amber-200 flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <span className="text-8xl">⚖️</span>
                    <p className="mt-4 text-amber-800 font-medium">
                      {service.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400 rounded-full opacity-20 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRUST STATS BAR
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {TRUST_STATS.map((stat, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          DETAILED DESCRIPTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Lottie Animation */}
            {service.lottie && (
              <div className="order-2 lg:order-1">
                <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100 shadow-xl">
                  <LottieClient
                    animationUrl={service.lottie}
                    className="w-full h-[350px]"
                    ariaLabel={`${service.name} demonstration`}
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div
              className={`space-y-8 ${
                service.lottie ? "order-1 lg:order-2" : "lg:col-span-2 max-w-3xl mx-auto"
              }`}
            >
              <div>
                <span className="inline-block px-4 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-4">
                  How It Works
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                  {service.name} for{" "}
                  <span className="text-amber-600">Pakistani Lawyers</span>
                </h2>
              </div>

              <div className="prose prose-lg max-w-none text-gray-600">
                <p className="text-xl leading-relaxed">{service.long}</p>
              </div>

              {/* Feature List */}
              <ul className="space-y-4">
                {[
                  "Works with all Pakistani laws — PPC, CrPC, CPC, Constitution, MFLO, QSO",
                  "Generates court-ready documents in English and Urdu",
                  "Follows proper High Court and District Court formats",
                  "Instant results — no waiting, no queues",
                  "100% free for Pakistani legal professionals",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/ai-tools/${service.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Start Using {service.name}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          WHY CHOOSE PTL
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Built Specifically for{" "}
              <span className="text-amber-600">Pakistani Law</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlike generic AI tools, Pakistan Top Lawyers understands the
              nuances of Pakistani legal system, courts, and documentation
              requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE.map((item, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                {/* Hover Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Trusted by{" "}
              <span className="text-amber-600">Pakistani Advocates</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what lawyers across Pakistan are saying about our AI legal
              tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                {/* Quote Mark */}
                <div className="absolute -top-4 left-8 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-serif text-2xl">
                  &quot;
                </div>

                <p className="text-gray-700 leading-relaxed mb-6 pt-4">
                  {testimonial.quote}
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-500">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FAQ SECTION (SEO Rich)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about {service.name}
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <details
                key={index}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  <span>{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          RELATED TOOLS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Explore More{" "}
              <span className="text-amber-600">AI Legal Tools</span>
            </h2>
            <p className="text-xl text-gray-600">
              Complete suite of AI-powered tools for Pakistani lawyers
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedServices.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ⚖️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {s.short}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:text-amber-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              View All AI Legal Tools
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-8">
            <span className="text-amber-400 text-sm font-medium">
              🚀 Start Free Today — No Credit Card Required
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your
            <span className="text-amber-400"> Legal Practice?</span>
          </h2>

          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join 500+ Pakistani lawyers who are saving hours every week with
            PTL&apos;s AI-powered legal tools. Free forever for basic use.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/ai-tools/${service.slug}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-gray-900 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/25"
            >
              Try {service.name} Free
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Secure &amp; Private
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              24/7 Available
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              No Credit Card
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SEO FOOTER CONTENT
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-sm prose-gray max-w-none text-gray-500">
            <h3 className="text-lg font-semibold text-gray-700">
              About {service.name} by Pakistan Top Lawyers
            </h3>
            <p>
              {service.name} is a free AI-powered legal tool designed
              specifically for Pakistani lawyers, advocates, and legal
              professionals. Our platform covers all major Pakistani laws
              including the Pakistan Penal Code (PPC), Code of Criminal
              Procedure (CrPC), Code of Civil Procedure (CPC), Constitution of
              Pakistan 1973, Muslim Family Laws Ordinance (MFLO), and
              Qanun-e-Shahadat Order (QSO).
            </p>
            <p>
              Whether you&apos;re practicing at the Supreme Court of Pakistan,
              Federal Shariat Court, Lahore High Court, Sindh High Court,
              Peshawar High Court, Balochistan High Court, Islamabad High Court,
              or any District &amp; Sessions Court across Pakistan, our AI tools are
              built to understand the specific requirements of Pakistani legal
              documentation.
            </p>
            <p>
              Pakistan Top Lawyers (PTL) is committed to modernizing the legal
              profession in Pakistan through accessible, free AI technology. Our
              database includes 2,761 verified law sections and is continuously
              updated to reflect the latest amendments and precedents.
            </p>
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: service.name,
            description: service.short,
            applicationCategory: "LegalService",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "PKR",
            },
            provider: {
              "@type": "Organization",
              name: "Pakistan Top Lawyers",
              url: "https://pakistantoplawyers.com",
              logo: "https://pakistantoplawyers.com/ptl-logo.png",
              address: {
                "@type": "PostalAddress",
                addressCountry: "PK",
              },
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "500",
              bestRating: "5",
              worstRating: "1",
            },
          }),
        }}
      />
    </main>
  );
}