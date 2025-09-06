import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Property & Real Estate Lawyers in Pakistan | PTL",
  description:
    "Hire property and real estate lawyers in Pakistan for ownership disputes, inheritance, land transfers, DHA cases, and fraud protection. Trusted property legal services nationwide.",
  keywords:
    "property lawyer Pakistan, real estate lawyer, land dispute Pakistan, inheritance lawyer Pakistan, DHA property issues, property fraud Pakistan",
};

export default function PropertyRealEstate() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      {/* Hero Section */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
          Property & Real Estate Lawyers in Pakistan
        </h1>
        <Image
          src="/property-real-estate-lawyers-pakistan.jpg"
          alt="Property and real estate lawyers in Pakistan resolving land and ownership disputes"
          width={1200}
          height={500}
          className="w-full h-auto object-cover rounded-md mb-6"
          placeholder="blur"
          blurDataURL="/property-real-estate-lawyers-pakistan.jpg"
          loading="lazy"
        />
        <p className="text-lg text-gray-600">
          Protect your property rights with trusted legal experts handling
          disputes, inheritance cases, and real estate transactions across
          Pakistan.
        </p>
      </section>

      {/* Overview Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Secure Your Property Rights
        </h2>
        <p className="leading-relaxed text-gray-700">
          Property disputes in Pakistan often involve inheritance claims, land
          grabbing, fraudulent transfers, or housing authority (like DHA) issues.
          At <strong>Pakistan&apos;s Top Lawyers (PTL)</strong>, our property
          lawyers safeguard your ownership rights and ensure smooth transactions
          whether you are buying, selling, or inheriting property.
        </p>
      </section>

      {/* Common Cases Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Common Property & Real Estate Cases We Handle
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Ownership Disputes & Land Titles</li>
          <li>Inheritance & Property Division</li>
          <li>DHA, CDA & Housing Society Issues</li>
          <li>Property Fraud & Illegal Transfers</li>
          <li>Rent, Lease & Tenancy Agreements</li>
          <li>Property Sale, Purchase & Registration</li>
        </ul>
      </section>

      {/* Why Choose PTL Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Why Choose PTL for Property Law?
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Experienced property lawyers with strong litigation skills</li>
          <li>Specialized in inheritance & housing authority disputes</li>
          <li>Nationwide coverage for real estate cases</li>
          <li>Transparent legal advice & documentation</li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 transition"
        >
          Consult a Property Lawyer Today
        </Link>
      </section>
    </main>
  );
}
