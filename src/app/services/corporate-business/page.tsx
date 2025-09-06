import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Corporate & Business Lawyers in Pakistan | PTL",
  description:
    "Hire corporate lawyers in Pakistan for company registration, contracts, mergers, compliance, and business disputes.",
  keywords:
    "corporate lawyer Pakistan, company registration Pakistan, business lawyer, mergers acquisitions Pakistan, corporate compliance lawyer",
};

export default function CorporateBusiness() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      {/* Hero Section */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
          Corporate & Business Lawyers in Pakistan
        </h1>
        <Image
          src="/corporate-business-lawyers-pakistan.jpg"
          alt="Corporate and business lawyers in Pakistan helping with contracts, registration, and compliance"
          width={1200}
          height={500}
          className="w-full h-auto object-cover rounded-md mb-6"
          placeholder="blur"
          blurDataURL="/corporate-business-lawyers-pakistan.jpg"
          loading="lazy"
        />
        <p className="text-lg text-gray-600">
          From startups to enterprises, our corporate lawyers provide expert
          guidance on registration, contracts, compliance, and disputes.
        </p>
      </section>

      {/* Overview Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Building & Protecting Your Business
        </h2>
        <p className="leading-relaxed text-gray-700">
          Businesses in Pakistan face regulatory, contractual, and compliance
          challenges. At <strong>Pakistan&apos;s Top Lawyers (PTL)</strong>, our
          corporate lawyers assist with company formation, shareholder
          agreements, mergers, acquisitions, and dispute resolution.
        </p>
      </section>

      {/* Common Cases Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Common Corporate Services We Provide
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Company Registration (Private Ltd, LLP, Sole Proprietorship)</li>
          <li>Shareholder & Partnership Agreements</li>
          <li>Mergers & Acquisitions</li>
          <li>Contract Drafting & Review</li>
          <li>Corporate Compliance & SECP Filings</li>
          <li>Business Dispute Resolution</li>
        </ul>
      </section>

      {/* Why Choose PTL Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Why Choose PTL for Corporate Law?
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Expertise in corporate & commercial law</li>
          <li>Trusted by startups, SMEs & enterprises</li>
          <li>End-to-end legal support for businesses</li>
          <li>Compliance-focused, minimizing legal risks</li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 transition"
        >
          Speak to a Corporate Lawyer Today
        </Link>
      </section>
    </main>
  );
}
